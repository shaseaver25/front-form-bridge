import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CRELATE_BASE = "https://app.crelate.com/api3";
const PAGE_SIZE = 200;

interface SyncResult {
  entity: string;
  created: number;
  updated: number;
  failed: number;
  total: number;
  errors: string[];
}

async function crelateGet(endpoint: string, apiKey: string, skip = 0, take = PAGE_SIZE) {
  const url = `${CRELATE_BASE}/${endpoint}?api_key=${apiKey}&skip=${skip}&take=${take}&modified=2000-01-01T00:00:00Z`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Crelate API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function fetchAllPages(endpoint: string, apiKey: string): Promise<any[]> {
  const allItems: any[] = [];
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    const data = await crelateGet(endpoint, apiKey, skip, PAGE_SIZE);
    const items = data.Items || data.Results || data || [];
    if (Array.isArray(items) && items.length > 0) {
      allItems.push(...items);
      skip += items.length;
      hasMore = items.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
    // Rate limiting: small delay between pages
    await new Promise((r) => setTimeout(r, 200));
  }

  return allItems;
}

async function syncContacts(apiKey: string, supabase: any): Promise<SyncResult> {
  const result: SyncResult = { entity: "contacts", created: 0, updated: 0, failed: 0, total: 0, errors: [] };

  try {
    const contacts = await fetchAllPages("contacts", apiKey);
    result.total = contacts.length;

    for (const c of contacts) {
      try {
        const contactData = {
          crelate_id: c.Id,
          first_name: c.FirstName || null,
          last_name: c.LastName || "Unknown",
          middle_name: c.MiddleName || null,
          nick_name: c.NickName || null,
          salutation: c.Salutation || null,
          suffix: c.Suffix || null,
          job_title: c.JobTitle || null,
          description: c.Description || null,
          status: c.Status || "active",
          contact_type: c.ContactType || "candidate",
          icon_attachment_url: c.IconAttachmentUrl || null,
          salary: c.Salary || null,
          desired_salary_min: c.DesiredSalaryMin || null,
          desired_salary_max: c.DesiredSalaryMax || null,
          salary_details: c.SalaryDetails || null,
        };

        // Check if exists
        const { data: existing } = await supabase
          .from("crm_contacts")
          .select("id")
          .eq("crelate_id", c.Id)
          .maybeSingle();

        if (existing) {
          await supabase.from("crm_contacts").update(contactData).eq("crelate_id", c.Id);
          result.updated++;
        } else {
          await supabase.from("crm_contacts").insert(contactData);
          result.created++;
        }

        // Get the contact's local ID
        const { data: localContact } = await supabase
          .from("crm_contacts")
          .select("id")
          .eq("crelate_id", c.Id)
          .single();

        if (!localContact) continue;
        const contactId = localContact.id;

        // Sync emails
        if (c.EmailAddresses && Array.isArray(c.EmailAddresses)) {
          for (const email of c.EmailAddresses) {
            const emailData = {
              crelate_id: email.Id || `${c.Id}_email_${email.Value}`,
              contact_id: contactId,
              value: email.Value,
              category: email.Category || "work",
              is_primary: email.IsPrimary || false,
              is_invalid: email.IsInvalid || false,
            };
            const { data: existingEmail } = await supabase
              .from("crm_contact_emails")
              .select("id")
              .eq("crelate_id", emailData.crelate_id)
              .maybeSingle();
            if (existingEmail) {
              await supabase.from("crm_contact_emails").update(emailData).eq("crelate_id", emailData.crelate_id);
            } else {
              await supabase.from("crm_contact_emails").insert(emailData);
            }
          }
        }

        // Sync phones
        if (c.PhoneNumbers && Array.isArray(c.PhoneNumbers)) {
          for (const phone of c.PhoneNumbers) {
            const phoneData = {
              crelate_id: phone.Id || `${c.Id}_phone_${phone.Value}`,
              contact_id: contactId,
              value: phone.Value,
              category: phone.Category || "work",
              is_primary: phone.IsPrimary || false,
              extension: phone.Extension || null,
            };
            const { data: existingPhone } = await supabase
              .from("crm_contact_phones")
              .select("id")
              .eq("crelate_id", phoneData.crelate_id)
              .maybeSingle();
            if (existingPhone) {
              await supabase.from("crm_contact_phones").update(phoneData).eq("crelate_id", phoneData.crelate_id);
            } else {
              await supabase.from("crm_contact_phones").insert(phoneData);
            }
          }
        }

        // Sync URLs
        if (c.Urls && Array.isArray(c.Urls)) {
          for (const url of c.Urls) {
            const urlData = {
              crelate_id: url.Id || `${c.Id}_url_${url.Value}`,
              contact_id: contactId,
              value: url.Value,
              category: url.Category || "business",
              is_primary: url.IsPrimary || false,
            };
            const { data: existingUrl } = await supabase
              .from("crm_contact_urls")
              .select("id")
              .eq("crelate_id", urlData.crelate_id)
              .maybeSingle();
            if (existingUrl) {
              await supabase.from("crm_contact_urls").update(urlData).eq("crelate_id", urlData.crelate_id);
            } else {
              await supabase.from("crm_contact_urls").insert(urlData);
            }
          }
        }

        // Sync tags
        if (c.Tags && Array.isArray(c.Tags)) {
          for (const tag of c.Tags) {
            const tagName = typeof tag === "string" ? tag : tag.Name || tag.Value;
            if (!tagName) continue;
            // Find or create tag
            let { data: existingTag } = await supabase
              .from("crm_tags")
              .select("id")
              .eq("name", tagName)
              .maybeSingle();
            if (!existingTag) {
              const { data: newTag } = await supabase
                .from("crm_tags")
                .insert({ name: tagName })
                .select("id")
                .single();
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
                await supabase.from("crm_contact_tags").insert({
                  contact_id: contactId,
                  tag_id: existingTag.id,
                });
              }
            }
          }
        }
      } catch (e) {
        result.failed++;
        result.errors.push(`Contact ${c.Id}: ${e.message}`);
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

    for (const c of companies) {
      try {
        const data = {
          crelate_id: c.Id,
          name: c.Name || "Unnamed",
          domain: c.Domain || null,
          company_type: c.CompanyType || "client",
          status: c.Status || "active",
          description: c.Description || null,
          icon_attachment_url: c.IconAttachmentUrl || null,
          revenue: c.Revenue || null,
        };

        const { data: existing } = await supabase
          .from("crm_companies")
          .select("id")
          .eq("crelate_id", c.Id)
          .maybeSingle();

        if (existing) {
          await supabase.from("crm_companies").update(data).eq("crelate_id", c.Id);
          result.updated++;
        } else {
          await supabase.from("crm_companies").insert(data);
          result.created++;
        }
      } catch (e) {
        result.failed++;
        result.errors.push(`Company ${c.Id}: ${e.message}`);
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
        // Resolve company
        let companyId = null;
        if (j.CompanyId) {
          const { data: company } = await supabase
            .from("crm_companies")
            .select("id")
            .eq("crelate_id", j.CompanyId)
            .maybeSingle();
          companyId = company?.id || null;
        }

        const data = {
          crelate_id: j.Id,
          name: j.Name || j.JobTitle || "Untitled",
          job_title: j.JobTitle || null,
          job_type: j.JobType || null,
          description: j.Description || null,
          status: j.Status || "open",
          location: j.Location || null,
          salary_min: j.SalaryMin || null,
          salary_max: j.SalaryMax || null,
          hourly_rate_min: j.HourlyRateMin || null,
          hourly_rate_max: j.HourlyRateMax || null,
          remote_type: j.RemoteType || null,
          number_of_openings: j.NumberOfOpenings || 1,
          company_id: companyId,
          compensation_details: j.CompensationDetails || null,
          priority: j.Priority || null,
        };

        const { data: existing } = await supabase
          .from("crm_jobs")
          .select("id")
          .eq("crelate_id", j.Id)
          .maybeSingle();

        if (existing) {
          await supabase.from("crm_jobs").update(data).eq("crelate_id", j.Id);
          result.updated++;
        } else {
          await supabase.from("crm_jobs").insert(data);
          result.created++;
        }
      } catch (e) {
        result.failed++;
        result.errors.push(`Job ${j.Id}: ${e.message}`);
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
        let jobId = null;
        if (p.JobId) {
          const { data: job } = await supabase
            .from("crm_jobs")
            .select("id")
            .eq("crelate_id", p.JobId)
            .maybeSingle();
          jobId = job?.id;
        }
        if (!jobId) {
          result.failed++;
          result.errors.push(`Placement ${p.Id}: no matching job`);
          continue;
        }

        let contactId = null;
        if (p.ContactId) {
          const { data: contact } = await supabase
            .from("crm_contacts")
            .select("id")
            .eq("crelate_id", p.ContactId)
            .maybeSingle();
          contactId = contact?.id || null;
        }

        const data = {
          crelate_id: p.Id,
          job_id: jobId,
          contact_id: contactId,
          salary: p.Salary || null,
          fee_amount: p.FeeAmount || null,
          fee_percent: p.FeePercent || null,
          placement_date: p.PlacementDate || null,
          start_date: p.StartDate || null,
          notes: p.Notes || null,
        };

        const { data: existing } = await supabase
          .from("crm_placements")
          .select("id")
          .eq("crelate_id", p.Id)
          .maybeSingle();

        if (existing) {
          await supabase.from("crm_placements").update(data).eq("crelate_id", p.Id);
          result.updated++;
        } else {
          await supabase.from("crm_placements").insert(data);
          result.created++;
        }
      } catch (e) {
        result.failed++;
        result.errors.push(`Placement ${p.Id}: ${e.message}`);
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
    const activities = await fetchAllPages("activities", apiKey);
    result.total = activities.length;

    for (const a of activities) {
      try {
        let contactId = null;
        if (a.ContactId) {
          const { data: contact } = await supabase
            .from("crm_contacts")
            .select("id")
            .eq("crelate_id", a.ContactId)
            .maybeSingle();
          contactId = contact?.id || null;
        }

        let companyId = null;
        if (a.CompanyId) {
          const { data: company } = await supabase
            .from("crm_companies")
            .select("id")
            .eq("crelate_id", a.CompanyId)
            .maybeSingle();
          companyId = company?.id || null;
        }

        let jobId = null;
        if (a.JobId) {
          const { data: job } = await supabase
            .from("crm_jobs")
            .select("id")
            .eq("crelate_id", a.JobId)
            .maybeSingle();
          jobId = job?.id || null;
        }

        const data = {
          crelate_id: a.Id,
          activity_type: a.ActivityType || a.Type || "note",
          subject: a.Subject || null,
          body: a.Body || a.Description || null,
          contact_id: contactId,
          company_id: companyId,
          job_id: jobId,
          direction: a.Direction || null,
          completed: a.Completed !== false,
          scheduled_at: a.ScheduledAt || a.DueDate || null,
          completed_at: a.CompletedAt || null,
          duration_minutes: a.DurationMinutes || null,
          location: a.Location || null,
          is_pinned: a.IsPinned || false,
        };

        const { data: existing } = await supabase
          .from("crm_activities")
          .select("id")
          .eq("crelate_id", a.Id)
          .maybeSingle();

        if (existing) {
          await supabase.from("crm_activities").update(data).eq("crelate_id", a.Id);
          result.updated++;
        } else {
          await supabase.from("crm_activities").insert(data);
          result.created++;
        }
      } catch (e) {
        result.failed++;
        result.errors.push(`Activity ${a.Id}: ${e.message}`);
      }
    }
  } catch (e) {
    result.errors.push(`Fetch activities failed: ${e.message}`);
  }

  return result;
}

async function syncAddresses(apiKey: string, supabase: any): Promise<SyncResult> {
  const result: SyncResult = { entity: "addresses", created: 0, updated: 0, failed: 0, total: 0, errors: [] };

  // Addresses are typically nested within contacts/companies in Crelate
  // We'll fetch contacts again and extract addresses
  try {
    const contacts = await fetchAllPages("contacts", apiKey);

    for (const c of contacts) {
      if (!c.Addresses || !Array.isArray(c.Addresses)) continue;

      const { data: localContact } = await supabase
        .from("crm_contacts")
        .select("id")
        .eq("crelate_id", c.Id)
        .maybeSingle();

      if (!localContact) continue;

      for (const addr of c.Addresses) {
        result.total++;
        try {
          const data = {
            crelate_id: addr.Id || `${c.Id}_addr_${addr.Line1 || result.total}`,
            contact_id: localContact.id,
            line1: addr.Line1 || addr.Street || null,
            line2: addr.Line2 || null,
            city: addr.City || null,
            state: addr.State || null,
            zip_code: addr.ZipCode || addr.PostalCode || null,
            country: addr.Country || "US",
            category: addr.Category || "business",
            is_primary: addr.IsPrimary || false,
            location: addr.Location || null,
          };

          const { data: existing } = await supabase
            .from("crm_addresses")
            .select("id")
            .eq("crelate_id", data.crelate_id)
            .maybeSingle();

          if (existing) {
            await supabase.from("crm_addresses").update(data).eq("crelate_id", data.crelate_id);
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
    // Auth check
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

    // Use service role for data operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || "full";
    const entityType = body.entity_type || "all";

    // Test connection
    if (action === "test") {
      try {
        const testUrl = `${CRELATE_BASE}/contacts?api_key=${crelateApiKey}&skip=0&take=1&modified=2000-01-01T00:00:00Z`;
        const res = await fetch(testUrl);
        if (!res.ok) {
          const text = await res.text();
          return new Response(JSON.stringify({ success: false, error: `API returned ${res.status}: ${text}` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        await res.json();
        return new Response(JSON.stringify({ success: true, message: "Connected to Crelate API" }), {
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

    const { data: logEntry } = await supabase
      .from("crm_sync_log")
      .insert(syncLog)
      .select("id")
      .single();

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
        const r = await syncMap[entity](crelateApiKey, supabase);
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
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
