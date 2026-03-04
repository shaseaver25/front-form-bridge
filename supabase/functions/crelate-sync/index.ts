import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CRELATE_BASE = "https://app.crelate.com/api3";
const PAGE_SIZE = 100; // Crelate max is 100

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
  console.log(`Fetching: ${endpoint} offset=${offset} limit=${limit}`);
  const res = await fetch(url, {
    headers: { "x-api-key": apiKey },
  });
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
    
    // Crelate v3 returns { Data: [...] } with capital D
    let items: any[];
    if (Array.isArray(data)) {
      items = data;
    } else if (data?.Data && Array.isArray(data.Data)) {
      items = data.Data;
    } else if (data?.Items && Array.isArray(data.Items)) {
      items = data.Items;
    } else if (data?.Results && Array.isArray(data.Results)) {
      items = data.Results;
    } else {
      console.log(`Response shape for ${endpoint}:`, JSON.stringify(Object.keys(data || {})));
      // Try first array-valued key as fallback
      const arrayKey = Object.keys(data || {}).find(k => Array.isArray(data[k]));
      if (arrayKey) {
        console.log(`Using fallback array key: ${arrayKey}`);
        items = data[arrayKey];
      } else {
        items = [];
      }
    }

    console.log(`${endpoint}: got ${items.length} items at offset ${offset}`);
    
    if (items.length > 0) {
      allItems.push(...items);
      offset += items.length;
      hasMore = items.length >= PAGE_SIZE;
    } else {
      hasMore = false;
    }
    // Rate limiting
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(`${endpoint}: total ${allItems.length} items fetched`);
  return allItems;
}

// Helper to get a field value case-insensitively
function getField(obj: any, ...names: string[]): any {
  for (const name of names) {
    // Try exact
    if (obj[name] !== undefined) return obj[name];
    // Try camelCase variations
    const lower = name.toLowerCase();
    for (const key of Object.keys(obj)) {
      if (key.toLowerCase() === lower) return obj[key];
    }
  }
  return null;
}

