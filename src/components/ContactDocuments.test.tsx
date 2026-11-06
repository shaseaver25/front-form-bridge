import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import ContactDocuments from "./ContactDocuments";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({ select: () => ({ eq: () => ({ is: () => ({ order: async () => ({ data: [{ id: "existing-upload", file_name: "resume.docx", file_url: "contact/resume.docx", created_at: "2026-11-06T12:00:00Z" }], error: null }) }) }) }) }),
} }));
vi.mock("@/components/contact/ResumeParseDialog", () => ({ ResumeParseDialog: ({ document }: { document: { id: string; source: string } | null }) => document ? <output aria-label="Parse target">{document.source}:{document.id}</output> : null }));
afterEach(cleanup);

it("parses a previously uploaded document without uploading it again", async () => {
  render(<ContactDocuments contactId="contact" />);
  fireEvent.click(await screen.findByRole("button", { name: "Parse resume" }));
  expect(screen.getByLabelText("Parse target").textContent).toBe("document:existing-upload");
});