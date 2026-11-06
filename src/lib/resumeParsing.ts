import { z } from "zod";

export const resumeFields = ["first_name", "last_name", "job_title", "linkedin_url", "description"] as const;
export type ResumeField = typeof resumeFields[number];
export const parsedResumeSchema = z.object({
  first_name: z.string().max(200),
  last_name: z.string().max(200),
  job_title: z.string().max(500),
  linkedin_url: z.string().max(1000).refine(value => !value || /^https:\/\/(www\.)?linkedin\.com\//i.test(value), "Use a LinkedIn HTTPS URL"),
  description: z.string().max(30000),
}).strict();
export type ParsedResume = z.infer<typeof parsedResumeSchema>;
export const canParseResume = (name: string) => /\.(pdf|docx|txt)$/i.test(name);
export function approvedResumeUpdates(values: ParsedResume, selected: Set<ResumeField>): Partial<ParsedResume> {
  const valid = parsedResumeSchema.parse(values);
  return Object.fromEntries(resumeFields.filter(key => selected.has(key) && valid[key].trim()).map(key => [key, valid[key].trim()]));
}