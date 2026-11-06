import { z } from "zod";

export const resumeFields = ["first_name", "last_name", "job_title", "linkedin_url", "description"] as const;
export type ResumeField = typeof resumeFields[number];
export const resumeAddressSchema = z.object({ street: z.string().max(1000), city: z.string().max(200), state: z.string().max(200), postal_code: z.string().max(100), country: z.string().max(200) }).strict();
export const parsedResumeSchema = z.object({
  first_name: z.string().max(200),
  last_name: z.string().max(200),
  job_title: z.string().max(500),
  linkedin_url: z.string().max(1000).refine(value => !value || /^https:\/\/(www\.)?linkedin\.com\//i.test(value), "Use a LinkedIn HTTPS URL"),
  description: z.string().max(30000),
  emails: z.array(z.string().trim().email().max(320)).max(20).default([]),
  phones: z.array(z.string().trim().min(5).max(100).refine(value => /^[+\d\s().\-xext]+$/i.test(value) && value.replace(/\D/g, "").length >= 5, "Use a valid phone number")).max(20).default([]),
  addresses: z.array(resumeAddressSchema).max(10).default([]),
}).strict();
export type ParsedResume = z.infer<typeof parsedResumeSchema>;
export const canParseResume = (name: string) => /\.(pdf|docx|txt)$/i.test(name);
export function approvedResumeUpdates(values: z.input<typeof parsedResumeSchema>, selected: Set<ResumeField>): Partial<Pick<ParsedResume, ResumeField>> {
  const valid = parsedResumeSchema.parse(values);
  return Object.fromEntries(resumeFields.filter(key => selected.has(key) && valid[key].trim()).map(key => [key, valid[key].trim()]));
}
export const phoneKey = (value: string) => value.replace(/\D/g, "");
export const addressKey = (value: z.infer<typeof resumeAddressSchema>) => [value.street, value.city, value.state, value.postal_code, value.country].map(part => part.trim().toLowerCase().replace(/\s+/g, " ")).join("|");
export function approvedResumeContactDetails(values: ParsedResume, selected: Set<string>, existing: { emails: string[]; phones: string[]; addresses: z.infer<typeof resumeAddressSchema>[] }) {
  const valid = parsedResumeSchema.parse(values);
  const unique = <T,>(items: T[], kind: string, seen: Set<string>, key: (item: T) => string) => items.filter((item, index) => {
    const identity = key(item);
    if (!selected.has(`${kind}-${index}`) || !identity.replace(/\|/g, "") || seen.has(identity)) return false;
    seen.add(identity); return true;
  });
  return {
    emails: unique(valid.emails, "email", new Set(existing.emails.map(value => value.trim().toLowerCase())), value => value.toLowerCase()),
    phones: unique(valid.phones, "phone", new Set(existing.phones.map(phoneKey)), phoneKey),
    addresses: unique(valid.addresses, "address", new Set(existing.addresses.map(addressKey)), addressKey),
  };
}