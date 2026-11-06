import { supabase } from "@/integrations/supabase/client";
import { approvedResumeContactDetails, type ParsedResume } from "./resumeParsing";

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