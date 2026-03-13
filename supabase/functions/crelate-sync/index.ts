import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CRELATE_BASE = "https://app.crelate.com/api3"; // v3
const PAGE_SIZE = 100;

interface SyncResult {
  entity: string;
  created: number;
  updated: number;
  failed: number;
  total: number;
  errors: string[];
}

function normalizeApiKey(apiKey: string) {
  return apiKey.trim().replace(/^['"]+|['"]+$/g, "");
}

function toHeaderRecord(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return { ...headers };
}

function withCrelateAuthHeaders(headers: Record<string, string> = {}, apiKey: string) {
  return {
    ...headers,
    "X-Api-Key": apiKey,
    "x-api-key": apiKey,
  };
}

function withApiKeyQuery(url: string, apiKey: string) {
  if (url.includes("api_key=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}api_key=${encodeURIComponent(apiKey)}`;
}

async function fetchCrelateWithAuthVariants(url: string, init: RequestInit, apiKey: string) {
  const normalizedKey = normalizeApiKey(apiKey);
  const baseHeaders = toHeaderRecord(init.headers);

  const attempts = [
    {
      name: "header_only",
      url,
      headers: withCrelateAuthHeaders({}, normalizedKey),
    },
    {
      name: "query_only",
      url: withApiKeyQuery(url, normalizedKey),
      headers: {},
    },
    {
      name: "header_and_query",
      url: withApiKeyQuery(url, normalizedKey),
      headers: withCrelateAuthHeaders({}, normalizedKey),
    },
    {
      name: "authorization_bearer",
      url,
      headers: { Authorization: `Bearer ${normalizedKey}` },
    },
  ];

  let lastResponse: Response | null = null;
  let lastAttempt = "none";

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    const response = await fetch(attempt.url, {
      ...init,
      headers: {
        ...baseHeaders,
        ...attempt.headers,
      },
    });

    if (response.status !== 401) {
      return { response, authAttempt: attempt.name };
    }

    lastResponse = response;
    lastAttempt = attempt.name;

    // Consume response body before next attempt to avoid resource leaks.
    if (i < attempts.length - 1) {
      await response.text();
    }
  }

  return { response: lastResponse!, authAttempt: lastAttempt };
}

async function crelateGet(endpoint: string, apiKey: string, offset = 0, limit = PAGE_SIZE) {
  const normalizedKey = normalizeApiKey(apiKey);
  const url = `${CRELATE_BASE}/${endpoint}?api_key=${normalizedKey}&offset=${offset}&limit=${limit}`;
  const res = await fetch(url, { headers: withCrelateAuthHeaders({}, normalizedKey) });
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

      const rawType = String(c.RecordType || "").toLowerCase();
      const contactType = rawType.includes("candidate") ? "candidate"
        : rawType.includes("client") ? "client"
        : rawType.includes("contact") ? "contact"
        : "contact";

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

    // Get company crelate_id -> local id map for linking
    const { data: localCompanies } = await supabase
      .from("crm_companies")
      .select("id, crelate_id, name")
      .not("crelate_id", "is", null);
    const compCrelateToLocal: Record<string, string> = {};
    const compNameToLocal: Record<string, string> = {};
    for (const co of (localCompanies || [])) {
      if (co.crelate_id) compCrelateToLocal[co.crelate_id] = co.id;
      if (co.name) compNameToLocal[co.name.toLowerCase()] = co.id;
    }

    // Build sub-record arrays
    const allEmails: any[] = [];
    const allPhones: any[] = [];
    const allUrls: any[] = [];
    const allAddresses: any[] = [];
    const allTagNames = new Set<string>();
    const contactTagPairs: { crelateId: string; tagName: string }[] = [];
    const contactCompanyUpdates: { id: string; primary_company_id: string }[] = [];
    const allCareerHistory: any[] = [];

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

      // Link contact to company via CurrentPosition or CompanyId
      const compRef = c.CompanyId?.Id || c.CompanyId;
      const currentPosCompany = c.CurrentPosition?.CompanyId?.Id || c.CurrentPosition?.CompanyId || c.CurrentPosition?.CompanyName;
      if (compRef && typeof compRef === "string" && compCrelateToLocal[compRef]) {
        contactCompanyUpdates.push({ id: contactId, primary_company_id: compCrelateToLocal[compRef] });
      } else if (currentPosCompany && typeof currentPosCompany === "string") {
        const localId = compCrelateToLocal[currentPosCompany] || compNameToLocal[currentPosCompany.toLowerCase()];
        if (localId) {
          contactCompanyUpdates.push({ id: contactId, primary_company_id: localId });
        }
      }

      // Career History from CurrentPosition and PastPositions
      const currentPos = c.CurrentPosition;
      if (currentPos) {
        const compName = currentPos.CompanyName || currentPos.Company || null;
        const compId = currentPos.CompanyId?.Id || currentPos.CompanyId;
        allCareerHistory.push({
          crelate_id: `${crelateId}_current`,
          contact_id: contactId,
          entry_type: "experience",
          job_title: currentPos.JobTitle || currentPos.Title || null,
          company_name: compName,
          company_id: (compId && compCrelateToLocal[compId]) || null,
          started_at: currentPos.StartDate || null,
          ended_at: null,
          is_current: true,
          description: currentPos.Description || null,
        });
      }

      const pastPositions = c.PastPositions || c.WorkHistory || c.Positions || [];
      if (Array.isArray(pastPositions)) {
        for (let idx = 0; idx < pastPositions.length; idx++) {
          const pos = pastPositions[idx];
          const posId = pos.Id || `${crelateId}_past_${idx}`;
          const compName = pos.CompanyName || pos.Company || null;
          const compId = pos.CompanyId?.Id || pos.CompanyId;
          allCareerHistory.push({
            crelate_id: posId,
            contact_id: contactId,
            entry_type: "experience",
            job_title: pos.JobTitle || pos.Title || null,
            company_name: compName,
            company_id: (compId && typeof compId === "string" && compCrelateToLocal[compId]) || null,
            started_at: pos.StartDate || null,
            ended_at: pos.EndDate || null,
            is_current: false,
            description: pos.Description || null,
          });
        }
      }

      // Education
      const education = c.Education || c.EducationHistory || [];
      if (Array.isArray(education)) {
        for (let idx = 0; idx < education.length; idx++) {
          const edu = education[idx];
          const eduId = edu.Id || `${crelateId}_edu_${idx}`;
          allCareerHistory.push({
            crelate_id: eduId,
            contact_id: contactId,
            entry_type: "education",
            degree: edu.Degree || edu.DegreeName || null,
            institution: edu.School || edu.Institution || edu.SchoolName || null,
            started_at: edu.StartDate || null,
            ended_at: edu.EndDate || null,
            is_current: false,
            description: edu.Description || edu.FieldOfStudy || null,
          });
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
    if (allCareerHistory.length > 0) {
      console.log(`Upserting ${allCareerHistory.length} career history entries...`);
      await batchUpsert(supabase, "crm_career_history", allCareerHistory, "crelate_id");
    }

    // Link contacts to companies
    if (contactCompanyUpdates.length > 0) {
      console.log(`Linking ${contactCompanyUpdates.length} contacts to companies...`);
      for (const upd of contactCompanyUpdates) {
        await supabase.from("crm_contacts").update({ primary_company_id: upd.primary_company_id }).eq("id", upd.id);
      }
    }

    // Tags: upsert tag names, then link
    if (allTagNames.size > 0) {
      console.log(`Processing ${allTagNames.size} unique tags...`);
      const tagRows = Array.from(allTagNames).map(name => ({ name }));
      for (const tr of tagRows) {
        await supabase.from("crm_tags").upsert(tr, { onConflict: "name", ignoreDuplicates: true });
      }
      const { data: allTags } = await supabase.from("crm_tags").select("id, name");
      const tagNameToId: Record<string, string> = {};
      for (const t of (allTags || [])) tagNameToId[t.name] = t.id;

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
        for (let i = 0; i < tagLinks.length; i += 500) {
          const chunk = tagLinks.slice(i, i + 500);
          await supabase.from("crm_contact_tags").upsert(chunk, { 
            onConflict: "contact_id,tag_id", 
            ignoreDuplicates: true 
          });
        }
      }
    }

    console.log(`Contact sync complete: ${result.total} contacts, ${allEmails.length} emails, ${allPhones.length} phones, ${allUrls.length} urls, ${allAddresses.length} addresses, ${allCareerHistory.length} career entries, ${contactCompanyUpdates.length} company links`);
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

async function syncDocuments(apiKey: string, supabase: any, cursorOffset = 0, batchSize = 50): Promise<SyncResult & { nextCursor?: number; hasMore?: boolean }> {
  const normalizedApiKey = apiKey.trim();
  const result: SyncResult & { nextCursor?: number; hasMore?: boolean } = { entity: "documents", created: 0, updated: 0, failed: 0, total: 0, errors: [] };

  try {
    // Get all contacts with crelate_ids, ordered for consistent pagination
    const { data: allContacts } = await supabase
      .from("crm_contacts")
      .select("id, crelate_id")
      .not("crelate_id", "is", null)
      .order("created_at", { ascending: true });

    if (!allContacts || allContacts.length === 0) {
      console.log("No contacts found for document sync");
      return result;
    }

    // Paginate: only process a batch of contacts per call
    const contacts = allContacts.slice(cursorOffset, cursorOffset + batchSize);
    const hasMore = cursorOffset + batchSize < allContacts.length;
    
    console.log(`Document sync batch: contacts ${cursorOffset}-${cursorOffset + contacts.length} of ${allContacts.length}`);

    if (contacts.length === 0) {
      return result;
    }

    // Get already-synced document crelate_ids to skip
    const { data: existingDocs } = await supabase
      .from("crm_contact_documents")
      .select("crelate_id")
      .not("crelate_id", "is", null);
    const existingSet = new Set((existingDocs || []).map((d: any) => d.crelate_id));

    let totalAttachments = 0;

    // Log first few contacts for debugging
    let debugCount = 0;
    let abortPagination = false;

    for (const contact of contacts) {
      try {
        // Use Crelate v2 document list endpoint (POST)
        const listUrl = `https://app.crelate.com/api/v2/document/list/_Contacts/${contact.crelate_id}`;
        if (debugCount < 3) {
          console.log(`Fetching attachments from: ${listUrl}`);
        }

        const res = await fetchCrelateWithApiKeyFallback(
          listUrl,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Types: [0, 1, 2] }),
          },
          normalizedApiKey,
        );

        if (!res.ok) {
          if (debugCount < 3) {
            console.log(`Attachments API returned ${res.status} for contact ${contact.crelate_id}`);
            const errText = await res.text();
            console.log(`Response body: ${errText.substring(0, 500)}`);
            debugCount++;
          } else {
            await res.text(); // consume body
          }

          if (res.status === 401) {
            console.error("401 Unauthorized on document list API - aborting document sync");
            result.failed += 1;
            result.errors.push(`401 Unauthorized from Crelate document API for contact ${contact.crelate_id}`);
            abortPagination = true;
            break;
          }

          if (res.status === 404) continue;
          if (res.status === 429) {
            console.warn("Rate limited on attachments list, waiting 5s...");
            await new Promise(r => setTimeout(r, 5000));
            continue;
          }
          continue;
        }

        const attachData = await res.json();
        
        // Debug: log first few responses
        if (debugCount < 3) {
          const preview = JSON.stringify(attachData).substring(0, 500);
          console.log(`Contact ${contact.crelate_id} attachments response: ${preview}`);
          debugCount++;
        }

        // Response shape: { Total: number, Attachments: [...] }
        const attachments: any[] = attachData?.Attachments || [];

        if (attachments.length === 0) continue;
        
        console.log(`Found ${attachments.length} attachments for contact ${contact.crelate_id}`);

        for (const att of attachments) {
          const attId = att.Id || att.id;
          if (!attId) continue;

          const crelateDocId = `${contact.crelate_id}_${attId}`;
          if (existingSet.has(crelateDocId)) continue;

          totalAttachments++;
          const fileName = att.FileName || att.Name || `attachment_${attId}`;
          const fileType = att.ContentType || guessContentType(fileName);

          try {
            // Download via v2 attachment endpoint (type=0 for original file)
            const dlUrl = `https://app.crelate.com/api/attachment/${attId}/download?type=0`;
            const dlRes = await fetchCrelateWithApiKeyFallback(
              dlUrl,
              { method: "GET" },
              normalizedApiKey,
            );
            if (!dlRes.ok) {
              if (dlRes.status === 429) {
                console.warn(`Rate limited on attachment download, waiting 5s...`);
                await new Promise(r => setTimeout(r, 5000));
              }
              result.failed++;
              continue;
            }

            const fileBlob = await dlRes.blob();
            const storagePath = `${contact.id}/${crelateDocId}_${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from("contact-documents")
              .upload(storagePath, fileBlob, {
                contentType: fileType,
                upsert: true,
              });

            if (uploadError) {
              console.warn(`Upload failed for ${fileName}: ${uploadError.message}`);
              result.failed++;
              continue;
            }

            const { error: insertError } = await supabase
              .from("crm_contact_documents")
              .upsert({
                crelate_id: crelateDocId,
                contact_id: contact.id,
                file_name: fileName,
                file_url: storagePath,
                file_type: fileType,
                file_size_bytes: fileBlob.size || att.FileSize || null,
              }, { onConflict: "crelate_id" });

            if (insertError) {
              result.failed++;
            } else {
              result.created++;
            }
          } catch (dlErr) {
            result.failed++;
          }

          await new Promise(r => setTimeout(r, 500));
        }
      } catch (contactErr) {
        console.warn(`Error fetching attachments for contact ${contact.crelate_id}: ${contactErr.message}`);
      }

      await new Promise(r => setTimeout(r, 300));
    }

    result.total = totalAttachments;
    result.hasMore = abortPagination ? false : hasMore;
    result.nextCursor = result.hasMore ? cursorOffset + batchSize : undefined;
    console.log(`Document sync batch complete: ${result.created} uploaded, ${result.failed} failed, hasMore=${hasMore}`);
  } catch (e) {
    result.errors.push(`Documents sync failed: ${e.message}`);
  }

  return result;
}

function guessContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    txt: "text/plain",
    rtf: "application/rtf",
  };
  return map[ext || ""] || "application/octet-stream";
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

    // Log first activity's ALL keys and values for field discovery
    if (activities.length > 0) {
      console.log(`Sample activity keys: ${Object.keys(activities[0]).join(", ")}`);
      // Log all ID-like and reference fields from first 3 activities
      for (let i = 0; i < Math.min(3, activities.length); i++) {
        const a = activities[i];
        const refFields: Record<string, any> = {};
        for (const k of Object.keys(a)) {
          const v = a[k];
          if (v === null || v === undefined) continue;
          // Log ID fields, object fields, and string fields
          if (k.toLowerCase().includes("id") || k.toLowerCase().includes("contact") 
              || k.toLowerCase().includes("regard") || k.toLowerCase().includes("parent")
              || k.toLowerCase().includes("entity") || k.toLowerCase().includes("related")
              || k.toLowerCase().includes("who") || k.toLowerCase().includes("person")
              || typeof v === "object") {
            refFields[k] = typeof v === "object" ? JSON.stringify(v).substring(0, 200) : String(v).substring(0, 100);
          }
        }
        console.log(`Activity[${i}] ref fields: ${JSON.stringify(refFields)}`);
      }
      // Also log all keys with non-null string values > 10 chars from first activity with content
      const withContent = activities.find(a => Object.values(a).some(v => typeof v === "string" && v.length > 20));
      if (withContent) {
        const contentFields: Record<string, string> = {};
        for (const k of Object.keys(withContent)) {
          const v = withContent[k];
          if (typeof v === "string" && v.length > 10) {
            contentFields[k] = v.substring(0, 100);
          }
        }
        console.log(`Activity content fields sample: ${JSON.stringify(contentFields)}`);
      }
    }

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

    // Try many possible field names for body content
    const getBody = (a: any): string | null => {
      return a.Body || a.Description || a.Content || a.Note || a.Text 
        || a.HtmlBody || a.Html || a.RichTextBody || a.PlainTextBody
        || a.Notes || a.Comment || a.Details || a.Message
        || getField(a, "Body", "Description", "Content", "Note", "Text", "Notes", "Comment", "Details", "Message", "HtmlBody")
        || null;
    };

    const getActivityType = (a: any): string => {
      const raw = String(a.ActivityType || a.Type || a.Category || "").toLowerCase();
      if (raw.includes("email")) return "email";
      if (raw.includes("meeting")) return "meeting";
      if (raw.includes("call") || raw.includes("phone")) return "call";
      if (raw.includes("task")) return "task";
      if (raw.includes("interview")) return "interview";
      return raw || "note";
    };

    // Helper to parse Crelate JSON reference fields (they come as JSON strings)
    const parseRef = (val: any): string | null => {
      if (!val) return null;
      if (typeof val === "object" && val.Id) return val.Id;
      if (typeof val === "string") {
        // Could be a JSON string like {"EntityName":"Contacts","Id":"..."}
        if (val.startsWith("{")) {
          try {
            const parsed = JSON.parse(val);
            if (parsed?.Id) return parsed.Id;
          } catch {}
        }
        // Or just a plain ID string
        return val;
      }
      return null;
    };

    const rows = activities
      .filter(a => a.Id)
      .map(a => {
        // ParentId is the main contact/entity reference in Crelate activities
        // It's a JSON string like {"EntityName":"Contacts","Id":"...","Title":"..."}
        const parentRef = parseRef(a.ParentId);
        const regardingRef = parseRef(a.RegardingId);
        const contactRef = parseRef(a.ContactId);
        // Use first matching contact
        const resolvedContId = contactRef || parentRef || regardingRef;
        
        const compId = parseRef(a.CompanyId);
        const jId = parseRef(a.JobId);
        return {
          crelate_id: a.Id,
          activity_type: getActivityType(a),
          subject: a.Subject || null,
          body: a.Html || a.Body || a.Description || a.Content || a.Note || a.Text || null,
          contact_id: (resolvedContId && contactMap[resolvedContId]) || null,
          company_id: (compId && compMap[compId]) || null,
          job_id: (jId && jobMap[jId]) || null,
          direction: a.Direction || null,
          completed: a.Completed !== false,
          scheduled_at: a.When || a.ScheduledAt || a.DueDate || null,
          completed_at: a.CompletedOn || a.CompletedAt || null,
          duration_minutes: a.Duration ? Math.round(Number(a.Duration)) : (a.DurationMinutes ? Math.round(Number(a.DurationMinutes)) : null),
          location: a.Location || null,
          is_pinned: a.Pinned || false,
        };
      });

    const r = await batchUpsert(supabase, "crm_activities", rows, "crelate_id");
    result.created = r.created;
    result.failed = r.failed;
    result.errors.push(...r.errors);

    // Also populate crm_contact_notes from activities that have content and a contact_id
    const noteRows = rows
      .filter(r => r.contact_id && (r.body || r.subject))
      .map(r => ({
        contact_id: r.contact_id,
        content: [r.subject, r.body].filter(Boolean).join("\n\n"),
        is_pinned: r.is_pinned,
        created_at: r.scheduled_at || r.completed_at || new Date().toISOString(),
      }));

    if (noteRows.length > 0) {
      console.log(`Populating ${noteRows.length} contact notes from activities...`);
      // Clear existing auto-generated notes and re-insert
      // Use insert (not upsert) since crm_contact_notes has no crelate_id yet for dedup
      // First check if notes already exist
      const { data: existingNotes } = await supabase
        .from("crm_contact_notes")
        .select("id")
        .limit(1);
      
      if (!existingNotes || existingNotes.length === 0) {
        for (let i = 0; i < noteRows.length; i += 500) {
          const chunk = noteRows.slice(i, i + 500);
          const { error } = await supabase.from("crm_contact_notes").insert(chunk);
          if (error) {
            console.warn(`Contact notes insert chunk ${i} error: ${error.message}`);
          }
        }
        console.log(`Inserted ${noteRows.length} contact notes`);
      } else {
        console.log("Contact notes already exist, skipping population to avoid duplicates");
      }
    }
  } catch (e) {
    result.errors.push(`Activities sync failed: ${e.message}`);
  }

  return result;
}

async function syncPipelineItems(apiKey: string, supabase: any): Promise<SyncResult> {
  const result: SyncResult = { entity: "pipeline_items", created: 0, updated: 0, failed: 0, total: 0, errors: [] };

  try {
    // Get lookup maps
    const { data: contacts } = await supabase.from("crm_contacts").select("id, crelate_id").not("crelate_id", "is", null);
    const contactMap: Record<string, string> = {};
    for (const c of (contacts || [])) if (c.crelate_id) contactMap[c.crelate_id] = c.id;

    const { data: jobs } = await supabase.from("crm_jobs").select("id, crelate_id").not("crelate_id", "is", null);
    const jobMap: Record<string, string> = {};
    for (const j of (jobs || [])) if (j.crelate_id) jobMap[j.crelate_id] = j.id;

    // Fetch pipeline/sales items from Crelate
    let items: any[] = [];
    try {
      items = await fetchAllPages("sales", apiKey);
    } catch {
      try {
        items = await fetchAllPages("pipeline", apiKey);
      } catch (e2) {
        // Try fetching per-job candidates
        console.log("No pipeline endpoint, fetching per-job candidates...");
        for (const job of (jobs || [])) {
          if (!job.crelate_id) continue;
          try {
            const url = `${CRELATE_BASE}/jobs/${job.crelate_id}/candidates?api_key=${apiKey}`;
            const res = await fetch(url, { headers: { "x-api-key": apiKey } });
            if (!res.ok) { await res.text(); continue; }
            const data = await res.json();
            const candidates = Array.isArray(data) ? data : (data?.Data || []);
            for (const cand of candidates) {
              items.push({ ...cand, _jobCrelateId: job.crelate_id });
            }
          } catch {}
          await new Promise(r => setTimeout(r, 300));
        }
      }
    }

    result.total = items.length;
    if (items.length === 0) return result;

    const rows = items
      .filter(item => {
        const contactRef = item.ContactId?.Id || item.ContactId || item.Id;
        const jobRef = item._jobCrelateId || item.JobId?.Id || item.JobId;
        return contactRef && jobRef && contactMap[contactRef] && jobMap[jobRef];
      })
      .map(item => {
        const contactRef = item.ContactId?.Id || item.ContactId || item.Id;
        const jobRef = item._jobCrelateId || item.JobId?.Id || item.JobId;
        const itemId = item.SalesId || item.PipelineId || item.Id || `${contactRef}_${jobRef}`;
        
        const rawStatus = String(item.Status || item.Stage || item.EntityStatus || "").toLowerCase();
        const status = rawStatus.includes("interview") ? "interview"
          : rawStatus.includes("offer") ? "offer"
          : rawStatus.includes("placed") ? "placed"
          : rawStatus.includes("reject") ? "rejected"
          : rawStatus.includes("withdraw") ? "withdrawn"
          : rawStatus.includes("submit") ? "submitted"
          : rawStatus.includes("screen") ? "screening"
          : "new";

        return {
          crelate_id: itemId,
          contact_id: contactMap[contactRef],
          job_id: jobMap[jobRef],
          status,
          executive_summary: item.ExecutiveSummary || item.Summary || null,
          average_rating: item.Rating || item.AverageRating || null,
        };
      });

    if (rows.length > 0) {
      const r = await batchUpsert(supabase, "crm_pipeline_items", rows, "crelate_id");
      result.created = r.created;
      result.failed = r.failed;
      result.errors.push(...r.errors);
    }

    console.log(`Pipeline items sync: ${rows.length} items processed`);
  } catch (e) {
    result.errors.push(`Pipeline items sync failed: ${e.message}`);
  }

  return result;
}

async function syncSources(apiKey: string, supabase: any): Promise<SyncResult> {
  const result: SyncResult = { entity: "sources", created: 0, updated: 0, failed: 0, total: 0, errors: [] };

  try {
    let sources: any[] = [];
    try {
      sources = await fetchAllPages("sources", apiKey);
    } catch {
      // Sources might not have a dedicated endpoint; extract from contacts
      console.log("No sources endpoint, extracting from contacts...");
      const { data: contacts } = await supabase
        .from("crm_contacts")
        .select("source_id")
        .not("source_id", "is", null);
      // Sources already come with contacts, skip if no endpoint
      return result;
    }
    
    result.total = sources.length;
    const rows = sources
      .filter(s => s.Id && s.Name)
      .map(s => ({
        crelate_id: s.Id,
        name: s.Name,
      }));

    if (rows.length > 0) {
      const r = await batchUpsert(supabase, "crm_contact_sources", rows, "crelate_id");
      result.created = r.created;
      result.failed = r.failed;
      result.errors.push(...r.errors);
    }
  } catch (e) {
    result.errors.push(`Sources sync failed: ${e.message}`);
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
    const crelateApiKey = Deno.env.get("CRELATE_API_KEY")?.trim();

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
    const cursorOffset = body.cursor_offset || 0;

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
      sources: syncSources,
      contacts: syncContacts,
      companies: syncCompanies,
      jobs: syncJobs,
      placements: syncPlacements,
      pipeline_items: syncPipelineItems,
      activities: syncActivities,
      documents: syncDocuments,
    };

    const entitiesToSync = entityType === "all" ? Object.keys(syncMap) : [entityType];
    const results: SyncResult[] = [];

    for (const entity of entitiesToSync) {
      if (syncMap[entity]) {
        console.log(`Starting sync for: ${entity}`);
        let r: SyncResult & { nextCursor?: number; hasMore?: boolean };
        if (entity === "documents") {
          r = await syncDocuments(crelateApiKey, supabase, cursorOffset);
        } else {
          r = await syncMap[entity](crelateApiKey, supabase);
        }
        console.log(`Sync ${entity}: total=${r.total} created=${r.created} failed=${r.failed}`);
        results.push(r);
      }
    }

    const totalCreated = results.reduce((s, r) => s + r.created, 0);
    const totalUpdated = results.reduce((s, r) => s + r.updated, 0);
    const totalFailed = results.reduce((s, r) => s + r.failed, 0);
    const allErrors = results.flatMap((r) => r.errors);
    const totalSynced = totalCreated + totalUpdated;

    const syncStatus = allErrors.length > 0
      ? (totalSynced > 0 || totalFailed > 0 ? "partial" : "failed")
      : (totalFailed > 0 ? "partial" : "success");

    if (logEntry) {
      await supabase
        .from("crm_sync_log")
        .update({
          status: syncStatus,
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

    // Check if any result has hasMore (for paginated document sync)
    const docResult = results.find((r: any) => r.entity === "documents" && r.hasMore);

    return new Response(
      JSON.stringify({
        success: syncStatus !== "failed",
        results,
        summary: { synced: totalSynced, created: totalCreated, updated: totalUpdated, failed: totalFailed },
        ...(docResult ? { hasMore: true, nextCursor: (docResult as any).nextCursor, continueEntity: "documents" } : {}),
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