async function syncContacts(apiKey: string, supabase: any): Promise<SyncResult> {
  const result: SyncResult = { entity: "contacts", created: 0, updated: 0, failed: 0, total: 0, errors: [] };

  try {
    const contacts = await fetchAllPages("contacts", apiKey);
    result.total = contacts.length;

    if (contacts.length > 0) {
      console.log("Sample contact keys:", JSON.stringify(Object.keys(contacts[0])));
      console.log("Sample contact (first 2000 chars):", JSON.stringify(contacts[0]).substring(0, 2000));
    }

    for (const c of contacts) {
      try {
        const crelateId = getField(c, "Id", "id", "ContactId");
        if (!crelateId) {
          result.failed++;
          result.errors.push("Contact missing Id field");
          continue;
        }

        const contactData = {
          crelate_id: crelateId,
          first_name: getField(c, "FirstName", "firstName") || null,
          last_name: getField(c, "LastName", "lastName") || "Unknown",
          middle_name: getField(c, "MiddleName", "middleName") || null,
          nick_name: getField(c, "NickName", "nickName") || null,
          salutation: getField(c, "Salutation", "salutation") || null,
          suffix: getField(c, "Suffix", "suffix") || null,
          job_title: getField(c, "JobTitle", "jobTitle", "Title") || null,
          description: getField(c, "Description", "description") || null,
          status: getField(c, "Status", "status") || "active",
          contact_type: getField(c, "ContactType", "contactType", "RecordType") || "candidate",
          icon_attachment_url: getField(c, "IconAttachmentUrl", "iconAttachmentUrl") || null,
          salary: getField(c, "Salary", "salary") || null,
          desired_salary_min: getField(c, "DesiredSalaryMin", "desiredSalaryMin") || null,
          desired_salary_max: getField(c, "DesiredSalaryMax", "desiredSalaryMax") || null,
          salary_details: getField(c, "SalaryDetails", "salaryDetails") || null,
        };

        const { data: existing } = await supabase
          .from("crm_contacts")
          .select("id")
          .eq("crelate_id", crelateId)
          .maybeSingle();

        if (existing) {
          await supabase.from("crm_contacts").update(contactData).eq("crelate_id", crelateId);
          result.updated++;
        } else {
          await supabase.from("crm_contacts").insert(contactData);
          result.created++;
        }

        // Get local ID for sub-records
        const { data: localContact } = await supabase
          .from("crm_contacts")
          .select("id")
          .eq("crelate_id", crelateId)
          .single();

        if (!localContact) continue;
        const contactId = localContact.id;

        // Sync emails
        const emails = getField(c, "EmailAddresses", "emailAddresses", "Emails", "emails");
        if (emails && Array.isArray(emails)) {
          for (const email of emails) {
            const val = typeof email === "string" ? email : getField(email, "Value", "value", "Address", "address");
            if (!val) continue;
            const emailCrelateId = (typeof email === "object" && getField(email, "Id", "id")) || `${crelateId}_email_${val}`;
            const emailData = {
              crelate_id: emailCrelateId,
              contact_id: contactId,
              value: val,
              category: (typeof email === "object" && getField(email, "Category", "category")) || "work",
              is_primary: (typeof email === "object" && getField(email, "IsPrimary", "isPrimary")) || false,
              is_invalid: (typeof email === "object" && getField(email, "IsInvalid", "isInvalid")) || false,
            };
            const { data: ex } = await supabase.from("crm_contact_emails").select("id").eq("crelate_id", emailCrelateId).maybeSingle();
            if (ex) {
              await supabase.from("crm_contact_emails").update(emailData).eq("crelate_id", emailCrelateId);
            } else {
              await supabase.from("crm_contact_emails").insert(emailData);
            }
          }
        }

        // Sync phones
        const phones = getField(c, "PhoneNumbers", "phoneNumbers", "Phones", "phones");
        if (phones && Array.isArray(phones)) {
          for (const phone of phones) {
            const val = typeof phone === "string" ? phone : getField(phone, "Value", "value", "Number", "number");
            if (!val) continue;
            const phoneCrelateId = (typeof phone === "object" && getField(phone, "Id", "id")) || `${crelateId}_phone_${val}`;
            const phoneData = {
              crelate_id: phoneCrelateId,
              contact_id: contactId,
              value: val,
              category: (typeof phone === "object" && getField(phone, "Category", "category")) || "work",
              is_primary: (typeof phone === "object" && getField(phone, "IsPrimary", "isPrimary")) || false,
              extension: (typeof phone === "object" && getField(phone, "Extension", "extension")) || null,
            };
            const { data: ex } = await supabase.from("crm_contact_phones").select("id").eq("crelate_id", phoneCrelateId).maybeSingle();
            if (ex) {
              await supabase.from("crm_contact_phones").update(phoneData).eq("crelate_id", phoneCrelateId);
            } else {
              await supabase.from("crm_contact_phones").insert(phoneData);
            }
          }
        }

        // Sync URLs
        const urls = getField(c, "Urls", "urls", "WebAddresses", "webAddresses");
        if (urls && Array.isArray(urls)) {
          for (const url of urls) {
            const val = typeof url === "string" ? url : getField(url, "Value", "value", "Url", "url");
            if (!val) continue;
            const urlCrelateId = (typeof url === "object" && getField(url, "Id", "id")) || `${crelateId}_url_${val}`;
            const urlData = {
              crelate_id: urlCrelateId,
              contact_id: contactId,
              value: val,
              category: (typeof url === "object" && getField(url, "Category", "category")) || "business",
              is_primary: (typeof url === "object" && getField(url, "IsPrimary", "isPrimary")) || false,
            };
            const { data: ex } = await supabase.from("crm_contact_urls").select("id").eq("crelate_id", urlCrelateId).maybeSingle();
            if (ex) {
              await supabase.from("crm_contact_urls").update(urlData).eq("crelate_id", urlCrelateId);
            } else {
              await supabase.from("crm_contact_urls").insert(urlData);
            }
          }
        }

        // Sync tags
        const tags = getField(c, "Tags", "tags");
        if (tags && Array.isArray(tags)) {
          for (const tag of tags) {
            const tagName = typeof tag === "string" ? tag : getField(tag, "Name", "name", "Value", "value");
            if (!tagName) continue;
            let { data: existingTag } = await supabase.from("crm_tags").select("id").eq("name", tagName).maybeSingle();
            if (!existingTag) {
              const { data: newTag } = await supabase.from("crm_tags").insert({ name: tagName }).select("id").single();
              existingTag = newTag;
            }
            if (existingTag) {
              const { data: existingLink } = await supabase
                .from("crm_contact_tags")
                .select("id")
                .eq("contact_id", contactId)
                .eq("tag_id", existingTag.id)
                .maybeSingle();
              if (!existingLink) {
                await supabase.from("crm_contact_tags").insert({ contact_id: contactId, tag_id: existingTag.id });
              }
            }
          }
        }
      } catch (e) {
        result.failed++;
        result.errors.push(`Contact ${c.Id || "?"}: ${e.message}`);
      }
    }
  } catch (e) {
    result.errors.push(`Fetch contacts failed: ${e.message}`);
  }

  return result;
}

