import type { ParsedResume } from "./resumeParsing";

export const resumeFixtureMarker = "resume-verification-fixture";
export const resumeFixtureFileName = "fictional-resume.txt";
export const resumeFixtureText = `Alex Fictional
Scrum Master

Professional summary: Scrum Master with experience guiding software delivery teams.
Skills: Scrum, Agile delivery, sprint planning, facilitation, Jira.
Experience: Scrum Master at Example Software, 2022–2026. Facilitated sprint planning,
daily standups and retrospectives, and removed delivery impediments.
Education: Bachelor of Science in Computer Science, Example University, 2020.
No LinkedIn profile provided.
`;

export function makeResumeFixture(userId: string, id: string) {
  return { id, first_name: "Sample", last_name: "Resume Test", created_by: userId, source_detail: resumeFixtureMarker };
}

// Read-back verifies the edited value, not the model's nondeterministic wording.
export function verifyResumeFixtureSaved(contact: Partial<ParsedResume>) {
  return contact.first_name === "Sample" && contact.last_name === "Resume Test"
    && contact.job_title === "Verified Scrum Master"
    && typeof contact.description === "string" && contact.description.trim().length > 0;
}