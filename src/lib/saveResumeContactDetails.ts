import { supabase } from "@/integrations/supabase/client";
import { approvedResumeContactDetails, careerDate, careerKey, linkedInUrlKey, parsedResumeSchema, type ParsedResume } from "./resumeParsing";

const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");

export async function readResumeContactDetails(contactId: string) {
  const [emails, phones, addresses] = await Promise.all([
    supabase.from("crm_contact_emails").select("value,is_primary").eq("contact_id", contactId),
    supabase.from("crm_contact_phones").select("value,is_primary").eq("contact_id", contactId),
    supabase.from("crm_addresses").select("line1,city,state,zip_code,country,is_primary").eq("contact_id", contactId),
  ]);
  if (emails.error || phones.error || addresses.error) throw new Error("Unable to read existing contact information.");
  return { emails: emails.data ?? [], phones: phones.data ?? [], addresses: addresses.data ?? [] };
}
export async function saveResumeContactDetails(contactId: string, values: ParsedResume, selected: Set<string>) {
  const current = await readResumeContactDetails(contactId);
  const additions = approvedResumeContactDetails(values, selected, {
    emails: current.emails.map(row => row.value), phones: current.phones.map(row => row.value),
    addresses: current.addresses.map(row => ({ street: row.line1 ?? "", city: row.city ?? "", state: row.state ?? "", postal_code: row.zip_code ?? "", country: row.country ?? "" })),
  });
  if (additions.emails.length) {
    const result = await supabase.from("crm_contact_emails").insert(additions.emails.map((value, index) => ({ contact_id: contactId, value, is_primary: current.emails.length === 0 && index === 0 })));
    if (result.error) throw new Error("Some details may have saved. Email could not be saved; retry safely from this review.");
  }
  if (additions.phones.length) {
    const result = await supabase.from("crm_contact_phones").insert(additions.phones.map((value, index) => ({ contact_id: contactId, value, is_primary: current.phones.length === 0 && index === 0 })));
    if (result.error) throw new Error("Some details may have saved. Phone could not be saved; retry safely from this review.");
  }
  if (additions.addresses.length) {
    const result = await supabase.from("crm_addresses").insert(additions.addresses.map((address, index) => ({ contact_id: contactId, line1: address.street || null, city: address.city || null, state: address.state || null, zip_code: address.postal_code || null, country: address.country || null, is_primary: current.addresses.length === 0 && index === 0 })));
    if (result.error) throw new Error("Some details may have saved. Address could not be saved; retry safely from this review.");
  }
}
export async function readResumeCareerHistory(contactId: string) {
  const result = await supabase.from("crm_career_history").select("company_name,job_title,started_at,crm_companies(name)").eq("contact_id", contactId);
  if (result.error) throw new Error("Unable to read existing career history.");
  return (result.data ?? []).map(row => careerKey(row.company_name || row.crm_companies?.name || "", row.job_title || "", row.started_at));
}
// Adds approved roles that are not already on the contact; companies are linked only on a single exact name match and never created.
export async function saveResumeCareerHistory(contactId: string, values: ParsedResume, selected: Set<string>) {
  const existing = new Set(await readResumeCareerHistory(contactId));
  const rows = [];
  for (const [index, role] of parsedResumeSchema.parse(values).career_history.entries()) {
    const startedAt = careerDate(role.start_date);
    const key = careerKey(role.company, role.title, startedAt);
    if (!selected.has(`career-${index}`) || existing.has(key)) continue;
    existing.add(key);
    let companyId: string | null = null;
    if (role.company.trim()) {
      const match = await supabase.from("crm_companies").select("id").ilike("name", escapeLike(role.company.trim())).limit(2);
      if (match.error) throw new Error("Some details may have saved. Companies could not be matched; retry safely from this review.");
      if (match.data.length === 1) companyId = match.data[0].id;
    }
    rows.push({ contact_id: contactId, entry_type: "experience", company_id: companyId, company_name: role.company.trim() || null, job_title: role.title.trim() || null, started_at: startedAt, ended_at: role.is_current ? null : careerDate(role.end_date), is_current: role.is_current, description: role.description.trim() || null });
  }
  if (rows.length) {
    const result = await supabase.from("crm_career_history").insert(rows);
    if (result.error) throw new Error("Some details may have saved. Career history could not be saved; retry safely from this review.");
  }
}
export async function saveResumeLinkedInUrl(contactId: string, url: string) {
  const existing = await supabase.from("crm_contact_urls").select("value").eq("contact_id", contactId);
  if (existing.error) throw new Error("Some details may have saved. LinkedIn URL could not be checked; retry safely from this review.");
  if ((existing.data ?? []).some(row => linkedInUrlKey(row.value) === linkedInUrlKey(url))) return;
  const result = await supabase.from("crm_contact_urls").insert([{ contact_id: contactId, value: url, category: "linkedin", is_primary: (existing.data ?? []).length === 0 }]);
  if (result.error) throw new Error("Some details may have saved. LinkedIn URL could not be saved; retry safely from this review.");
}