async function syncCompanies(apiKey: string, supabase: any): Promise<SyncResult> {
  const result: SyncResult = { entity: "companies", created: 0, updated: 0, failed: 0, total: 0, errors: [] };

  try {
    const companies = await fetchAllPages("companies", apiKey);
    result.total = companies.length;

    if (companies.length > 0) {
      console.log("Sample company keys:", JSON.stringify(Object.keys(companies[0])));
    }

    for (const c of companies) {
      try {
        const crelateId = getField(c, "Id", "id");
        if (!crelateId) { result.failed++; continue; }

        const data = {
          crelate_id: crelateId,
          name: getField(c, "Name", "name") || "Unnamed",
          domain: getField(c, "Domain", "domain", "Website", "website") || null,
          company_type: getField(c, "CompanyType", "companyType") || "client",
          status: getField(c, "Status", "status") || "active",
          description: getField(c, "Description", "description") || null,
          icon_attachment_url: getField(c, "IconAttachmentUrl", "iconAttachmentUrl") || null,
          revenue: getField(c, "Revenue", "revenue") || null,
        };

        const { data: existing } = await supabase.from("crm_companies").select("id").eq("crelate_id", crelateId).maybeSingle();
        if (existing) {
          await supabase.from("crm_companies").update(data).eq("crelate_id", crelateId);
          result.updated++;
        } else {
          await supabase.from("crm_companies").insert(data);
          result.created++;
        }
      } catch (e) {
        result.failed++;
        result.errors.push(`Company ${c.Id || "?"}: ${e.message}`);
      }
    }
  } catch (e) {
    result.errors.push(`Fetch companies failed: ${e.message}`);
  }

  return result;
}

async function syncJobs(apiKey: string, supabase: any): Promise<SyncResult> {
  const result: SyncResult = { entity: "jobs", created: 0, updated: 0, failed: 0, total: 0, errors: [] };

  try {
    const jobs = await fetchAllPages("jobs", apiKey);
    result.total = jobs.length;

    for (const j of jobs) {
      try {
        const crelateId = getField(j, "Id", "id");
        if (!crelateId) { result.failed++; continue; }

        let companyId = null;
        const compCrelateId = getField(j, "CompanyId", "companyId");
        if (compCrelateId) {
          const { data: company } = await supabase.from("crm_companies").select("id").eq("crelate_id", compCrelateId).maybeSingle();
          companyId = company?.id || null;
        }

        const data = {
          crelate_id: crelateId,
          name: getField(j, "Name", "name") || getField(j, "JobTitle", "jobTitle") || "Untitled",
          job_title: getField(j, "JobTitle", "jobTitle") || null,
          job_type: getField(j, "JobType", "jobType") || null,
          description: getField(j, "Description", "description") || null,
          status: getField(j, "Status", "status") || "open",
          location: getField(j, "Location", "location") || null,
          salary_min: getField(j, "SalaryMin", "salaryMin") || null,
          salary_max: getField(j, "SalaryMax", "salaryMax") || null,
          company_id: companyId,
          compensation_details: getField(j, "CompensationDetails", "compensationDetails") || null,
          priority: getField(j, "Priority", "priority") || null,
        };

        const { data: existing } = await supabase.from("crm_jobs").select("id").eq("crelate_id", crelateId).maybeSingle();
        if (existing) {
          await supabase.from("crm_jobs").update(data).eq("crelate_id", crelateId);
          result.updated++;
        } else {
          await supabase.from("crm_jobs").insert(data);
          result.created++;
        }
      } catch (e) {
        result.failed++;
        result.errors.push(`Job ${j.Id || "?"}: ${e.message}`);
      }
    }
  } catch (e) {
    result.errors.push(`Fetch jobs failed: ${e.message}`);
  }

  return result;
}

