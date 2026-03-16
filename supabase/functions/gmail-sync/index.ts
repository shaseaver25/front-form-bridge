import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

/**
 * Refresh the Google access token using the refresh token.
 * Returns the new access token and updates the database.
 */
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

  // Update the stored access token
  await supabase
    .from("gmail_connections")
    .update({
      access_token: tokens.access_token,
      token_expires_at: newExpiry,
    })
    .eq("id", connectionId);

  return tokens.access_token;
}

/**
 * Get a valid access token, refreshing if expired.
 */
async function getValidToken(
  supabase: any,
  connection: any
): Promise<string> {
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();

  // Refresh if token expires within 5 minutes
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

/**
 * Parse email address from a header value like "John Doe <john@example.com>"
 */
function parseEmailHeader(header: string): { name: string; email: string } {
  const match = header.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].replace(/"/g, "").trim(), email: match[2].trim() };
  }
  return { name: "", email: header.trim() };
}

/**
 * Extract header value from Gmail message headers array
 */
function getHeader(headers: any[], name: string): string {
  const header = headers.find(
    (h: any) => h.name.toLowerCase() === name.toLowerCase()
  );
  return header?.value || "";
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Authenticate the calling user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const body = await req.json();

    if (body.action !== "sync") {
      return new Response(
        JSON.stringify({ error: "Unknown action" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Fetch the user's Gmail connection
    const { data: connection, error: connError } = await supabase
      .from("gmail_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: "No active Gmail connection found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Get a valid access token
    const accessToken = await getValidToken(supabase, connection);

    // Fetch recent messages (last 50, from the last 7 days)
    const sevenDaysAgo = Math.floor(
      (Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000
    );
    const query = `after:${sevenDaysAgo}`;

    const listResponse = await fetch(
      `${GMAIL_API_BASE}/messages?q=${encodeURIComponent(query)}&maxResults=50`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error("Gmail list error:", errorText);
      throw new Error(`Gmail API error: ${listResponse.status}`);
    }

    const listData = await listResponse.json();
    const messageIds = listData.messages || [];

    console.log(`Found ${messageIds.length} messages to sync`);

    let processed = 0;
    let errors = 0;

    // Fetch each message's metadata (in batches to avoid rate limits)
    for (const msg of messageIds) {
      try {
        const msgResponse = await fetch(
          `${GMAIL_API_BASE}/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Subject&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!msgResponse.ok) {
          errors++;
          continue;
        }

        const msgData = await msgResponse.json();
        const headers = msgData.payload?.headers || [];

        const fromRaw = getHeader(headers, "From");
        const { name: fromName, email: fromEmail } = parseEmailHeader(fromRaw);

        const toRaw = getHeader(headers, "To");
        const toEmails = toRaw
          .split(",")
          .map((e: string) => parseEmailHeader(e.trim()).email)
          .filter(Boolean);

        const ccRaw = getHeader(headers, "Cc");
        const ccEmails = ccRaw
          ? ccRaw
              .split(",")
              .map((e: string) => parseEmailHeader(e.trim()).email)
              .filter(Boolean)
          : [];

        const internalDate = msgData.internalDate
          ? new Date(parseInt(msgData.internalDate)).toISOString()
          : null;

        // Upsert into gmail_messages
        await supabase.from("gmail_messages").upsert(
          {
            user_id: user.id,
            connection_id: connection.id,
            gmail_message_id: msg.id,
            thread_id: msgData.threadId || null,
            subject: getHeader(headers, "Subject"),
            from_email: fromEmail,
            from_name: fromName,
            to_emails: toEmails,
            cc_emails: ccEmails,
            snippet: msgData.snippet || "",
            internal_date: internalDate,
            label_ids: msgData.labelIds || [],
            is_read: !(msgData.labelIds || []).includes("UNREAD"),
          },
          {
            onConflict: "user_id,gmail_message_id",
          }
        );

        processed++;

        // Small delay to avoid Gmail API rate limits
        if (processed % 10 === 0) {
          await new Promise((r) => setTimeout(r, 200));
        }
      } catch (msgError) {
        console.error(`Error processing message ${msg.id}:`, msgError);
        errors++;
      }
    }

    // Update last sync timestamp
    await supabase
      .from("gmail_connections")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", connection.id);

    console.log(
      `Gmail sync complete: ${processed} processed, ${errors} errors`
    );

    return new Response(
      JSON.stringify({
        processed,
        errors,
        total: messageIds.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Gmail sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
