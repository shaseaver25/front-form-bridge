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
import { approvedResumeUpdates, parsedResumeSchema, resumeFields, type ParsedResume, type ResumeField } from "@/lib/resumeParsing";

export interface ResumeParseSource { id: string; source: "document" | "attachment"; fileName: string }
const labels: Record<ResumeField, string> = { first_name: "First name", last_name: "Last name", job_title: "Job title", linkedin_url: "LinkedIn", description: "Summary, skills, experience & education" };

export function ResumeParseDialog({ contactId, document, onClose, onSaved }: {
  contactId: string; document: ResumeParseSource | null; onClose: () => void; onSaved?: () => void;
}) {
  const [values, setValues] = useState<ParsedResume | null>(null);
  const [current, setCurrent] = useState<Partial<ParsedResume>>({});
  const [selected, setSelected] = useState<Set<ResumeField>>(new Set());
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!document) return;
    let cancelled = false;
    setValues(null); setError(""); setParsing(true);
    const parse = async () => {
      try {
        const contact = await supabase.from("crm_contacts").select("first_name,last_name,job_title,linkedin_url,description").eq("id", contactId).single();
        if (contact.error) throw new Error("Unable to read this contact.");
        if (cancelled) return;
        setCurrent(Object.fromEntries(Object.entries(contact.data).map(([key, value]) => [key, value || ""])));
        const result = await supabase.functions.invoke("parse-resume", { body: { contact_id: contactId, document_id: document.id, source: document.source } });
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
        // Existing values are never selected for replacement automatically.
        setSelected(new Set(resumeFields.filter(key => parsed[key].trim() && !contact.data[key])));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to parse resume.");
      } finally { if (!cancelled) setParsing(false); }
    };
    void parse();
    return () => { cancelled = true; };
  }, [document, contactId, attempt]);

  const save = async () => {
    if (!values || saving) return;
    setSaving(true); setError("");
    try {
      const updates = approvedResumeUpdates(values, selected);
      if (!Object.keys(updates).length) throw new Error("Select at least one non-empty field.");
      const { data, error: saveError } = await supabase.from("crm_contacts").update(updates).eq("id", contactId).select("id").single();
      if (saveError || !data) throw new Error("Unable to save these details. Your review is preserved.");
      toast.success("Resume details saved");
      onSaved?.(); onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save details."); }
    finally { setSaving(false); }
  };

  return <Dialog open={!!document} onOpenChange={open => { if (!open && !saving) onClose(); }}>
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Review resume details</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground break-all">{document?.fileName}</p>
      {parsing && <div className="flex items-center gap-2 py-8 text-muted-foreground" role="status"><Loader2 className="h-5 w-5 animate-spin" />Parsing resume…</div>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {values && <div className="space-y-4">{resumeFields.map(key => <div key={key} className="space-y-2">
        <div className="flex items-center gap-2"><Checkbox id={`apply-${key}`} checked={selected.has(key)} disabled={saving} onCheckedChange={checked => setSelected(previous => { const next = new Set(previous); if (checked === true) next.add(key); else next.delete(key); return next; })} /><Label htmlFor={`apply-${key}`}>{labels[key]}</Label></div>
        {current[key] && <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words max-h-24 overflow-y-auto">Current: {current[key]}</p>}
        {key === "description" ? <Textarea aria-label={labels[key]} rows={10} value={values[key]} disabled={saving} onChange={event => setValues({ ...values, [key]: event.target.value })} /> : <Input aria-label={labels[key]} value={values[key]} disabled={saving} onChange={event => setValues({ ...values, [key]: event.target.value })} />}
      </div>)}</div>}
      <DialogFooter className="gap-2"><Button variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
        {error && !values && <Button onClick={() => setAttempt(value => value + 1)} disabled={parsing}>Try again</Button>}
        {values && <Button onClick={save} disabled={saving || !selected.size}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save selected details</Button>}
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}