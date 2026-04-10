import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function verifyApiKey(req: Request): boolean {
  const key = req.headers.get("x-api-key");
  const expected = Deno.env.get("CRM_API_KEY");
  if (!expected) throw new Error("CRM_API_KEY not configured");
  return key === expected;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!verifyApiKey(req)) {
      return json({ error: "Invalid or missing API key" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/crm-api\/?/, "/").replace(/\/+$/, "") || "/";
    const method = req.method;

    // GET /candidates
    if (method === "GET" && path === "/candidates") {
      const { data, error } = await supabase
        .from("crm_contacts")
        .select("id, first_name, last_name, status, job_title, primary_company_id")
        .eq("contact_type", "candidate")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) return json({ error: error.message }, 500);

      // Enrich with company names and active searches
      const companyIds = [...new Set(data.filter(c => c.primary_company_id).map(c => c.primary_company_id))];
      const contactIds = data.map(c => c.id);

      const [companiesRes, pipelineRes] = await Promise.all([
        companyIds.length > 0
          ? supabase.from("crm_companies").select("id, name").in("id", companyIds)
          : { data: [], error: null },
        contactIds.length > 0
          ? supabase.from("crm_pipeline_items").select("contact_id, status, job_id, crm_jobs(id, name, status)").in("contact_id", contactIds)
          : { data: [], error: null },
      ]);

      const companyMap = Object.fromEntries((companiesRes.data || []).map(c => [c.id, c.name]));
      const pipelineByContact: Record<string, unknown[]> = {};
      for (const pi of (pipelineRes.data || [])) {
        if (!pipelineByContact[pi.contact_id]) pipelineByContact[pi.contact_id] = [];
        pipelineByContact[pi.contact_id].push({
          pipeline_status: pi.status,
          search: pi.crm_jobs,
        });
      }

      const candidates = data.map(c => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        name: [c.first_name, c.last_name].filter(Boolean).join(" "),
        status: c.status,
        job_title: c.job_title,
        company: companyMap[c.primary_company_id!] || null,
        searches: pipelineByContact[c.id] || [],
      }));

      return json({ candidates, count: candidates.length });
    }

    // POST /candidates
    if (method === "POST" && path === "/candidates") {
      const body = await req.json();
      const { first_name, last_name, job_title, email, phone, company_name, status } = body;

      if (!last_name) return json({ error: "last_name is required" }, 400);

      // Create contact
      const { data: contact, error: contactErr } = await supabase
        .from("crm_contacts")
        .insert({
          first_name: first_name || null,
          last_name,
          job_title: job_title || null,
          contact_type: "candidate",
          status: status || "active",
          source: "api",
          source_detail: "Sonoma AI",
        })
        .select("id")
        .single();

      if (contactErr) return json({ error: contactErr.message }, 500);

      // Add email if provided
      if (email) {
        await supabase.from("crm_contact_emails").insert({
          contact_id: contact.id,
          value: email,
          category: "work",
          is_primary: true,
        });
      }

      // Add phone if provided
      if (phone) {
        await supabase.from("crm_contact_phones").insert({
          contact_id: contact.id,
          value: phone,
          category: "work",
          is_primary: true,
        });
      }

      // Link to company if provided
      if (company_name) {
        // Find or create company
        const { data: existing } = await supabase
          .from("crm_companies")
          .select("id")
          .ilike("name", company_name)
          .maybeSingle();

        let companyId = existing?.id;
        if (!companyId) {
          const { data: newCo } = await supabase
            .from("crm_companies")
            .insert({ name: company_name, company_type: "client" })
            .select("id")
            .single();
          companyId = newCo?.id;
        }

        if (companyId) {
          await supabase
            .from("crm_contacts")
            .update({ primary_company_id: companyId })
            .eq("id", contact.id);

          await supabase.from("crm_career_history").insert({
            contact_id: contact.id,
            company_id: companyId,
            company_name,
            job_title: job_title || null,
            is_current: true,
            entry_type: "experience",
          });
        }
      }

      return json({ id: contact.id, message: "Candidate created" }, 201);
    }

    // GET /clients
    if (method === "GET" && path === "/clients") {
      const { data: companies, error } = await supabase
        .from("crm_companies")
        .select("id, name, domain, status, company_type")
        .eq("company_type", "client")
        .order("name")
        .limit(500);

      if (error) return json({ error: error.message }, 500);

      const companyIds = companies.map(c => c.id);
      const { data: jobs } = companyIds.length > 0
        ? await supabase
            .from("crm_jobs")
            .select("id, name, status, company_id")
            .in("company_id", companyIds)
            .in("status", ["open", "active"])
        : { data: [] };

      const jobsByCompany: Record<string, unknown[]> = {};
      for (const j of (jobs || [])) {
        if (!jobsByCompany[j.company_id!]) jobsByCompany[j.company_id!] = [];
        jobsByCompany[j.company_id!].push({ id: j.id, name: j.name, status: j.status });
      }

      // Get primary contacts for each company
      const { data: contacts } = companyIds.length > 0
        ? await supabase
            .from("crm_contacts")
            .select("id, first_name, last_name, job_title, primary_company_id")
            .in("primary_company_id", companyIds)
            .eq("contact_type", "client")
        : { data: [] };

      const contactsByCompany: Record<string, unknown[]> = {};
      for (const c of (contacts || [])) {
        if (!contactsByCompany[c.primary_company_id!]) contactsByCompany[c.primary_company_id!] = [];
        contactsByCompany[c.primary_company_id!].push({
          id: c.id,
          name: [c.first_name, c.last_name].filter(Boolean).join(" "),
          title: c.job_title,
        });
      }

      const clients = companies.map(co => ({
        id: co.id,
        name: co.name,
        domain: co.domain,
        status: co.status,
        active_searches: jobsByCompany[co.id] || [],
        contacts: contactsByCompany[co.id] || [],
      }));

      return json({ clients, count: clients.length });
    }

    // GET /searches
    if (method === "GET" && path === "/searches") {
      const { data: jobs, error } = await supabase
        .from("crm_jobs")
        .select("id, name, status, job_title, company_id, location, job_type, created_at")
        .in("status", ["open", "active"])
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) return json({ error: error.message }, 500);

      const companyIds = [...new Set(jobs.filter(j => j.company_id).map(j => j.company_id))];
      const jobIds = jobs.map(j => j.id);

      const [companiesRes, pipelineRes] = await Promise.all([
        companyIds.length > 0
          ? supabase.from("crm_companies").select("id, name").in("id", companyIds)
          : { data: [], error: null },
        jobIds.length > 0
          ? supabase.from("crm_pipeline_items").select("id, job_id, contact_id, status, crm_contacts(id, first_name, last_name)").in("job_id", jobIds)
          : { data: [], error: null },
      ]);

      const companyMap = Object.fromEntries((companiesRes.data || []).map(c => [c.id, c.name]));
      const pipelineByJob: Record<string, unknown[]> = {};
      for (const pi of (pipelineRes.data || [])) {
        if (!pipelineByJob[pi.job_id]) pipelineByJob[pi.job_id] = [];
        const contact = pi.crm_contacts as { id: string; first_name: string | null; last_name: string } | null;
        pipelineByJob[pi.job_id].push({
          pipeline_item_id: pi.id,
          contact_id: pi.contact_id,
          candidate_name: contact ? [contact.first_name, contact.last_name].filter(Boolean).join(" ") : null,
          stage: pi.status,
        });
      }

      const searches = jobs.map(j => ({
        id: j.id,
        name: j.name,
        job_title: j.job_title,
        status: j.status,
        client: companyMap[j.company_id!] || null,
        location: j.location,
        job_type: j.job_type,
        created_at: j.created_at,
        candidates_in_process: pipelineByJob[j.id] || [],
      }));

      return json({ searches, count: searches.length });
    }

    // POST /activity-log
    if (method === "POST" && path === "/activity-log") {
      const body = await req.json();
      const { contact_id, company_id, job_id, activity_type, subject, body: actBody, direction } = body;

      if (!contact_id && !company_id) {
        return json({ error: "contact_id or company_id is required" }, 400);
      }
      if (!activity_type) {
        return json({ error: "activity_type is required (e.g. note, call, email, meeting)" }, 400);
      }

      const { data, error } = await supabase
        .from("crm_activities")
        .insert({
          contact_id: contact_id || null,
          company_id: company_id || null,
          job_id: job_id || null,
          activity_type,
          subject: subject || null,
          body: actBody || null,
          direction: direction || null,
          completed: true,
        })
        .select("id")
        .single();

      if (error) return json({ error: error.message }, 500);

      return json({ id: data.id, message: "Activity logged" }, 201);
    }

    return json({
      error: "Not found",
      available_endpoints: [
        "GET /candidates",
        "POST /candidates",
        "GET /clients",
        "GET /searches",
        "POST /activity-log",
      ],
    }, 404);
  } catch (e) {
    console.error("crm-api error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
