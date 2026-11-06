import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import ContactResumes from "./ContactResumes";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: (table: string) => {
    const result = { data: table === "crm_contact_documents" ? [{ id: "saved-document", file_name: "saved.pdf", file_url: "contact/saved.pdf", created_at: null }] : [{ id: "saved-attachment", file_name: "synced.docx", storage_path: "contact/synced.docx", created_at: null }], error: null };
    return { select: () => ({ eq: () => ({ not: async () => result, or: () => ({ not: async () => result }) }) }) };
  },
} }));
vi.mock("@/components/contact/ResumeParseDialog", () => ({ ResumeParseDialog: ({ document }: { document: { id: string; source: string } | null }) => document ? <output aria-label="Parse target">{document.source}:{document.id}</output> : null }));
afterEach(cleanup);
it("parses existing stored document resumes without a new upload", async () => {
  render(<ContactResumes contactId="contact" />);
  const buttons = await screen.findAllByRole("button", { name: "Parse" });
  fireEvent.click(buttons[0]);
  expect(screen.getByLabelText("Parse target").textContent).toBe("document:saved-document");
});
it("parses existing attachment resumes with their original record ID", async () => {
  render(<ContactResumes contactId="contact" />);
  const buttons = await screen.findAllByRole("button", { name: "Parse" });
  fireEvent.click(buttons[1]);
  expect(screen.getByLabelText("Parse target").textContent).toBe("attachment:saved-attachment");
});