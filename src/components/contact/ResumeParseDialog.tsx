import { useEffect, useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { approvedResumeUpdates, careerDate, careerKey, parsedResumeSchema, resumeFields, type ParsedResume, type ResumeField } from "@/lib/resumeParsing";
import { readResumeCareerHistory, readResumeContactDetails, saveResumeCareerHistory, saveResumeContactDetails, saveResumeLinkedInUrl } from "@/lib/saveResumeContactDetails";
import { ResumeContactFields } from "./ResumeContactFields";
import { ResumeCareerFields } from "./ResumeCareerFields";

// "linkedin" sources have no stored file: Juliet pastes the profile URL and text instead (LinkedIn blocks automated fetching).
export interface ResumeParseSource { id: string; source: "document" | "attachment" | "linkedin"; fileName: string }
const toLinkedInUrl = (value: string) => { const trimmed = value.trim(); return /^https?:\/\//i.test(trimmed) ? trimmed.replace(/^http:/i, "https:") : `https://${trimmed}`; };
const isLinkedInUrl = (value: string) => /^https:\/\/(www\.)?linkedin\.com\/./i.test(toLinkedInUrl(value));
const labels: Record<ResumeField, string> = { first_name: "First name", last_name: "Last name", job_title: "Job title", linkedin_url: "LinkedIn", description: "Summary, skills, experience & education" };

export function ResumeParseDialog({ contactId, document, onClose, onSaved }: {
  contactId: string; document: ResumeParseSource | null; onClose: () => void; onSaved?: () => void;
}) {
  const [values, setValues] = useState<ParsedResume | null>(null);
  const [current, setCurrent] = useState<Partial<ParsedResume>>({});
  const [selected, setSelected] = useState<Set<ResumeField>>(new Set());
  const [selectedDetails, setSelectedDetails] = useState<Set<string>>(new Set());
  const [existingDetails, setExistingDetails] = useState<string[]>([]);
  const [existingCareer, setExistingCareer] = useState<string[]>([]);
  const [profileUrl, setProfileUrl] = useState("");
  const [profileText, setProfileText] = useState("");
  const [profileSubmitted, setProfileSubmitted] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!document) { setProfileUrl(""); setProfileText(""); setProfileSubmitted(false); }
  }, [document]);

  useEffect(() => {
    if (!document || (document.source === "linkedin" && !profileSubmitted)) return;
    let cancelled = false;
    setValues(null); setError(""); setParsing(true);
    const parse = async () => {
      try {
        const contact = await supabase.from("crm_contacts").select("first_name,last_name,job_title,linkedin_url,description").eq("id", contactId).single();
        if (contact.error) throw new Error("Unable to read this contact.");
        const details = await readResumeContactDetails(contactId);
        const career = await readResumeCareerHistory(contactId);
        if (cancelled) return;
        setCurrent(Object.fromEntries(Object.entries(contact.data).map(([key, value]) => [key, value || ""])));
        setExistingDetails([...details.emails.map(row => row.value), ...details.phones.map(row => row.value), ...details.addresses.map(row => [row.line1, row.city, row.state, row.zip_code, row.country].filter(Boolean).join(", "))]);
        setExistingCareer(career);
        const body = document.source === "linkedin"
          ? { contact_id: contactId, source: document.source, linkedin_url: toLinkedInUrl(profileUrl), text: profileText }
          : { contact_id: contactId, document_id: document.id, source: document.source };
        const result = await supabase.functions.invoke("parse-resume", { body });
        if (result.error) {
          let message = "Resume parsing failed. Your uploaded file is still saved.";
          if (result.error instanceof FunctionsHttpError) {
            try { const body = await result.error.context.json(); if (typeof body.error === "string") message = body.error; } catch { /* Keep safe fallback. */ }
          }
          throw new Error(message);
        }
        const parsed = parsedResumeSchema.parse(result.data);
        if (cancelled) return;
        setValues(parsed);
        // New roles are proposed for approval; contact information still needs explicit selection.
        setSelectedDetails(new Set(parsed.career_history.flatMap((role, index) => career.includes(careerKey(role.company, role.title, careerDate(role.start_date))) ? [] : [`career-${index}`])));
        // Existing values are never selected for replacement automatically.
        setSelected(new Set(resumeFields.filter(key => parsed[key].trim() && !contact.data[key])));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to parse resume.");
      } finally { if (!cancelled) setParsing(false); }
    };
    void parse();
    return () => { cancelled = true; };
  }, [document, contactId, attempt, profileSubmitted]);

  const save = async () => {
    if (!values || saving) return;
    setSaving(true); setError("");
    try {
      const updates = approvedResumeUpdates(values, selected);
      if (!Object.keys(updates).length && !selectedDetails.size) throw new Error("Select at least one non-empty field.");
      if (Object.keys(updates).length) {
        const { data, error: saveError } = await supabase.from("crm_contacts").update(updates).eq("id", contactId).select("id").single();
        if (saveError || !data) throw new Error("Unable to save these details. Your review is preserved.");
      }
      if (selectedDetails.size) {
        await saveResumeContactDetails(contactId, values, selectedDetails);
        await saveResumeCareerHistory(contactId, values, selectedDetails);
      }
      if (values.linkedin_url.trim() && (selected.has("linkedin_url") || document?.source === "linkedin")) await saveResumeLinkedInUrl(contactId, values.linkedin_url.trim());
      toast.success("Resume details saved");
      onSaved?.(); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save details."); }
    finally { setSaving(false); }
  };

  return <Dialog open={!!document} onOpenChange={open => { if (!open && !saving) onClose(); }}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Review resume details</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground break-all">{document?.fileName}</p>
      {document?.source === "linkedin" && !profileSubmitted && <div className="space-y-3">
        <div className="space-y-2"><Label htmlFor="linkedin-profile-url">LinkedIn profile URL</Label><Input id="linkedin-profile-url" value={profileUrl} placeholder="https://www.linkedin.com/in/…" onChange={event => setProfileUrl(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="linkedin-profile-text">Profile text</Label><Textarea id="linkedin-profile-text" rows={10} value={profileText} onChange={event => setProfileText(event.target.value)} /></div>
        <p className="text-xs text-muted-foreground">Open the profile, select all, copy, and paste it here. Or use LinkedIn's More › Save to PDF and upload that file under Documents with "Parse resume after upload".</p>
      </div>}
      {parsing && <div className="flex items-center gap-2 py-8 text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" />Parsing resume…</div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {values && <div className="space-y-4">{resumeFields.map(key => <div key={key} className="space-y-2">
        <div className="flex items-center gap-2"><Checkbox id={`apply-${key}`} checked={selected.has(key)} disabled={saving} onCheckedChange={checked => setSelected(previous => { const next = new Set(previous); if (checked === true) next.add(key); else next.delete(key); return next; })} /><Label htmlFor={`apply-${key}`}>{labels[key]}</Label></div>
        {current[key] && <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words max-h-24 overflow-y-auto">Current: {current[key]}</p>}
        {key === "description" ? <Textarea aria-label={labels[key]} rows={10} value={values[key]} disabled={saving} onChange={event => setValues({ ...values, [key]: event.target.value })} /> : <Input aria-label={labels[key]} value={values[key]} disabled={saving} onChange={event => setValues({ ...values, [key]: event.target.value })} />}
      </div>)}<ResumeContactFields values={values} onChange={setValues} selected={selectedDetails} existing={existingDetails} disabled={saving} onToggle={(key, checked) => setSelectedDetails(previous => { const next = new Set(previous); if (checked) next.add(key); else next.delete(key); return next; })} /><ResumeCareerFields values={values} selected={selectedDetails} existing={existingCareer} disabled={saving} onToggle={(key, checked) => setSelectedDetails(previous => { const next = new Set(previous); if (checked) next.add(key); else next.delete(key); return next; })} /></div>}
      <DialogFooter className="gap-2"><Button variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
        {document?.source === "linkedin" && !profileSubmitted && <Button onClick={() => setProfileSubmitted(true)} disabled={!isLinkedInUrl(profileUrl) || !profileText.trim()}>Parse profile</Button>}
        {error && !values && <Button onClick={() => setAttempt(value => value + 1)} disabled={parsing}>Try again</Button>}
        {values && <Button onClick={save} disabled={saving || (!selected.size && !selectedDetails.size)}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save selected details</Button>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
