import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

async function refreshAccessToken(
  supabase: any,
  connectionId: string,
  refreshToken: string
): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${errorText}`);
  }

  const tokens = await response.json();
  const newExpiry = new Date(
    Date.now() + (tokens.expires_in || 3600) * 1000
  ).toISOString();

  await supabase
    .from("gmail_connections")
    .update({
      access_token: tokens.access_token,
      token_expires_at: newExpiry,
    })
    .eq("id", connectionId);

  return tokens.access_token;
}

async function getValidToken(supabase: any, connection: any): Promise<string> {
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();

  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    if (!connection.refresh_token) {
      throw new Error("No refresh token available. Please reconnect Gmail.");
    }
    return await refreshAccessToken(
      supabase,
      connection.id,
      connection.refresh_token
    );
  }

  return connection.access_token;
}

function buildMimeMessage(
  from: string,
  to: string,
  toName: string,
  subject: string,
  bodyHtml: string
): string {
  const boundary = "boundary_" + Date.now();
  const toHeader = toName ? `"${toName}" <${to}>` : to;

  const messageParts = [
    `From: ${from}`,
    `To: ${toHeader}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    bodyHtml.replace(/<[^>]*>/g, ""),
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    ``,
    bodyHtml,
    ``,
    `--${boundary}--`,
  ];

  return messageParts.join("\r\n");
}

// Base64url encode for Gmail API
function base64urlEncode(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const body = await req.json();
    const {
      recipient_email,
      recipient_name,
      subject,
      body_html,
      constituent_id,
      template_id,
      category,
    } = body;

    if (!recipient_email || !subject || !body_html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: recipient_email, subject, body_html" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get user's Gmail connection
    const { data: connection, error: connError } = await supabase
      .from("gmail_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: "No active Gmail connection. Please connect Gmail in Settings." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Get valid access token (refresh if needed)
    const accessToken = await getValidToken(supabase, connection);

    // Build MIME message
    const mimeMessage = buildMimeMessage(
      connection.email,
      recipient_email,
      recipient_name || "",
      subject,
      body_html
    );

    const encodedMessage = base64urlEncode(mimeMessage);

    // Send via Gmail API
    console.log(`Sending email from ${connection.email} to ${recipient_email}`);
    const sendResponse = await fetch(`${GMAIL_API_BASE}/messages/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      console.error("Gmail send error:", errorText);
      throw new Error(`Gmail API error: ${sendResponse.status} - ${errorText}`);
    }

    const sendData = await sendResponse.json();
    console.log(`Email sent successfully, Gmail message ID: ${sendData.id}`);

    // Log as CRM activity if constituent_id provided
    if (constituent_id) {
      await supabase.from("crm_activities").insert({
        activity_type: "email",
        contact_id: constituent_id,
        subject: subject,
        body: body_html,
        direction: "outbound",
        completed: true,
        completed_at: new Date().toISOString(),
        created_by: user.id,
      });
      console.log(`Logged email activity for contact ${constituent_id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        gmail_message_id: sendData.id,
        thread_id: sendData.threadId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    console.error("Send Gmail email error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
