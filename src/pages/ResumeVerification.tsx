import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import ContactDocuments from "@/components/ContactDocuments";
import { hasResumeParseAccess } from "../../supabase/functions/parse-resume/validation";
import { makeResumeFixture, resumeFixtureFileName, resumeFixtureMarker, resumeFixtureText, verifyResumeFixtureSaved } from "@/lib/resumeVerification";
import type { ParsedResume } from "@/lib/resumeParsing";
import { Download, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";

export default function ResumeVerification() {
  const [access, setAccess] = useState<"loading" | "signed-out" | "denied" | "allowed">("loading");
  const [userId, setUserId] = useState("");
  const [contactId, setContactId] = useState("");
  const [contact, setContact] = useState<Partial<ParsedResume> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (cancelled) return;
        if (authError || !user) { setAccess("signed-out"); return; }
        const roles = await supabase.from("user_roles").select("role").eq("user_id", user.id);
        if (cancelled) return;
        if (roles.error || !hasResumeParseAccess((roles.data ?? []).map(row => row.role))) { setAccess("denied"); return; }
        setUserId(user.id);
        // Recover only this user's explicitly marked test contact after a reload.
        const existing = await supabase.from("crm_contacts").select("id").eq("created_by", user.id).eq("source_detail", resumeFixtureMarker).order("created_at", { ascending: false }).limit(1);
        if (existing.error) throw new Error("Unable to load the sample contact.");
        if (!cancelled) { setContactId(existing.data?.[0]?.id ?? ""); setAccess("allowed"); }
      } catch { if (!cancelled) { setError("Unable to verify access. Try refreshing this page."); setAccess("denied"); } }
    };
    void check();
    return () => { cancelled = true; };
  }, []);

  const refresh = async () => {
    if (!contactId || !userId) return;
    const result = await supabase.from("crm_contacts").select("first_name,last_name,job_title,linkedin_url,description").eq("id", contactId).eq("created_by", userId).eq("source_detail", resumeFixtureMarker).single();
    if (result.error) throw new Error("Unable to read back the sample contact.");
    setContact(Object.fromEntries(Object.entries(result.data).map(([key, value]) => [key, value ?? ""])));
  };
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError("");
    try { await action(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "The sample check failed."); }
    finally { setBusy(false); }
  };
  useEffect(() => { if (contactId) void run(refresh); }, [contactId]);

  const create = async () => {
    if (access !== "allowed" || !userId || contactId) return;
    const id = crypto.randomUUID();
    const result = await supabase.from("crm_contacts").insert(makeResumeFixture(userId, id)).select("id").single();
    if (result.error || !result.data) throw new Error("Unable to create the sample contact.");
    setContactId(result.data.id);
  };
  const cleanup = async () => {
    if (!contactId || !userId) return;
    const owned = await supabase.from("crm_contacts").select("id").eq("id", contactId).eq("created_by", userId).eq("source_detail", resumeFixtureMarker).single();
    if (owned.error || !owned.data) throw new Error("This is not your sample contact; nothing was removed.");
    const documents = await supabase.from("crm_contact_documents").select("id,file_url").eq("contact_id", contactId);
    if (documents.error) throw new Error("Unable to load sample files for removal.");
    const paths = (documents.data ?? []).map(row => row.file_url);
    // Storage policies need the document rows to exist during file removal.
    if (paths.length) {
      const removed = await supabase.storage.from("contact-documents").remove(paths);
      if (removed.error) throw new Error("Unable to remove sample files. The sample contact was kept for retry.");
    }
    const removedDocuments = await supabase.from("crm_contact_documents").delete().eq("contact_id", contactId);
    if (removedDocuments.error) throw new Error("Unable to remove sample documents.");
    const removedContact = await supabase.from("crm_contacts").delete().eq("id", contactId).eq("created_by", userId).eq("source_detail", resumeFixtureMarker).select("id").single();
    if (removedContact.error || !removedContact.data) throw new Error("Unable to remove the sample contact.");
    setContactId(""); setContact(null);
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([resumeFixtureText], { type: "text/plain" }));
    const link = document.createElement("a"); link.href = url; link.download = resumeFixtureFileName; link.click(); URL.revokeObjectURL(url);
  };

  if (access === "loading") return <main className="p-8 text-muted-foreground" role="status">Checking sign-in…</main>;
  if (access === "signed-out") return <main className="p-8 space-y-4"><h1 className="text-2xl font-semibold">Resume verification</h1><Button asChild><Link to="/login">Sign in</Link></Button></main>;
  if (access === "denied") return <main className="p-8"><p role="alert">{error || "Only authorized CRM staff can run this check."}</p></main>;
  return <main className="mx-auto max-w-3xl p-6 space-y-6">
    <h1 className="text-2xl font-semibold">Resume verification</h1>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-2">
      {!contactId && <Button disabled={busy} onClick={() => void run(create)}><Plus className="mr-2 h-4 w-4" />Create sample contact</Button>}
      <Button variant="outline" onClick={download}><Download className="mr-2 h-4 w-4" />Download sample resume</Button>
      {contactId && <><Button variant="outline" disabled={busy} onClick={() => void run(refresh)}><RefreshCw className="mr-2 h-4 w-4" />Read saved details</Button><Button variant="destructive" disabled={busy} onClick={() => void run(cleanup)}><Trash2 className="mr-2 h-4 w-4" />Remove sample data</Button></>}
      {busy && <Loader2 className="h-5 w-5 animate-spin" aria-label="Working" />}
    </div>
    {contactId && <ContactDocuments contactId={contactId} onContactUpdated={() => void run(refresh)} />}
    {contact && <section className="border-t border-border pt-4 space-y-3" aria-label="Saved sample details">
      <h2 className="text-lg font-semibold">Saved sample details</h2>
      <dl className="space-y-2"><div><dt className="text-sm text-muted-foreground">Name</dt><dd>{contact.first_name} {contact.last_name}</dd></div><div><dt className="text-sm text-muted-foreground">Job title</dt><dd>{contact.job_title || "—"}</dd></div><div><dt className="text-sm text-muted-foreground">Summary</dt><dd className="whitespace-pre-wrap break-words">{contact.description || "—"}</dd></div></dl>
      {verifyResumeFixtureSaved(contact) && <p role="status" className="text-primary">Saved details verified</p>}
    </section>}
  </main>;
}