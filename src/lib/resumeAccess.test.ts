import { expect, it } from "vitest";
import { hasResumeParseAccess } from "../../supabase/functions/parse-resume/validation";

it("denies client portal users even with another role", () => {
  expect(hasResumeParseAccess(["client"])).toBe(false);
  expect(hasResumeParseAccess(["client", "admin"])).toBe(false);
});
it("requires an authorized internal role", () => {
  expect(hasResumeParseAccess([])).toBe(false);
  expect(hasResumeParseAccess(["user"])).toBe(false);
  expect(hasResumeParseAccess(["viewer"])).toBe(false);
  expect(hasResumeParseAccess(["admin"])).toBe(true);
  expect(hasResumeParseAccess(["staff"])).toBe(true);
});