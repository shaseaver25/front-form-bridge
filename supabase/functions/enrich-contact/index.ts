import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { contact_id } = await req.json();
    if (!contact_id) {
      return new Response(JSON.stringify({ error: "contact_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for DB writes
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch contact + emails
    const { data: contact, error: contactErr } = await adminClient
      .from("crm_contacts")
      .select("id, first_name, last_name, job_title")
      .eq("id", contact_id)
      .single();

    if (contactErr || !contact) {
      return new Response(JSON.stringify({ error: "Contact not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: emails } = await adminClient
      .from("crm_contact_emails")
      .select("value, is_primary")
      .eq("contact_id", contact_id)
      .order("is_primary", { ascending: false })
      .limit(1);

    const email = emails?.[0]?.value;

    if (!email && !contact.first_name && !contact.last_name) {
      return new Response(
        JSON.stringify({ error: "Contact has no email or name to enrich with" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Apollo People Match
    const apolloKey = Deno.env.get("APOLLO_API_KEY");
    if (!apolloKey) {
      return new Response(JSON.stringify({ error: "APOLLO_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apolloBody: Record<string, string> = {};
    if (email) apolloBody.email = email;
    if (contact.first_name) apolloBody.first_name = contact.first_name;
    if (contact.last_name) apolloBody.last_name = contact.last_name;

    const apolloRes = await fetch("https://api.apollo.io/api/v1/people/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apolloKey,
      },
      body: JSON.stringify(apolloBody),
    });

    if (!apolloRes.ok) {
      const errText = await apolloRes.text();
      console.error("Apollo API error:", apolloRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Apollo API error: ${apolloRes.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apolloData = await apolloRes.json();
    const person = apolloData.person;

    if (!person) {
      // Update status to show we tried
      await adminClient
        .from("crm_contacts")
        .update({
          enrichment_status: "not_found",
          enrichment_source: "apollo",
          enrichment_updated_at: new Date().toISOString(),
        })
        .eq("id", contact_id);

      return new Response(
        JSON.stringify({ success: true, enriched: false, message: "No match found in Apollo" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update contact with enrichment data
    const updateFields: Record<string, unknown> = {
      enrichment_data: person,
      enrichment_status: "enriched",
      enrichment_source: "apollo",
      enrichment_updated_at: new Date().toISOString(),
    };

    // Only update job_title if contact doesn't have one
    if (!contact.job_title && person.title) {
      updateFields.job_title = person.title;
    }

    await adminClient
      .from("crm_contacts")
      .update(updateFields)
      .eq("id", contact_id);

    // Add LinkedIn URL if found
    if (person.linkedin_url) {
      const { data: existingUrls } = await adminClient
        .from("crm_contact_urls")
        .select("id")
        .eq("contact_id", contact_id)
        .eq("category", "linkedin")
        .limit(1);

      if (!existingUrls?.length) {
        await adminClient.from("crm_contact_urls").insert({
          contact_id,
          value: person.linkedin_url,
          category: "linkedin",
          is_primary: false,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, enriched: true, person }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("enrich-contact error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
