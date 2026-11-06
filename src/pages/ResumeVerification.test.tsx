import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import ResumeVerification from "./ResumeVerification";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn(), saved: {} as Record<string, unknown> }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: mocks.getUser }, from: mocks.from } }));
// The actual upload and dialog are covered separately; this verifies real-session
// gating, ownership-scoped setup, and persistence read-back, not AI availability.
vi.mock("@/components/ContactDocuments", () => ({ default: ({ onContactUpdated }: { onContactUpdated: () => void }) => <button onClick={() => {
  mocks.saved = { first_name: "Sample", last_name: "Resume Test", job_title: "Verified Scrum Master", description: "Skills: Scrum" };
  onContactUpdated();
}}>Fixture save</button> }));

beforeEach(() => {
  mocks.saved = { first_name: "Sample", last_name: "Resume Test", job_title: "", description: "" };
  mocks.getUser.mockResolvedValue({ data: { user: { id: "staff-user" } }, error: null });
  mocks.from.mockImplementation((table: string) => {
    const chain = {
      select: vi.fn(() => chain), eq: vi.fn(() => chain), order: vi.fn(() => chain),
      limit: vi.fn(async () => ({ data: [], error: null })),
      single: vi.fn(async () => ({ data: mocks.saved, error: null })),
      then: (resolve: (value: unknown) => void) => Promise.resolve({ data: table === "user_roles" ? [{ role: "admin" }] : [], error: null }).then(resolve),
      insert: vi.fn(() => ({ select: () => ({ single: async () => ({ data: { id: "fictional-contact" }, error: null }) }) })),
    };
    return chain;
  });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const open = () => render(<MemoryRouter><ResumeVerification /></MemoryRouter>);

it("does not query private records while signed out", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
  open();
  await screen.findByRole("link", { name: "Sign in" });
  expect(mocks.from).not.toHaveBeenCalled();
});
it("denies clients even when they also have an internal role", async () => {
  mocks.from.mockReturnValue({ select: () => ({ eq: async () => ({ data: [{ role: "admin" }, { role: "client" }], error: null }) }) });
  open();
  await screen.findByRole("alert");
  expect(mocks.from).toHaveBeenCalledTimes(1);
  expect(mocks.from).toHaveBeenCalledWith("user_roles");
});
it("creates an owner-marked fictional contact and verifies saved values by reading them back", async () => {
  open();
  fireEvent.click(await screen.findByRole("button", { name: "Create sample contact" }));
  await screen.findByText("Sample Resume Test");
  const insert = mocks.from.mock.results.map(result => result.value).find(value => value.insert?.mock.calls.length)?.insert;
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({ created_by: "staff-user", source_detail: "resume-verification-fixture", first_name: "Sample", last_name: "Resume Test" }));
  fireEvent.click(screen.getByRole("button", { name: "Fixture save" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Saved details verified"));
});