async function syncPlacements(apiKey: string, supabase: any): Promise<SyncResult> {
  const result: SyncResult = { entity: "placements", created: 0, updated: 0, failed: 0, total: 0, errors: [] };

  try {
    const placements = await fetchAllPages("placements", apiKey);
    result.total = placements.length;

    for (const p of placements) {
      try {
        const crelateId = getField(p, "Id", "id");
        if (!crelateId) { result.failed++; continue; }

        let jobId = null;
        const jobCrelateId = getField(p, "JobId", "jobId");
        if (jobCrelateId) {
          const { data: job } = await supabase.from("crm_jobs").select("id").eq("crelate_id", jobCrelateId).maybeSingle();
          jobId = job?.id;
        }
        if (!jobId) { result.failed++; result.errors.push(`Placement ${crelateId}: no matching job`); continue; }

        let contactId = null;
        const contCrelateId = getField(p, "ContactId", "contactId");
        if (contCrelateId) {
          const { data: contact } = await supabase.from("crm_contacts").select("id").eq("crelate_id", contCrelateId).maybeSingle();
          contactId = contact?.id || null;
        }

        const data = {
          crelate_id: crelateId,
          job_id: jobId,
          contact_id: contactId,
          salary: getField(p, "Salary", "salary") || null,
          fee_amount: getField(p, "FeeAmount", "feeAmount") || null,
          fee_percent: getField(p, "FeePercent", "feePercent") || null,
          placement_date: getField(p, "PlacementDate", "placementDate") || null,
          start_date: getField(p, "StartDate", "startDate") || null,
          notes: getField(p, "Notes", "notes") || null,
        };

        const { data: existing } = await supabase.from("crm_placements").select("id").eq("crelate_id", crelateId).maybeSingle();
        if (existing) {
          await supabase.from("crm_placements").update(data).eq("crelate_id", crelateId);
          result.updated++;
        } else {
          await supabase.from("crm_placements").insert(data);
          result.created++;
        }
      } catch (e) {
        result.failed++;
        result.errors.push(`Placement ${p.Id || "?"}: ${e.message}`);
      }
    }
  } catch (e) {
    result.errors.push(`Fetch placements failed: ${e.message}`);
  }

  return result;
}

async function syncActivities(apiKey: string, supabase: any): Promise<SyncResult> {
  const result: SyncResult = { entity: "activities", created: 0, updated: 0, failed: 0, total: 0, errors: [] };

  try {
    // Activities may be under /activities or /notes in v3
    let activities: any[] = [];
    try {
      activities = await fetchAllPages("activities", apiKey);
    } catch {
      console.log("activities endpoint failed, trying notes...");
      try {
        activities = await fetchAllPages("notes", apiKey);
      } catch (e2) {
        result.errors.push(`Both activities and notes endpoints failed: ${e2.message}`);
        return result;
      }
    }
    result.total = activities.length;

    for (const a of activities) {
      try {
        const crelateId = getField(a, "Id", "id");
        if (!crelateId) { result.failed++; continue; }

        let contactId = null;
        const contId = getField(a, "ContactId", "contactId");
        if (contId) {
          const { data: c } = await supabase.from("crm_contacts").select("id").eq("crelate_id", contId).maybeSingle();
          contactId = c?.id || null;
        }

        let companyId = null;
        const compId = getField(a, "CompanyId", "companyId");
        if (compId) {
          const { data: c } = await supabase.from("crm_companies").select("id").eq("crelate_id", compId).maybeSingle();
          companyId = c?.id || null;
        }

        let jobId = null;
        const jId = getField(a, "JobId", "jobId");
        if (jId) {
          const { data: j } = await supabase.from("crm_jobs").select("id").eq("crelate_id", jId).maybeSingle();
          jobId = j?.id || null;
        }

        const data = {
          crelate_id: crelateId,
          activity_type: getField(a, "ActivityType", "activityType", "Type", "type") || "note",
          subject: getField(a, "Subject", "subject") || null,
          body: getField(a, "Body", "body", "Description", "description") || null,
          contact_id: contactId,
          company_id: companyId,
          job_id: jobId,
          direction: getField(a, "Direction", "direction") || null,
          completed: getField(a, "Completed", "completed") !== false,
          scheduled_at: getField(a, "ScheduledAt", "scheduledAt", "DueDate", "dueDate") || null,
          completed_at: getField(a, "CompletedAt", "completedAt") || null,
          duration_minutes: getField(a, "DurationMinutes", "durationMinutes") || null,
          location: getField(a, "Location", "location") || null,
          is_pinned: getField(a, "IsPinned", "isPinned") || false,
        };

        const { data: existing } = await supabase.from("crm_activities").select("id").eq("crelate_id", crelateId).maybeSingle();
        if (existing) {
          await supabase.from("crm_activities").update(data).eq("crelate_id", crelateId);
          result.updated++;
        } else {
          await supabase.from("crm_activities").insert(data);
          result.created++;
        }
      } catch (e) {
        result.failed++;
        result.errors.push(`Activity ${a.Id || "?"}: ${e.message}`);
      }
    }
  } catch (e) {
    result.errors.push(`Fetch activities failed: ${e.message}`);
  }

  return result;
}

