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

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader! } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { company_id } = await req.json();
    const adminClient = createClient(supabaseUrl, supabaseKey);

    // Fetch company, profile, stakeholders
    const [companyRes, profileRes, stakeholdersRes] = await Promise.all([
      adminClient.from("crm_companies").select("*").eq("id", company_id).single(),
      adminClient.from("company_profiles").select("*").eq("company_id", company_id).maybeSingle(),
      adminClient.from("discovery_stakeholders").select("*").eq("company_id", company_id),
    ]);

    const company = companyRes.data;
    const profile = profileRes.data;
    const stakeholders = stakeholdersRes.data ?? [];

    if (!company) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notesText = stakeholders
      .map((s) => `[${s.stakeholder_name} - ${s.stakeholder_role || "Unknown Role"}]: ${s.notes || "No notes"}`)
      .join("\n\n");

    const prompt = `You are an executive search consultant analyzing discovery notes about ${company.name}.

Based on these stakeholder interview notes, synthesize insights for the company profile fields listed below. Only output fields where you have enough information. Return a JSON object with field names as keys and proposed text as values.

Fields to consider:
- company_story: What this company does and why they matter
- where_they_are: Current state of the company
- where_they_are_going: Future direction and growth plans
- strategic_posture: One of "Builder", "Scaler", or "Fixer"
- culture_summary: Company culture and values
- decision_making_style: How decisions are made
- competitive_landscape: Key competitors and market position
- key_decision_makers: Key people and their roles

Current profile (for context):
${JSON.stringify(profile ?? {}, null, 2)}

Discovery Notes:
${notesText || "No notes available yet."}

Respond with ONLY a valid JSON object. No markdown, no explanation.`;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const anthropicData = await anthropicRes.json();
    const aiText = anthropicData.content?.[0]?.text ?? "{}";
    let proposed: Record<string, string>;
    try {
      proposed = JSON.parse(aiText);
    } catch {
      proposed = {};
    }

    // Build diff
    const diff: Record<string, { current: string; proposed: string }> = {};
    for (const [field, value] of Object.entries(proposed)) {
      if (typeof value === "string" && value.trim()) {
        diff[field] = {
          current: (profile as Record<string, unknown>)?.[field]?.toString() ?? "",
          proposed: value,
        };
      }
    }

    // Log synthesis
    await adminClient.from("profile_synthesis_log").insert({
      company_id,
      synthesized_by: user.id,
      fields_updated: Object.keys(diff),
      source_stakeholder_count: stakeholders.length,
    });

    return new Response(JSON.stringify({ diff }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
