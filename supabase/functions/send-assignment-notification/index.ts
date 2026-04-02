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

function base64urlEncode(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the calling user
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { assignee_user_id, item_name, item_type, project_name, assigned_by_user_id, item_id } = body;

    if (!assignee_user_id || !item_name || !item_type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get assignee's email and name
    const { data: assigneeProfile } = await adminClient
      .from("user_profiles")
      .select("email, first_name, last_name")
      .eq("id", assignee_user_id)
      .single();

    if (!assigneeProfile?.email) {
      return new Response(JSON.stringify({ error: "Assignee email not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the assigner's Gmail connection (the person doing the assigning)
    const senderId = assigned_by_user_id || user.id;
    const { data: gmailConnection } = await adminClient
      .from("gmail_connections")
      .select("*")
      .eq("user_id", senderId)
      .eq("is_active", true)
      .maybeSingle();

    if (!gmailConnection) {
      console.error(`No Gmail connection for user ${senderId} — skipping notification`);
      return new Response(JSON.stringify({ success: true, email_sent: false, reason: "No Gmail connection for sender" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get assigner's name
    let assignerName = "A team member";
    if (assigned_by_user_id) {
      const { data: assignerProfile } = await adminClient
        .from("user_profiles")
        .select("first_name, last_name")
        .eq("id", assigned_by_user_id)
        .single();

      if (assignerProfile) {
        assignerName = [assignerProfile.first_name, assignerProfile.last_name].filter(Boolean).join(" ") || "A team member";
      }
    }

    const assigneeName = assigneeProfile.first_name || "there";
    const siteUrl = req.headers.get("origin") || "https://front-form-bridge.lovable.app";

    // Build appropriate link
    let actionUrl = siteUrl;
    if (item_type === "project" && item_id) {
      actionUrl = `${siteUrl}/projects/${item_id}`;
    } else if (item_type === "task" && item_id) {
      actionUrl = `${siteUrl}/projects/${item_id}`;
    }

    const isTask = item_type === "task";
    const subjectLine = isTask
      ? `You've been assigned a task: ${item_name}`
      : `You've been added to a project: ${item_name}`;

    const bodyText = isTask
      ? `<p><strong>${assignerName}</strong> has assigned you a task: <strong>${item_name}</strong>${project_name ? ` in the project <strong>${project_name}</strong>` : ""}.</p>`
      : `<p><strong>${assignerName}</strong> has assigned you to the project: <strong>${item_name}</strong>.</p>`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #1a1a2e; font-size: 24px; margin: 0;">AvidEdge</h1>
        </div>
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">${isTask ? "New Task Assignment" : "New Project Assignment"}</h2>
          <p>Hi ${assigneeName},</p>
          ${bodyText}
          <p>Log in to view the details and get started.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionUrl}" 
               style="background-color: #4F46E5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View ${isTask ? "Task" : "Project"}
            </a>
          </div>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated notification from AvidEdge.
        </p>
      </div>
    `;

    // Get valid Gmail access token
    const accessToken = await getValidToken(adminClient, gmailConnection);

    // Build and send via Gmail API
    const assigneeFullName = [assigneeProfile.first_name, assigneeProfile.last_name].filter(Boolean).join(" ");
    const mimeMessage = buildMimeMessage(
      gmailConnection.email,
      assigneeProfile.email,
      assigneeFullName,
      subjectLine,
      htmlBody
    );

    const encodedMessage = base64urlEncode(mimeMessage);

    console.log(`Sending assignment notification from ${gmailConnection.email} to ${assigneeProfile.email}`);
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
      // Best-effort — don't fail the assignment
      return new Response(JSON.stringify({ success: true, email_sent: false, reason: "Gmail send failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sendData = await sendResponse.json();
    console.log(`Assignment notification sent, Gmail message ID: ${sendData.id}`);

    return new Response(JSON.stringify({ success: true, email_sent: true, gmail_message_id: sendData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    // Best-effort — don't block the caller
    return new Response(JSON.stringify({ success: true, email_sent: false, reason: "Internal error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
