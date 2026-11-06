import { describe, expect, it } from "vitest";
import { approvedResumeUpdates, canParseResume, parsedResumeSchema } from "./resumeParsing";

const values = { first_name: "Morgan", last_name: "Example", job_title: "Scrum Master", linkedin_url: "", description: "Skills: Scrum\nExperience: Scrum Master, 2020–2024\nEducation: BSc" };
describe("resume review", () => {
  it("saves only explicitly approved fields", () => {
    expect(approvedResumeUpdates(values, new Set(["job_title"]))).toEqual({ job_title: "Scrum Master" });
  });
  it("does not clear existing values with empty extracted details", () => {
    expect(approvedResumeUpdates(values, new Set(["linkedin_url"]))).toEqual({});
  });
  it("does not save anything when the review is unapproved", () => {
    expect(approvedResumeUpdates(values, new Set())).toEqual({});
  });
  it("allows PDF DOCX and text, not legacy DOC or spreadsheets", () => {
    expect(["resume.PDF", "resume.docx", "resume.txt"].map(canParseResume)).toEqual([true, true, true]);
    expect(["resume.doc", "resume.xlsx"].map(canParseResume)).toEqual([false, false]);
  });
  it("rejects unsafe extracted profile links", () => {
    expect(parsedResumeSchema.safeParse({ ...values, linkedin_url: "javascript:alert(1)" }).success).toBe(false);
  });
});