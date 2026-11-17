import { beforeEach, expect, it, vi } from "vitest";
import { parsedResumeSchema } from "./resumeParsing";
import { saveResumeCareerHistory, saveResumeContactDetails, saveResumeLinkedInUrl } from "./saveResumeContactDetails";
const mocks = vi.hoisted(() => ({ insert: vi.fn(), records: {} as Record<string, unknown[]>, failPhone: false }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: (table: string) => ({
  select: () => ({ eq: async () => ({ data: mocks.records[table] ?? [], error: null }), ilike: () => ({ limit: async () => ({ data: mocks.records[table] ?? [], error: null }) }) }),
  insert: async (rows: unknown[]) => {
    mocks.insert(table, rows);
    if (table === "crm_contact_phones" && mocks.failPhone) return { error: { message: "denied" } };
    mocks.records[table] = [...(mocks.records[table] ?? []), ...rows];
    return { error: null };
  },
}) } }));
const values = parsedResumeSchema.parse({ first_name: "Alex", last_name: "Example", job_title: "Scrum Master", description: "Skills: Scrum", linkedin_url: "", emails: ["new@example.com"], phones: ["+1 202 555 0100"], addresses: [{ street: "1 Sample Street", city: "Chicago", state: "IL", postal_code: "60601", country: "US" }] });
const selected = new Set(["email-0", "phone-0", "address-0"]);
beforeEach(() => { mocks.records = { crm_contact_emails: [{ value: "existing@example.com", is_primary: true }] }; mocks.failPhone = false; mocks.insert.mockClear(); });
it("inserts into the correct contact tables without changing existing primary records", async () => {
  await saveResumeContactDetails("sample-contact", values, selected);
  expect(mocks.insert).toHaveBeenCalledWith("crm_contact_emails", [{ contact_id: "sample-contact", value: "new@example.com", is_primary: false }]);
  expect(mocks.insert).toHaveBeenCalledWith("crm_contact_phones", [{ contact_id: "sample-contact", value: "+1 202 555 0100", is_primary: true }]);
  expect(mocks.insert).toHaveBeenCalledWith("crm_addresses", [{ contact_id: "sample-contact", line1: "1 Sample Street", city: "Chicago", state: "IL", zip_code: "60601", country: "US", is_primary: true }]);
  expect(mocks.records.crm_contact_emails[0]).toEqual({ value: "existing@example.com", is_primary: true });
});
it("reports partial failure and does not duplicate saved emails on retry", async () => {
  mocks.failPhone = true;
  await expect(saveResumeContactDetails("sample-contact", values, selected)).rejects.toThrow("Some details may have saved");
  mocks.failPhone = false; mocks.insert.mockClear();
  await saveResumeContactDetails("sample-contact", values, selected);
  expect(mocks.insert.mock.calls.map(call => call[0])).toEqual(["crm_contact_phones", "crm_addresses"]);
});
it("adds only new career roles and links a company on a single name match", async () => {
  mocks.records.crm_career_history = [{ company_name: "Example Co", job_title: "Scrum Master", started_at: "2019-03-01", crm_companies: null }];
  mocks.records.crm_companies = [{ id: "company-1" }];
  const career = parsedResumeSchema.parse({ ...values, career_history: [
    { company: "example co", title: "Scrum Master", start_date: "2019-03", end_date: "", is_current: true, description: "" },
    { company: "Sample LLC", title: "Analyst", start_date: "2015", end_date: "2018-06", is_current: false, description: "Reporting" },
  ] });
  await saveResumeCareerHistory("sample-contact", career, new Set(["career-0", "career-1"]));
  expect(mocks.insert).toHaveBeenCalledOnce();
  expect(mocks.insert).toHaveBeenCalledWith("crm_career_history", [{ contact_id: "sample-contact", entry_type: "experience", company_id: "company-1", company_name: "Sample LLC", job_title: "Analyst", started_at: "2015-01-01", ended_at: "2018-06-01", is_current: false, description: "Reporting" }]);
});
it("adds a LinkedIn URL row only when the contact does not already have it", async () => {
  mocks.records.crm_contact_urls = [{ value: "https://www.linkedin.com/in/sample-person/" }];
  await saveResumeLinkedInUrl("sample-contact", "https://linkedin.com/in/sample-person");
  expect(mocks.insert).not.toHaveBeenCalled();
  await saveResumeLinkedInUrl("sample-contact", "https://www.linkedin.com/in/other-person");
  expect(mocks.insert).toHaveBeenCalledWith("crm_contact_urls", [{ contact_id: "sample-contact", value: "https://www.linkedin.com/in/other-person", category: "linkedin", is_primary: false }]);
});
