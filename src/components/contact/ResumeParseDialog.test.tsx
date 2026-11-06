import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ResumeParseDialog } from "./ResumeParseDialog";

const mocks = vi.hoisted(() => ({ update: vi.fn(), invoke: vi.fn() }));
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
  mocks.invoke.mockResolvedValue({ data: parsed, error: null });
  render(<ResumeParseDialog {...props} />);
  await screen.findByDisplayValue("Scrum Master");
  expect(mocks.update).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(mocks.update).not.toHaveBeenCalled();
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