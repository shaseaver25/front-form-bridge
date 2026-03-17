import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Get all connections with auto-sync enabled
    const { data: connections, error } = await supabase
      .from("gmail_connections")
      .select("id, email, user_id")
      .eq("is_active", true)
      .eq("auto_sync_enabled", true);

    if (error) {
      console.error("Error fetching connections:", error);
      throw error;
    }

    if (!connections || connections.length === 0) {
      console.log("No auto-sync connections found");
      return new Response(
        JSON.stringify({ message: "No connections to sync", synced: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${connections.length} connections to auto-sync`);

    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    for (const conn of connections) {
      try {
        const syncResponse = await fetch(
          `${supabaseUrl}/functions/v1/gmail-sync`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ connection_id: conn.id }),
          }
        );

        if (!syncResponse.ok) {
          const errText = await syncResponse.text();
          console.error(`Sync failed for ${conn.email}: ${errText}`);
          results.push({ email: conn.email, success: false, error: errText });
        } else {
          const syncData = await syncResponse.json();
          console.log(`Synced ${conn.email}: ${syncData.processed} messages`);
          results.push({ email: conn.email, success: true });
        }
      } catch (err) {
        console.error(`Error syncing ${conn.email}:`, err);
        results.push({ email: conn.email, success: false, error: (err as Error).message });
      }
    }

    return new Response(
      JSON.stringify({ synced: results.filter((r) => r.success).length, total: connections.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Auto-sync error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
