import { expect, it } from "vitest";
import { normalizeResumeResult } from "../../supabase/functions/parse-resume/result";

it("accepts a resume without optional profile details", () => {
  expect(normalizeResumeResult({ first_name: "Morgan", last_name: "Example", job_title: "Scrum Master", description: "Skills: Scrum", linkedin_url: null })).toEqual({ first_name: "Morgan", last_name: "Example", job_title: "Scrum Master", description: "Skills: Scrum", linkedin_url: "", emails: [], phones: [], addresses: [], career_history: [] });
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
it("keeps stated career history and drops unusable dates instead of guessing", () => {
  expect(normalizeResumeResult({ job_title: "Scrum Master", career_history: [
    { company: " Example Co ", title: "Scrum Master", start_date: "2019-03", end_date: "", is_current: true, description: null },
    { company: "Sample LLC", title: "Analyst", start_date: "Spring 2015", end_date: "2018", is_current: "yes", description: "Reporting" },
    { company: "", title: "", start_date: "2010", end_date: "2011", is_current: false, description: "" },
  ] }).career_history).toEqual([
    { company: "Example Co", title: "Scrum Master", start_date: "2019-03", end_date: "", is_current: true, description: "" },
    { company: "Sample LLC", title: "Analyst", start_date: "", end_date: "2018", is_current: false, description: "Reporting" },
  ]);
});
