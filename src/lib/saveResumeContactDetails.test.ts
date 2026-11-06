import { beforeEach, expect, it, vi } from "vitest";
import { parsedResumeSchema } from "./resumeParsing";
import { saveResumeContactDetails } from "./saveResumeContactDetails";
const mocks = vi.hoisted(() => ({ insert: vi.fn(), records: {} as Record<string, unknown[]>, failPhone: false }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: (table: string) => ({
  select: () => ({ eq: async () => ({ data: mocks.records[table] ?? [], error: null }) }),
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