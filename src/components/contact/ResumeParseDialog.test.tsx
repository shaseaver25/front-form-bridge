import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ResumeParseDialog } from "./ResumeParseDialog";

const mocks = vi.hoisted(() => ({ update: vi.fn(), invoke: vi.fn(), saveDetails: vi.fn() }));
vi.mock("@/lib/saveResumeContactDetails", () => ({ readResumeContactDetails: async () => ({ emails: [{ value: "existing@example.com" }], phones: [], addresses: [] }), saveResumeContactDetails: mocks.saveDetails }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  functions: { invoke: mocks.invoke },
  from: () => ({
    select: () => ({ eq: () => ({ single: async () => ({ data: { first_name: "Existing", last_name: "Contact", job_title: "", linkedin_url: "", description: "" }, error: null }) }) }),
    update: (values: unknown) => { mocks.update(values); return { eq: () => ({ select: () => ({ single: async () => ({ data: { id: "contact" }, error: null }) }) }) }; },
  }),
} }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
const parsed = { first_name: "Morgan", last_name: "Example", job_title: "Scrum Master", linkedin_url: "", description: "Skills: Scrum. Experience: Agile delivery. Education: BSc." };
const props = { contactId: "contact", document: { id: "resume", source: "document" as const, fileName: "resume.pdf" }, onClose: vi.fn() };
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("keeps extraction transient on cancel", async () => {
  mocks.invoke.mockResolvedValue({ data: { ...parsed, emails: ["sample@example.com"], phones: ["+1 202 555 0100"], addresses: [{ street: "123 Example Street", city: "Chicago", state: "IL", postal_code: "60601", country: "US" }] }, error: null });
  render(<ResumeParseDialog {...props} />);
  await screen.findByDisplayValue("Scrum Master");
  expect(mocks.invoke).toHaveBeenCalledWith("parse-resume", { body: { contact_id: "contact", document_id: "resume", source: "document" } });
  expect(screen.getByRole("textbox", { name: "Email 1" })).toHaveValue("sample@example.com");
  expect(screen.getByRole("textbox", { name: "Phone 1" })).toHaveValue("+1 202 555 0100");
  expect(screen.getByRole("textbox", { name: "Street" })).toHaveValue("123 Example Street");
  for (const name of ["Email 1", "Phone 1", "Mailing address 1"]) expect(screen.getByRole("checkbox", { name })).not.toBeChecked();
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.saveDetails).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.saveDetails).not.toHaveBeenCalled();
});
it("only saves explicitly approved contact information and allows editing it", async () => {
  mocks.invoke.mockResolvedValue({ data: { ...parsed, emails: ["alex@example.com"], phones: ["+1 202 555 0100"], addresses: [] }, error: null });
  render(<ResumeParseDialog {...props} />);
  await screen.findByRole("textbox", { name: "Email 1" });
  expect(screen.getByRole("checkbox", { name: "Email 1" })).not.toBeChecked();
  fireEvent.change(screen.getByRole("textbox", { name: "Email 1" }), { target: { value: "reviewed@example.com" } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Email 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Save selected details" }));
  await waitFor(() => expect(mocks.saveDetails).toHaveBeenCalledWith("contact", expect.objectContaining({ emails: ["reviewed@example.com"] }), new Set(["email-0"])));
});
it("saves reviewed missing details without overwriting existing names", async () => {
  mocks.invoke.mockResolvedValue({ data: parsed, error: null });
  const onSaved = vi.fn();
  render(<ResumeParseDialog {...props} onSaved={onSaved} />);
  await screen.findByDisplayValue("Scrum Master");
  fireEvent.change(screen.getByRole("textbox", { name: "Job title" }), { target: { value: "Senior Scrum Master" } });
  fireEvent.click(screen.getByRole("button", { name: "Save selected details" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  expect(mocks.update).toHaveBeenCalledWith({ job_title: "Senior Scrum Master", description: parsed.description });
});