import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CRELATE_BASE = "https://app.crelate.com/api3";
const PAGE_SIZE = 100;

interface SyncResult {
  entity: string;
  created: number;
  updated: number;
  failed: number;
  total: number;
  errors: string[];
}

async function crelateGet(endpoint: string, apiKey: string, offset = 0, limit = PAGE_SIZE) {
  const url = `${CRELATE_BASE}/${endpoint}?api_key=${apiKey}&offset=${offset}&limit=${limit}`;
  const res = await fetch(url, { headers: { "x-api-key": apiKey } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Crelate API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function fetchAllPages(endpoint: string, apiKey: string): Promise<any[]> {
  const allItems: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const data = await crelateGet(endpoint, apiKey, offset, PAGE_SIZE);
    let items: any[];
    if (Array.isArray(data)) {
      items = data;
    } else if (data?.Data && Array.isArray(data.Data)) {
      items = data.Data;
    } else {
      const arrayKey = Object.keys(data || {}).find(k => Array.isArray(data[k]));
      items = arrayKey ? data[arrayKey] : [];
    }

    if (items.length > 0) {
      allItems.push(...items);
      offset += items.length;
      hasMore = items.length >= PAGE_SIZE;
    } else {
      hasMore = false;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`${endpoint}: total ${allItems.length} items fetched`);
  return allItems;
}

function getField(obj: any, ...names: string[]): any {
  for (const name of names) {
    if (obj[name] !== undefined) return obj[name];
    const lower = name.toLowerCase();
    for (const key of Object.keys(obj)) {
      if (key.toLowerCase() === lower) return obj[key];
    }
  }
  return null;
}

// Batch upsert helper - processes in chunks of 500
async function batchUpsert(supabase: any, table: string, rows: any[], onConflict: string, chunkSize = 500) {
  let created = 0, updated = 0, failed = 0;
  const errors: string[] = [];
  
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error, count } = await supabase
      .from(table)
      .upsert(chunk, { onConflict, ignoreDuplicates: false });
    
    if (error) {
      console.error(`Upsert error on ${table} chunk ${i}: ${error.message}`);
      failed += chunk.length;
      errors.push(`${table} chunk ${i}: ${error.message}`);
    } else {
      // upsert doesn't distinguish created vs updated, estimate
      created += chunk.length;
    }
  }
  
  return { created, updated, failed, errors };
}

// Extract flattened email fields from Crelate contact
function extractEmails(c: any, crelateId: string): any[] {
  const emails: any[] = [];
  const emailPrefixes = [
    "EmailAddresses_Work", "EmailAddresses_Work_Other",
    "EmailAddresses_Personal", "EmailAddresses_Personal_Other",
    "EmailAddresses_Other", "EmailAddresses_Other_Alternate",
    "EmailAddresses_Potential",
  ];
  
  for (const prefix of emailPrefixes) {
    const val = c[prefix];
    if (val && typeof val === "string" && val.includes("@")) {
      const category = prefix.includes("Personal") ? "personal" 
        : prefix.includes("Work") ? "work" : "other";
      emails.push({
        crelate_id: `${crelateId}_${prefix}`,
        value: val,
        category,
        is_primary: prefix === "EmailAddresses_Work",
        is_invalid: false,
      });
    }
  }
  return emails;
}

// Extract flattened phone fields
function extractPhones(c: any, crelateId: string): any[] {
  const phones: any[] = [];
  const phonePrefixes = [
    "PhoneNumbers_Work_Direct", "PhoneNumbers_Work_Main", "PhoneNumbers_Work_Other",
    "PhoneNumbers_Mobile", "PhoneNumbers_Mobile_Other",
    "PhoneNumbers_Home", "PhoneNumbers_Fax",
    "PhoneNumbers_Other", "PhoneNumbers_Other_Alternate",
    "PhoneNumbers_Skype", "PhoneNumbers_Potential",
  ];
  
  for (const prefix of phonePrefixes) {
    const val = c[prefix];
    if (val && typeof val === "string" && val.length > 3) {
      const category = prefix.includes("Mobile") ? "mobile"
        : prefix.includes("Home") ? "home"
        : prefix.includes("Fax") ? "fax"
        : prefix.includes("Work") ? "work" : "other";
      phones.push({
        crelate_id: `${crelateId}_${prefix}`,
        value: val,
        category,
        is_primary: prefix === "PhoneNumbers_Mobile" || prefix === "PhoneNumbers_Work_Direct",
      });
    }
  }
  return phones;
}

// Extract flattened URL/website fields
function extractUrls(c: any, crelateId: string): any[] {
  const urls: any[] = [];
  const urlPrefixes = [
    "Websites_LinkedIn", "Websites_Business", "Websites_Personal",
    "Websites_GitHub", "Websites_Facebook", "Websites_Blog",
    "Websites_Portfolio", "Websites_Quora", "Websites_RSSFeed",
    "Websites_Other", "Websites_Other_Alternate",
  ];
  
  for (const prefix of urlPrefixes) {
    const val = c[prefix];
    if (val && typeof val === "string" && val.length > 5) {
      const category = prefix.replace("Websites_", "").toLowerCase();
      urls.push({
        crelate_id: `${crelateId}_${prefix}`,
        value: val,
        category: category === "linkedin" ? "linkedin" : category === "github" ? "github" : "business",
        is_primary: prefix === "Websites_LinkedIn",
      });
    }
  }
  return urls;
}

// Extract address objects
function extractAddresses(c: any, crelateId: string): any[] {
  const addresses: any[] = [];
  for (const cat of ["Business", "Home", "Other"]) {
    const addr = c[`Addresses_${cat}`];
    if (addr && typeof addr === "object") {
      const city = getField(addr, "City", "city");
      const state = getField(addr, "State", "state");
      const line1 = getField(addr, "Line1", "line1", "Street", "street");
      if (city || state || line1) {
        addresses.push({
          crelate_id: getField(addr, "Id", "id") || `${crelateId}_addr_${cat}`,
          line1: line1 || null,
          line2: getField(addr, "Line2", "line2") || null,
          city: city || null,
          state: state || null,
          zip_code: getField(addr, "ZipCode", "zipCode", "PostalCode", "postalCode", "Zip") || null,
          country: getField(addr, "Country", "country") || "US",
          category: cat.toLowerCase(),
          is_primary: getField(addr, "IsPrimary", "isPrimary") || false,
          location: getField(addr, "Location", "location") || null,
        });
      }
    }
  }
  return addresses;
}

async function syncContacts(apiKey: string, supabase: any): Promise<SyncResult> {
  const result: SyncResult = { entity: "contacts", created: 0, updated: 0, failed: 0, total: 0, errors: [] };

  try {
    const contacts = await fetchAllPages("contacts", apiKey);
    result.total = contacts.length;
    console.log(`Processing ${contacts.length} contacts with batch upsert...`);

    // Build contact rows
    const contactRows: any[] = [];
    for (const c of contacts) {
      const crelateId = c.Id;
      if (!crelateId) continue;

      const currentPos = c.CurrentPosition;
      const jobTitle = currentPos?.JobTitle || getField(c, "JobTitle", "jobTitle") || null;

      // Map Crelate RecordType to allowed contact_type values
      const rawType = String(c.RecordType || "").toLowerCase();
      const contactType = rawType.includes("candidate") ? "candidate"
        : rawType.includes("client") ? "client"
        : rawType.includes("contact") ? "contact"
        : "contact";

      // Map Crelate EntityStatus to allowed status values
      const rawStatus = String(c.EntityStatus || "").toLowerCase();
      const status = rawStatus.includes("inactive") ? "inactive"
        : rawStatus.includes("do_not_contact") || rawStatus.includes("donotcontact") ? "do_not_contact"
        : rawStatus.includes("archived") ? "archived"
        : "active";

      contactRows.push({
        crelate_id: crelateId,
        first_name: c.FirstName || null,
        last_name: c.LastName || "Unknown",
        middle_name: c.MiddleName || null,
        nick_name: c.NickName || null,
        salutation: c.Salutation || null,
        suffix: null,
        job_title: jobTitle,
        description: c.Description || null,
        status,
        contact_type: contactType,
        icon_attachment_url: null,
        salary: c.Salary || null,
        desired_salary_min: c.DesiredSalaryMin || null,
        desired_salary_max: c.DesiredSalaryMax || null,
        salary_details: c.SalaryDetails || null,
      });
    }

    // Batch upsert contacts
    const contactResult = await batchUpsert(supabase, "crm_contacts", contactRows, "crelate_id");
    result.created = contactResult.created;
    result.failed = contactResult.failed;
    result.errors.push(...contactResult.errors);

    console.log(`Contacts upserted. Now processing sub-records...`);

    // Get all local contact IDs by crelate_id
    const { data: localContacts } = await supabase
      .from("crm_contacts")
      .select("id, crelate_id")
      .not("crelate_id", "is", null);
    
    const crelateToLocal: Record<string, string> = {};
    for (const lc of (localContacts || [])) {
      if (lc.crelate_id) crelateToLocal[lc.crelate_id] = lc.id;
    }

    // Build sub-record arrays
    const allEmails: any[] = [];
    const allPhones: any[] = [];
    const allUrls: any[] = [];
    const allAddresses: any[] = [];
    const allTagNames = new Set<string>();
    const contactTagPairs: { crelateId: string; tagName: string }[] = [];

    for (const c of contacts) {
      const crelateId = c.Id;
      if (!crelateId || !crelateToLocal[crelateId]) continue;
      const contactId = crelateToLocal[crelateId];

      // Emails
      for (const e of extractEmails(c, crelateId)) {
        allEmails.push({ ...e, contact_id: contactId });
      }

      // Phones
      for (const p of extractPhones(c, crelateId)) {
        allPhones.push({ ...p, contact_id: contactId });
      }

      // URLs
      for (const u of extractUrls(c, crelateId)) {
        allUrls.push({ ...u, contact_id: contactId });
      }

      // Addresses
      for (const a of extractAddresses(c, crelateId)) {
        allAddresses.push({ ...a, contact_id: contactId });
      }

      // Tags
      const tags = c.Tags;
      if (Array.isArray(tags)) {
        for (const tag of tags) {
          const tagName = typeof tag === "string" ? tag : (tag?.Name || tag?.Value || tag?.Title);
          if (tagName) {
            allTagNames.add(tagName);
            contactTagPairs.push({ crelateId, tagName });
          }
        }
      }
    }

    // Batch upsert sub-records
    if (allEmails.length > 0) {
      console.log(`Upserting ${allEmails.length} emails...`);
      await batchUpsert(supabase, "crm_contact_emails", allEmails, "crelate_id");
    }
    if (allPhones.length > 0) {
      console.log(`Upserting ${allPhones.length} phones...`);
      await batchUpsert(supabase, "crm_contact_phones", allPhones, "crelate_id");
    }
    if (allUrls.length > 0) {
      console.log(`Upserting ${allUrls.length} urls...`);
      await batchUpsert(supabase, "crm_contact_urls", allUrls, "crelate_id");
    }
    if (allAddresses.length > 0) {
      console.log(`Upserting ${allAddresses.length} addresses...`);
      await batchUpsert(supabase, "crm_addresses", allAddresses, "crelate_id");
    }

    // Tags: upsert tag names, then link
    if (allTagNames.size > 0) {
      console.log(`Processing ${allTagNames.size} unique tags...`);
      const tagRows = Array.from(allTagNames).map(name => ({ name }));
      // Upsert tags by name
      for (const tr of tagRows) {
        await supabase.from("crm_tags").upsert(tr, { onConflict: "name", ignoreDuplicates: true });
      }
      // Get all tag IDs
      const { data: allTags } = await supabase.from("crm_tags").select("id, name");
      const tagNameToId: Record<string, string> = {};
      for (const t of (allTags || [])) tagNameToId[t.name] = t.id;

      // Build contact-tag links (deduplicated)
      const seen = new Set<string>();
      const tagLinks: any[] = [];
      for (const { crelateId, tagName } of contactTagPairs) {
        const contactId = crelateToLocal[crelateId];
        const tagId = tagNameToId[tagName];
        if (contactId && tagId) {
          const key = `${contactId}_${tagId}`;
          if (!seen.has(key)) {
            seen.add(key);
            tagLinks.push({ contact_id: contactId, tag_id: tagId });
          }
        }
      }
      if (tagLinks.length > 0) {
        console.log(`Linking ${tagLinks.length} contact-tag pairs...`);
        // Use chunks to avoid conflicts
        for (let i = 0; i < tagLinks.length; i += 500) {
          const chunk = tagLinks.slice(i, i + 500);
          await supabase.from("crm_contact_tags").upsert(chunk, { 
            onConflict: "contact_id,tag_id", 
            ignoreDuplicates: true 
          });
        }
      }
    }

    console.log(`Contact sync complete: ${result.total} contacts, ${allEmails.length} emails, ${allPhones.length} phones, ${allUrls.length} urls, ${allAddresses.length} addresses`);
  } catch (e) {
    result.errors.push(`Contacts sync failed: ${e.message}`);
    result.failed = result.total;
  }

  return result;
}

async function syncCompanies(apiKey: string, supabase: any): Promise<SyncResult> {
  const result: SyncResult = { entity: "companies", created: 0, updated: 0, failed: 0, total: 0, errors: [] };

  try {
    const companies = await fetchAllPages("companies", apiKey);
    result.total = companies.length;

    const rows = companies
      .filter(c => c.Id)
      .map(c => {
        const rawType = String(c.CompanyType || "").toLowerCase();
        const companyType = rawType.includes("client") ? "client"
          : rawType.includes("target") ? "target"
          : rawType.includes("both") ? "both"
          : "other";

        const rawStatus = String(c.EntityStatus || c.Status || "").toLowerCase();
        const status = rawStatus.includes("inactive") ? "inactive"
          : rawStatus.includes("prospect") ? "prospect"
          : rawStatus.includes("client") ? "client"
          : rawStatus.includes("archived") ? "archived"
          : "active";

        return {
          crelate_id: c.Id,
          name: c.Name || "Unnamed",
          domain: c.Domain || c.Website || null,
          company_type: companyType,
          status,
          description: c.Description || null,
          icon_attachment_url: null,
          revenue: c.Revenue || null,
        };
      });

    const r = await batchUpsert(supabase, "crm_companies", rows, "crelate_id");
    result.created = r.created;
    result.failed = r.failed;
    result.errors.push(...r.errors);
  } catch (e) {
    result.errors.push(`Companies sync failed: ${e.message}`);
  }

  return result;
}

async function syncJobs(apiKey: string, supabase: any): Promise<SyncResult> {
  const result: SyncResult = { entity: "jobs", created: 0, updated: 0, failed: 0, total: 0, errors: [] };

  try {
    const jobs = await fetchAllPages("jobs", apiKey);
    result.total = jobs.length;

    // Get company crelate_id -> local id map
    const { data: companies } = await supabase
      .from("crm_companies")
      .select("id, crelate_id")
      .not("crelate_id", "is", null);
    const compMap: Record<string, string> = {};
    for (const c of (companies || [])) {
      if (c.crelate_id) compMap[c.crelate_id] = c.id;
    }

    const rows = jobs
      .filter(j => j.Id)
      .map(j => {
        const compCrelateId = j.CompanyId?.Id || j.CompanyId;

        const rawStatus = String(j.EntityStatus || j.Status || "").toLowerCase();
        const status = rawStatus.includes("filled") ? "filled"
          : rawStatus.includes("closed") ? "closed"
          : rawStatus.includes("lost") ? "lost"
          : rawStatus.includes("hold") ? "on_hold"
          : rawStatus.includes("draft") ? "draft"
          : "open";

        const rawJobType = String(j.JobType || "").toLowerCase();
        const jobType = rawJobType.includes("direct") ? "direct"
          : rawJobType.includes("full") ? "full_time"
          : rawJobType.includes("part") ? "part_time"
          : rawJobType.includes("contract") ? "contract"
          : rawJobType.includes("interim") ? "interim"
          : rawJobType ? "other" : null;

        const rawPriority = String(j.Priority || "").toLowerCase();
        const priority = rawPriority.includes("urgent") ? "urgent"
          : rawPriority.includes("high") ? "high"
          : rawPriority.includes("medium") ? "medium"
          : rawPriority.includes("low") ? "low"
          : null;

        return {
          crelate_id: j.Id,
          name: j.Name || j.JobTitle || "Untitled",
          job_title: j.JobTitle || null,
          job_type: jobType,
          description: j.Description || null,
          status,
          location: j.Location || null,
          salary_min: j.SalaryMin || null,
          salary_max: j.SalaryMax || null,
          company_id: (typeof compCrelateId === "string" && compMap[compCrelateId]) || null,
          compensation_details: j.CompensationDetails || null,
          priority,
        };
      });

    const r = await batchUpsert(supabase, "crm_jobs", rows, "crelate_id");
    result.created = r.created;
    result.failed = r.failed;
    result.errors.push(...r.errors);
  } catch (e) {
    result.errors.push(`Jobs sync failed: ${e.message}`);
  }

  return result;
}

async function syncPlacements(apiKey: string, supabase: any): Promise<SyncResult> {
  const result: SyncResult = { entity: "placements", created: 0, updated: 0, failed: 0, total: 0, errors: [] };

  try {
    const placements = await fetchAllPages("placements", apiKey);
    result.total = placements.length;

    // Get lookup maps
    const { data: jobs } = await supabase.from("crm_jobs").select("id, crelate_id").not("crelate_id", "is", null);
    const jobMap: Record<string, string> = {};
    for (const j of (jobs || [])) if (j.crelate_id) jobMap[j.crelate_id] = j.id;

    const { data: contacts } = await supabase.from("crm_contacts").select("id, crelate_id").not("crelate_id", "is", null);
    const contactMap: Record<string, string> = {};
    for (const c of (contacts || [])) if (c.crelate_id) contactMap[c.crelate_id] = c.id;

    const rows = placements
      .filter(p => {
        const jobCrelateId = p.JobId?.Id || p.JobId;
        return p.Id && jobCrelateId && jobMap[jobCrelateId];
      })
      .map(p => {
        const jobCrelateId = p.JobId?.Id || p.JobId;
        const contCrelateId = p.ContactId?.Id || p.ContactId;
        return {
          crelate_id: p.Id,
          job_id: jobMap[jobCrelateId],
          contact_id: (contCrelateId && contactMap[contCrelateId]) || null,
          salary: p.Salary || null,
          fee_amount: p.FeeAmount || null,
          fee_percent: p.FeePercent || null,
          placement_date: p.PlacementDate || null,
          start_date: p.StartDate || null,
          notes: p.Notes || null,
        };
      });

    const r = await batchUpsert(supabase, "crm_placements", rows, "crelate_id");
    result.created = r.created;
    result.failed = r.failed;
    result.errors.push(...r.errors);
  } catch (e) {
    result.errors.push(`Placements sync failed: ${e.message}`);
  }

  return result;
}

async function syncActivities(apiKey: string, supabase: any): Promise<SyncResult> {
  const result: SyncResult = { entity: "activities", created: 0, updated: 0, failed: 0, total: 0, errors: [] };

  try {
    let activities: any[] = [];
    try {
      activities = await fetchAllPages("activities", apiKey);
    } catch {
      try {
        activities = await fetchAllPages("notes", apiKey);
      } catch (e2) {
        result.errors.push(`Both activities and notes endpoints failed: ${e2.message}`);
        return result;
      }
    }
    result.total = activities.length;

    // Get lookup maps
    const { data: contacts } = await supabase.from("crm_contacts").select("id, crelate_id").not("crelate_id", "is", null);
    const contactMap: Record<string, string> = {};
    for (const c of (contacts || [])) if (c.crelate_id) contactMap[c.crelate_id] = c.id;

    const { data: companies } = await supabase.from("crm_companies").select("id, crelate_id").not("crelate_id", "is", null);
    const compMap: Record<string, string> = {};
    for (const c of (companies || [])) if (c.crelate_id) compMap[c.crelate_id] = c.id;

    const { data: jobs } = await supabase.from("crm_jobs").select("id, crelate_id").not("crelate_id", "is", null);
    const jobMap: Record<string, string> = {};
    for (const j of (jobs || [])) if (j.crelate_id) jobMap[j.crelate_id] = j.id;

    const rows = activities
      .filter(a => a.Id)
      .map(a => {
        const contId = a.ContactId?.Id || a.ContactId;
        const compId = a.CompanyId?.Id || a.CompanyId;
        const jId = a.JobId?.Id || a.JobId;
        return {
          crelate_id: a.Id,
          activity_type: a.ActivityType || a.Type || "note",
          subject: a.Subject || null,
          body: a.Body || a.Description || null,
          contact_id: (contId && contactMap[contId]) || null,
          company_id: (compId && compMap[compId]) || null,
          job_id: (jId && jobMap[jId]) || null,
          direction: a.Direction || null,
          completed: a.Completed !== false,
          scheduled_at: a.ScheduledAt || a.DueDate || null,
          completed_at: a.CompletedAt || null,
          duration_minutes: a.DurationMinutes || null,
          location: a.Location || null,
          is_pinned: a.IsPinned || false,
        };
      });

    const r = await batchUpsert(supabase, "crm_activities", rows, "crelate_id");
    result.created = r.created;
    result.failed = r.failed;
    result.errors.push(...r.errors);
  } catch (e) {
    result.errors.push(`Activities sync failed: ${e.message}`);
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const crelateApiKey = Deno.env.get("CRELATE_API_KEY");

    if (!crelateApiKey) {
      return new Response(JSON.stringify({ error: "CRELATE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") || supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const adminCheckClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin } = await adminCheckClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "full";
    const entityType = body.entity_type || "all";

    // Test connection
    if (action === "test") {
      try {
        const testUrl = `${CRELATE_BASE}/contacts?api_key=${crelateApiKey}&offset=0&limit=1`;
        const res = await fetch(testUrl, { headers: { "x-api-key": crelateApiKey } });
        const responseText = await res.text();
        if (!res.ok) {
          return new Response(JSON.stringify({ success: false, error: `API returned ${res.status}` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Connected to Crelate API",
          preview: responseText.substring(0, 200),
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Sync
    const syncLog = {
      entity_type: entityType === "all" ? "full_sync" : entityType,
      status: "running",
      created_by: user.id,
      started_at: new Date().toISOString(),
    };

    const { data: logEntry } = await supabase.from("crm_sync_log").insert(syncLog).select("id").single();

    const syncMap: Record<string, (ak: string, sb: any) => Promise<SyncResult>> = {
      contacts: syncContacts,
      companies: syncCompanies,
      jobs: syncJobs,
      placements: syncPlacements,
      activities: syncActivities,
    };

    const entitiesToSync = entityType === "all" ? Object.keys(syncMap) : [entityType];
    const results: SyncResult[] = [];

    for (const entity of entitiesToSync) {
      if (syncMap[entity]) {
        console.log(`Starting sync for: ${entity}`);
        const r = await syncMap[entity](crelateApiKey, supabase);
        console.log(`Sync ${entity}: total=${r.total} created=${r.created} failed=${r.failed}`);
        results.push(r);
      }
    }

    const totalCreated = results.reduce((s, r) => s + r.created, 0);
    const totalUpdated = results.reduce((s, r) => s + r.updated, 0);
    const totalFailed = results.reduce((s, r) => s + r.failed, 0);
    const allErrors = results.flatMap((r) => r.errors);

    if (logEntry) {
      await supabase
        .from("crm_sync_log")
        .update({
          status: totalFailed > 0 ? "partial" : "success",
          records_synced: totalCreated + totalUpdated,
          records_created: totalCreated,
          records_updated: totalUpdated,
          records_failed: totalFailed,
          error_message: allErrors.length > 0 ? allErrors.slice(0, 10).join("; ") : null,
          completed_at: new Date().toISOString(),
          metadata: { results },
        })
        .eq("id", logEntry.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: { synced: totalCreated + totalUpdated, created: totalCreated, updated: totalUpdated, failed: totalFailed },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Edge function error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