async function syncAddresses(apiKey: string, supabase: any): Promise<SyncResult> {
  const result: SyncResult = { entity: "addresses", created: 0, updated: 0, failed: 0, total: 0, errors: [] };

  // Addresses are nested in contacts - fetch contacts and extract
  try {
    const contacts = await fetchAllPages("contacts", apiKey);

    for (const c of contacts) {
      const addresses = getField(c, "Addresses", "addresses");
      if (!addresses || !Array.isArray(addresses)) continue;

      const crelateId = getField(c, "Id", "id");
      const { data: localContact } = await supabase.from("crm_contacts").select("id").eq("crelate_id", crelateId).maybeSingle();
      if (!localContact) continue;

      for (const addr of addresses) {
        result.total++;
        try {
          const addrCrelateId = getField(addr, "Id", "id") || `${crelateId}_addr_${result.total}`;
          const data = {
            crelate_id: addrCrelateId,
            contact_id: localContact.id,
            line1: getField(addr, "Line1", "line1", "Street", "street") || null,
            line2: getField(addr, "Line2", "line2") || null,
            city: getField(addr, "City", "city") || null,
            state: getField(addr, "State", "state") || null,
            zip_code: getField(addr, "ZipCode", "zipCode", "PostalCode", "postalCode") || null,
            country: getField(addr, "Country", "country") || "US",
            category: getField(addr, "Category", "category") || "business",
            is_primary: getField(addr, "IsPrimary", "isPrimary") || false,
            location: getField(addr, "Location", "location") || null,
          };

          const { data: existing } = await supabase.from("crm_addresses").select("id").eq("crelate_id", addrCrelateId).maybeSingle();
          if (existing) {
            await supabase.from("crm_addresses").update(data).eq("crelate_id", addrCrelateId);
            result.updated++;
          } else {
            await supabase.from("crm_addresses").insert(data);
            result.created++;
          }
        } catch (e) {
          result.failed++;
          result.errors.push(`Address: ${e.message}`);
        }
      }
    }
  } catch (e) {
    result.errors.push(`Fetch addresses failed: ${e.message}`);
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

    // Verify user
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || "full";
    const entityType = body.entity_type || "all";

    // Test connection
    if (action === "test") {
      try {
        const testUrl = `${CRELATE_BASE}/contacts?api_key=${crelateApiKey}&offset=0&limit=1`;
        console.log("Testing connection...");
        const res = await fetch(testUrl, { headers: { "x-api-key": crelateApiKey } });
        const responseText = await res.text();
        console.log(`Test response status: ${res.status}, body preview: ${responseText.substring(0, 500)}`);
        
        if (!res.ok) {
          return new Response(JSON.stringify({ success: false, error: `API returned ${res.status}: ${responseText}` }), {
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

    const results: SyncResult[] = [];

    const syncMap: Record<string, (ak: string, sb: any) => Promise<SyncResult>> = {
      contacts: syncContacts,
      companies: syncCompanies,
      jobs: syncJobs,
      placements: syncPlacements,
      activities: syncActivities,
      addresses: syncAddresses,
    };

    const entitiesToSync = entityType === "all" ? Object.keys(syncMap) : [entityType];

    for (const entity of entitiesToSync) {
      if (syncMap[entity]) {
        console.log(`Starting sync for: ${entity}`);
        const r = await syncMap[entity](crelateApiKey, supabase);
        console.log(`Sync ${entity}: total=${r.total} created=${r.created} updated=${r.updated} failed=${r.failed}`);
        results.push(r);
      }
    }

    const totalSynced = results.reduce((s, r) => s + r.created + r.updated, 0);
    const totalCreated = results.reduce((s, r) => s + r.created, 0);
    const totalUpdated = results.reduce((s, r) => s + r.updated, 0);
    const totalFailed = results.reduce((s, r) => s + r.failed, 0);
    const allErrors = results.flatMap((r) => r.errors);

    if (logEntry) {
      await supabase
        .from("crm_sync_log")
        .update({
          status: totalFailed > 0 ? "partial" : "success",
          records_synced: totalSynced,
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
        summary: { synced: totalSynced, created: totalCreated, updated: totalUpdated, failed: totalFailed },
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
