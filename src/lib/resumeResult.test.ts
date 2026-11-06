import { expect, it } from "vitest";
import { normalizeResumeResult } from "../../supabase/functions/parse-resume/result";

it("accepts a resume without optional profile details", () => {
  expect(normalizeResumeResult({ first_name: "Morgan", last_name: "Example", job_title: "Scrum Master", description: "Skills: Scrum", linkedin_url: null })).toEqual({ first_name: "Morgan", last_name: "Example", job_title: "Scrum Master", description: "Skills: Scrum", linkedin_url: "", emails: [], phones: [], addresses: [] });
});
it("normalizes absent contact details and partial addresses without inventing values", () => {
  expect(normalizeResumeResult({ job_title: "Scrum Master", emails: null, phones: [" +1 202 555 0100 "], addresses: [{ city: "Chicago", country: null }] })).toMatchObject({ emails: [], phones: ["+1 202 555 0100"], addresses: [{ street: "", city: "Chicago", state: "", postal_code: "", country: "" }] });
});
it("normalizes LinkedIn URLs commonly printed without a protocol", () => {
  expect(normalizeResumeResult({ job_title: "Scrum Master", linkedin_url: "www.linkedin.com/in/example" }).linkedin_url).toBe("https://www.linkedin.com/in/example");
});
it("discards unsafe optional links without rejecting the resume", () => {
  expect(normalizeResumeResult({ description: "Skills: Scrum", linkedin_url: "javascript:alert(1)" }).linkedin_url).toBe("");
  expect(normalizeResumeResult({ description: "Skills: Scrum", linkedin_url: "https://linkedin.com.evil.example/in/test" }).linkedin_url).toBe("");
});
it("rejects empty or malformed results instead of proposing blank changes", () => {
  expect(() => normalizeResumeResult({})).toThrow();
  expect(() => normalizeResumeResult({ description: ["Scrum"] })).toThrow();
});