import { expect, it } from "vitest";
import { approvedResumeContactDetails, approvedResumeUpdates, parsedResumeSchema } from "./resumeParsing";
const values = parsedResumeSchema.parse({ first_name: "Alex", last_name: "Example", job_title: "Scrum Master", linkedin_url: "", description: "Skills: Scrum", emails: ["alex@example.com", "new@example.com"], phones: ["+1 (202) 555-0100", "+44 20 7946 0958"], addresses: [{ street: "1 Sample Street", city: "Chicago", state: "IL", postal_code: "60601", country: "US" }] });
const empty = { emails: [], phones: [], addresses: [] };
it("does not save unapproved contact details", () => {
  expect(approvedResumeContactDetails(values, new Set(), empty)).toEqual(empty);
});
it("adds only reviewed email phone and address records while preserving existing equivalents", () => {
  const result = approvedResumeContactDetails(values, new Set(["email-0", "email-1", "phone-0", "phone-1", "address-0"]), { emails: ["ALEX@example.com"], phones: ["+1 2025550100"], addresses: values.addresses });
  expect(result).toEqual({ emails: ["new@example.com"], phones: ["+44 20 7946 0958"], addresses: [] });
});
it("keeps contact information out of scalar profile updates", () => {
  expect(approvedResumeUpdates(values, new Set(["job_title"]))).toEqual({ job_title: "Scrum Master" });
});
it("rejects malformed email and phone values before saving", () => {
  expect(parsedResumeSchema.safeParse({ ...values, emails: ["not-email"] }).success).toBe(false);
  expect(parsedResumeSchema.safeParse({ ...values, phones: ["not a phone"] }).success).toBe(false);
});