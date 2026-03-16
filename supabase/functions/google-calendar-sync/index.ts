import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API_BASE =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

/**
 * Refresh the Google access token using the refresh token.
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
    .from("google_calendar_connections")
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
      throw new Error(
        "No refresh token available. Please reconnect Google Calendar."
      );
    }
    return await refreshAccessToken(
      supabase,
      connection.id,
      connection.refresh_token
    );
  }

  return connection.access_token;
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

    // Fetch the user's Google Calendar connection
    const { data: connection, error: connError } = await supabase
      .from("google_calendar_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({
          error: "No active Google Calendar connection found",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Get a valid access token
    const accessToken = await getValidToken(supabase, connection);

    // Fetch events from now to 30 days out + 7 days back
    const timeMin = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const timeMax = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const calendarUrl = new URL(CALENDAR_API_BASE);
    calendarUrl.searchParams.set("timeMin", timeMin);
    calendarUrl.searchParams.set("timeMax", timeMax);
    calendarUrl.searchParams.set("maxResults", "100");
    calendarUrl.searchParams.set("singleEvents", "true");
    calendarUrl.searchParams.set("orderBy", "startTime");

    const eventsResponse = await fetch(calendarUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error("Calendar API error:", errorText);
      throw new Error(`Calendar API error: ${eventsResponse.status}`);
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.items || [];

    console.log(`Found ${events.length} calendar events to sync`);

    let processed = 0;
    let errors = 0;

    for (const event of events) {
      try {
        // Extract attendee emails
        const attendees = (event.attendees || []).map((a: any) => ({
          email: a.email,
          displayName: a.displayName || "",
          responseStatus: a.responseStatus || "needsAction",
          self: a.self || false,
        }));

        // Parse start/end times (handle all-day vs timed events)
        const startTime = event.start?.dateTime
          ? event.start.dateTime
          : event.start?.date
          ? `${event.start.date}T00:00:00Z`
          : null;

        const endTime = event.end?.dateTime
          ? event.end.dateTime
          : event.end?.date
          ? `${event.end.date}T23:59:59Z`
          : null;

        // Upsert into google_calendar_events
        await supabase.from("google_calendar_events").upsert(
          {
            user_id: user.id,
            connection_id: connection.id,
            google_event_id: event.id,
            summary: event.summary || "(No title)",
            description: event.description || null,
            start_time: startTime,
            end_time: endTime,
            attendees,
            location: event.location || null,
            html_link: event.htmlLink || null,
            status: event.status || "confirmed",
          },
          {
            onConflict: "user_id,google_event_id",
          }
        );

        processed++;
      } catch (eventError) {
        console.error(`Error processing event ${event.id}:`, eventError);
        errors++;
      }
    }

    // Update last sync timestamp
    await supabase
      .from("google_calendar_connections")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", connection.id);

    console.log(
      `Calendar sync complete: ${processed} processed, ${errors} errors`
    );

    return new Response(
      JSON.stringify({
        processed,
        errors,
        total: events.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Google Calendar sync error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
