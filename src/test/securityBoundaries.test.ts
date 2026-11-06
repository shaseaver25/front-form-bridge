// These tests check the deployed migration's exact access invariants without PII fixtures.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("supabase/migrations/20261106164357_256f4272-a59e-4dd0-9fe7-82956fcec0d2.sql", "utf8");
describe("blocking finding regression safeguards", () => {
  it("restricts collaborator reads to internal staff", () => {
    expect(sql).toMatch(/ALTER POLICY "Authenticated users can view collaborators"[\s\S]*?USING \(public\.is_internal_crm_staff\(auth\.uid\(\)\)\)/);
    expect(sql).toContain('"Internal staff boundary for collaborators"');
  });
  it("restricts shared task reads to internal staff", () => {
    expect(sql).toMatch(/ALTER POLICY "Authenticated users can view tasks"[\s\S]*?USING \(public\.is_internal_crm_staff\(auth\.uid\(\)\)\)/);
    expect(sql).toContain('"Internal staff boundary for tasks"');
  });
  it("requires staff access and an exact document or attachment match for downloads", () => {
    const policy = sql.split('ALTER POLICY "Authenticated users can view contact documents"')[1]?.split('ALTER POLICY')[0];
    expect(policy).toContain('public.is_internal_crm_staff(auth.uid())');
    expect(policy).toContain('cd.file_url = objects.name');
    expect(policy).toContain('ca.storage_path = objects.name');
    expect(policy).not.toMatch(/LIKE|~~/i);
  });
  it("denies client accounts even when they also have an internal role", () => {
    expect(sql).toContain("NOT public.has_role(_user_id, 'client'::public.app_role)");
    expect(sql).toContain("_user_id = auth.uid()");
  });
});