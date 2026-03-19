import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// Gmail scopes: read emails + send (for CRM outreach)
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

function getRedirectUri(): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  return `${supabaseUrl}/functions/v1/gmail-oauth`;
}

function getAppUrl(): string {
  return Deno.env.get("APP_URL") || "https://front-form-bridge.lovable.app";
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!googleClientId || !googleClientSecret) {
    // Return a structured response so the frontend can show a helpful message
    return new Response(
      JSON.stringify({
        configured: false,
        message: "Gmail integration is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Supabase secrets.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }

  // Service-role client for DB writes (callback path)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);

    // =========================================
    // CALLBACK: Google redirects here after user authorizes
    // =========================================
    if (url.searchParams.has("code")) {
      console.log("Gmail OAuth callback received with authorization code");
      const code = url.searchParams.get("code")!;
      const state = url.searchParams.get("state") || "";

      // Decode user_id from state parameter
      let userId: string;
      try {
        const stateData = JSON.parse(atob(state));
        userId = stateData.user_id;
      } catch {
        return new Response("Invalid state parameter", { status: 400 });
      }

      if (!userId) {
        return new Response("Missing user_id in state", { status: 400 });
      }

      // Exchange authorization code for tokens
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: googleClientId,
          client_secret: googleClientSecret,
          redirect_uri: getRedirectUri(),
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Token exchange failed:", errorText);
        console.error("Redirect URI used:", getRedirectUri());
        return Response.redirect(
          `${getAppUrl()}/settings/gmail?error=token_exchange_failed`,
          302
        );
      }

      const tokens = await tokenResponse.json();
      const { access_token, refresh_token, expires_in } = tokens;
      console.log("Token exchange successful, got access_token:", !!access_token, "refresh_token:", !!refresh_token);

      // Get the user's email address from Google
      const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      let email = "unknown";
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        email = userInfo.email || "unknown";
      }

      const tokenExpiresAt = new Date(
        Date.now() + (expires_in || 3600) * 1000
      ).toISOString();

      // Upsert the connection record
      // First check if a connection already exists for this user
      const { data: existing } = await supabase
        .from("gmail_connections")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        // Update existing connection
        await supabase
          .from("gmail_connections")
          .update({
            email,
            access_token,
            refresh_token: refresh_token || undefined,
            token_expires_at: tokenExpiresAt,
            is_active: true,
          })
          .eq("id", existing.id);
      } else {
        // Create new connection
        await supabase.from("gmail_connections").insert({
          user_id: userId,
          email,
          access_token,
          refresh_token,
          token_expires_at: tokenExpiresAt,
          is_active: true,
          auto_sync_enabled: false,
        });
      }

      console.log(`Gmail connected for user ${userId} (${email})`);

      // Redirect the user back to the Gmail settings page
      const redirectUrl = `${getAppUrl()}/settings/gmail?connected=true`;
      console.log("Redirecting to:", redirectUrl);
      return Response.redirect(redirectUrl, 302);
    }

    // =========================================
    // INITIATE: Frontend calls this to start OAuth flow
    // =========================================
    if (req.method === "POST") {
      const body = await req.json();

      if (body.action === "initiate") {
        // Get the authenticated user from the Authorization header
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

        // Encode user ID in state parameter so we can identify them on callback
        const state = btoa(JSON.stringify({ user_id: user.id }));

        // Build the Google OAuth URL
        const authUrl = new URL(GOOGLE_AUTH_URL);
        authUrl.searchParams.set("client_id", googleClientId);
        authUrl.searchParams.set("redirect_uri", getRedirectUri());
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", SCOPES);
        authUrl.searchParams.set("access_type", "offline"); // Gets refresh_token
        authUrl.searchParams.set("prompt", "consent"); // Always show consent to get refresh_token
        authUrl.searchParams.set("state", state);

        return new Response(
          JSON.stringify({ authUrl: authUrl.toString(), configured: true }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  } catch (error: unknown) {
    console.error("Gmail OAuth error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
