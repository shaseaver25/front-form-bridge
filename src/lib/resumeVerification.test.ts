import { describe, expect, it } from "vitest";
import { makeResumeFixture, resumeFixtureMarker, resumeFixtureText, verifyResumeFixtureSaved } from "./resumeVerification";

describe("resume verification fixture", () => {
  it("marks a fictional contact with its owner instead of editing an existing contact", () => {
    expect(makeResumeFixture("test-user", "test-contact")).toEqual({ id: "test-contact", created_by: "test-user", source_detail: resumeFixtureMarker, first_name: "Sample", last_name: "Resume Test" });
  });
  it("requires persisted edited details and preserved existing names", () => {
    const saved = { first_name: "Sample", last_name: "Resume Test", job_title: "Verified Scrum Master", description: "Skills: Scrum" };
    expect(verifyResumeFixtureSaved(saved)).toBe(true);
    expect(verifyResumeFixtureSaved({ ...saved, job_title: "Scrum Master" })).toBe(false);
    expect(verifyResumeFixtureSaved({ ...saved, first_name: "Alex" })).toBe(false);
    expect(verifyResumeFixtureSaved({ ...saved, description: "" })).toBe(false);
  });
  it("supplies a fictional resume with no profile link", () => {
    expect(resumeFixtureText).toContain("Alex Fictional");
    expect(resumeFixtureText).toContain("Scrum Master");
    expect(resumeFixtureText).toContain("No LinkedIn profile provided.");
  });
});