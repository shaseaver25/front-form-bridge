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
        const rawContact = pi.crm_contacts as unknown;
        const contact = (Array.isArray(rawContact) ? rawContact[0] : rawContact) as { id: string; first_name: string | null; last_name: string } | null;
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

    // GET /activity-log
    if (method === "GET" && path === "/activity-log") {
      const contactId = url.searchParams.get("contact_id");
      const companyId = url.searchParams.get("company_id");
      const jobId = url.searchParams.get("job_id");
      const activityType = url.searchParams.get("activity_type");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500);

      let query = supabase
        .from("crm_activities")
        .select("id, contact_id, company_id, job_id, activity_type, subject, body, direction, completed, scheduled_at, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (contactId) query = query.eq("contact_id", contactId);
      if (companyId) query = query.eq("company_id", companyId);
      if (jobId) query = query.eq("job_id", jobId);
      if (activityType) query = query.eq("activity_type", activityType);

      const { data, error } = await query;
      if (error) return json({ error: error.message }, 500);

      return json({ activities: data, count: data.length });
    }

    // GET /contacts (all contact types) — supports ?contact_type=, ?search=, ?limit=
    if (method === "GET" && path === "/contacts") {
      const contactType = url.searchParams.get("contact_type");
      const search = url.searchParams.get("search");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 500);

      let query = supabase
        .from("crm_contacts")
        .select("id, first_name, last_name, status, contact_type, job_title, primary_company_id, linkedin_url, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (contactType) query = query.eq("contact_type", contactType);
      if (search) {
        const term = `%${search}%`;
        query = query.or(`first_name.ilike.${term},last_name.ilike.${term},job_title.ilike.${term}`);
      }

      const { data, error } = await query;
      if (error) return json({ error: error.message }, 500);

      const companyIds = [...new Set(data.filter(c => c.primary_company_id).map(c => c.primary_company_id))];
      const { data: companies } = companyIds.length > 0
        ? await supabase.from("crm_companies").select("id, name").in("id", companyIds)
        : { data: [] };
      const companyMap = Object.fromEntries((companies || []).map(c => [c.id, c.name]));

      const contacts = data.map(c => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        name: [c.first_name, c.last_name].filter(Boolean).join(" "),
        status: c.status,
        contact_type: c.contact_type,
        job_title: c.job_title,
        company: companyMap[c.primary_company_id!] || null,
        linkedin_url: c.linkedin_url,
        created_at: c.created_at,
      }));

      return json({ contacts, count: contacts.length });
    }

    // GET /contacts/{id} — single contact with full details
    const contactIdMatch = path.match(/^\/contacts\/([a-f0-9-]{36})$/i);
    if (method === "GET" && contactIdMatch) {
      const id = contactIdMatch[1];
      const { data: contact, error } = await supabase
        .from("crm_contacts")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) return json({ error: error.message }, 500);
      if (!contact) return json({ error: "Contact not found" }, 404);

      const [emailsRes, phonesRes, companyRes, careerRes, notesRes] = await Promise.all([
        supabase.from("crm_contact_emails").select("value, category, is_primary").eq("contact_id", id),
        supabase.from("crm_contact_phones").select("value, category, extension, is_primary").eq("contact_id", id),
        contact.primary_company_id
          ? supabase.from("crm_companies").select("id, name, domain").eq("id", contact.primary_company_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from("crm_career_history").select("company_name, job_title, started_at, ended_at, is_current, entry_type, description").eq("contact_id", id).order("started_at", { ascending: false }),
        supabase.from("crm_contact_notes").select("id, content, is_pinned, created_at").eq("contact_id", id).order("created_at", { ascending: false }).limit(50),
      ]);

      return json({
        ...contact,
        name: [contact.first_name, contact.last_name].filter(Boolean).join(" "),
        emails: emailsRes.data || [],
        phones: phonesRes.data || [],
        company: companyRes.data || null,
        career_history: careerRes.data || [],
        notes: notesRes.data || [],
      });
    }

    // PUT /contacts/{id} — update existing contact
    if (method === "PUT" && contactIdMatch) {
      const id = contactIdMatch[1];
      const body = await req.json();
      const allowed = [
        "first_name", "last_name", "middle_name", "nick_name", "salutation", "suffix",
        "job_title", "description", "status", "contact_type", "linkedin_url",
        "salary", "salary_details", "desired_salary_min", "desired_salary_max",
        "primary_company_id",
      ];
      const updates: Record<string, unknown> = {};
      for (const k of allowed) if (k in body) updates[k] = body[k];

      if (Object.keys(updates).length === 0) {
        return json({ error: "No valid fields to update" }, 400);
      }

      const { data, error } = await supabase
        .from("crm_contacts")
        .update(updates)
        .eq("id", id)
        .select("id")
        .maybeSingle();

      if (error) return json({ error: error.message }, 500);
      if (!data) return json({ error: "Contact not found" }, 404);

      return json({ id: data.id, message: "Contact updated" });
    }

    // POST /contacts — create new contact (any type)
    if (method === "POST" && path === "/contacts") {
      const body = await req.json();
      const {
        first_name, last_name, job_title, email, phone, company_name,
        contact_type, status, linkedin_url, description,
      } = body;

      if (!last_name) return json({ error: "last_name is required" }, 400);

      const { data: contact, error: contactErr } = await supabase
        .from("crm_contacts")
        .insert({
          first_name: first_name || null,
          last_name,
          job_title: job_title || null,
          contact_type: contact_type || "candidate",
          status: status || "active",
          linkedin_url: linkedin_url || null,
          description: description || null,
          source: "api",
          source_detail: "Sonoma AI",
        })
        .select("id")
        .single();

      if (contactErr) return json({ error: contactErr.message }, 500);

      if (email) {
        await supabase.from("crm_contact_emails").insert({
          contact_id: contact.id, value: email, category: "work", is_primary: true,
        });
      }
      if (phone) {
        await supabase.from("crm_contact_phones").insert({
          contact_id: contact.id, value: phone, category: "work", is_primary: true,
        });
      }
      if (company_name) {
        const { data: existing } = await supabase
          .from("crm_companies").select("id").ilike("name", company_name).maybeSingle();
        let companyId = existing?.id;
        if (!companyId) {
          const { data: newCo } = await supabase
            .from("crm_companies").insert({ name: company_name, company_type: "client" })
            .select("id").single();
          companyId = newCo?.id;
        }
        if (companyId) {
          await supabase.from("crm_contacts").update({ primary_company_id: companyId }).eq("id", contact.id);
          await supabase.from("crm_career_history").insert({
            contact_id: contact.id, company_id: companyId, company_name,
            job_title: job_title || null, is_current: true, entry_type: "experience",
          });
        }
      }

      return json({ id: contact.id, message: "Contact created" }, 201);
    }

    // PUT /candidates/{id} — update existing candidate
    const candidateIdMatch = path.match(/^\/candidates\/([a-f0-9-]{36})$/i);
    if (method === "PUT" && candidateIdMatch) {
      const id = candidateIdMatch[1];
      const body = await req.json();
      const allowed = [
        "first_name", "last_name", "job_title", "status", "description",
        "linkedin_url", "salary", "salary_details", "desired_salary_min", "desired_salary_max",
        "primary_company_id",
      ];
      const updates: Record<string, unknown> = {};
      for (const k of allowed) if (k in body) updates[k] = body[k];

      // Handle company_name → find/create + link
      if (body.company_name) {
        const { data: existing } = await supabase
          .from("crm_companies").select("id").ilike("name", body.company_name).maybeSingle();
        let companyId = existing?.id;
        if (!companyId) {
          const { data: newCo } = await supabase
            .from("crm_companies").insert({ name: body.company_name, company_type: "client" })
            .select("id").single();
          companyId = newCo?.id;
        }
        if (companyId) updates.primary_company_id = companyId;
      }

      if (Object.keys(updates).length === 0) {
        return json({ error: "No valid fields to update" }, 400);
      }

      // Ensure we only update candidates
      const { data: existing, error: existErr } = await supabase
        .from("crm_contacts").select("id, contact_type").eq("id", id).maybeSingle();
      if (existErr) return json({ error: existErr.message }, 500);
      if (!existing) return json({ error: "Candidate not found" }, 404);
      if (existing.contact_type !== "candidate") {
        return json({ error: "Contact is not a candidate" }, 400);
      }

      const { data, error } = await supabase
        .from("crm_contacts").update(updates).eq("id", id).select("id").maybeSingle();
      if (error) return json({ error: error.message }, 500);

      return json({ id: data?.id, message: "Candidate updated" });
    }

    return json({
      error: "Not found",
      available_endpoints: [
        "GET /candidates",
        "POST /candidates",
        "PUT /candidates/{id}",
        "GET /clients",
        "GET /searches",
        "GET /contacts",
        "POST /contacts",
        "GET /contacts/{id}",
        "PUT /contacts/{id}",
        "GET /activity-log",
        "POST /activity-log",
      ],
    }, 404);
  } catch (e) {
    console.error("crm-api error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
