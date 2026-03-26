import { useState } from "react";
import { useCompanyStakeholders, useSynthesisLog } from "@/hooks/useCompanyProfile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, Plus, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function DiscoveryNotesTab({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const { data: stakeholders, isLoading } = useCompanyStakeholders(companyId);
  const { data: synthesisLogs } = useSynthesisLog(companyId);
  const [showForm, setShowForm] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [diffData, setDiffData] = useState<Record<string, { current: string; proposed: string }> | null>(null);

  // Inline form state
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [searchId, setSearchId] = useState("");

  // Fetch searches for dropdown
  const { data: searches } = useQuery({
    queryKey: ["company-searches", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_jobs")
        .select("id, name")
        .eq("company_id", companyId)
        .order("name");
      return data ?? [];
    },
  });

  const addStakeholder = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("discovery_stakeholders").insert({
        company_id: companyId,
        stakeholder_name: name,
        stakeholder_role: role || null,
        interview_date: date || null,
        notes: notes || null,
        search_id: searchId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-stakeholders", companyId] });
      setShowForm(false);
      setName("");
      setRole("");
      setDate("");
      setNotes("");
      setSearchId("");
      toast.success("Stakeholder added");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSynthesize = async () => {
    setSynthesizing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("synthesize-company-profile", {
        body: { company_id: companyId },
        headers: { Authorization: `Bearer ${session.session?.access_token}` },
      });
      if (res.error) throw res.error;
      setDiffData(res.data?.diff ?? null);
    } catch (err: unknown) {
      toast.error("Synthesis failed: " + (err as Error).message);
    } finally {
      setSynthesizing(false);
    }
  };

  const applyField = async (field: string, value: string) => {
    const { data: session } = await supabase.auth.getSession();
    await supabase.functions.invoke("update-company-profile", {
      body: { company_id: companyId, updates: { [field]: value } },
      headers: { Authorization: `Bearer ${session.session?.access_token}` },
    });
    queryClient.invalidateQueries({ queryKey: ["admin-company", companyId] });
    setDiffData((prev) => {
      if (!prev) return null;
      const next = { ...prev };
      delete next[field];
      return Object.keys(next).length ? next : null;
    });
    toast.success(`Applied ${field.replace(/_/g, " ")}`);
  };

  // Group stakeholders by search
  const grouped = (stakeholders ?? []).reduce<Record<string, typeof stakeholders>>((acc, s) => {
    const searchName = (s as Record<string, unknown>).crm_jobs
      ? ((s as Record<string, unknown>).crm_jobs as { name: string })?.name
      : "Unassigned";
    const key = searchName ?? "Unassigned";
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6 py-4">
      {/* Stakeholder list grouped by search */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Discovery Stakeholders</h3>
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-1" /> Add Stakeholder
          </Button>
        </div>

        {showForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Select value={searchId} onValueChange={setSearchId}>
                <SelectTrigger><SelectValue placeholder="Link to search…" /></SelectTrigger>
                <SelectContent>
                  {searches?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea placeholder="Notes…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            <div className="flex gap-2">
              <Button size="sm" disabled={!name || addStakeholder.isPending} onClick={() => addStakeholder.mutate()}>
                {addStakeholder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-muted-foreground text-sm">No stakeholders yet</p>
        ) : (
          Object.entries(grouped).map(([searchName, items]) => (
            <div key={searchName} className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">{searchName}</h4>
              {items?.map((s) => (
                <Collapsible key={s.id}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left px-3 py-2 rounded hover:bg-muted/50 transition-colors group">
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-data-[state=open]:rotate-90" />
                    <span className="font-medium text-sm">{s.stakeholder_name}</span>
                    {s.stakeholder_role && (
                      <Badge variant="secondary" className="text-xs">{s.stakeholder_role}</Badge>
                    )}
                    {s.interview_date && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {format(new Date(s.interview_date), "MMM d, yyyy")}
                      </span>
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 pr-3 pb-2">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {s.notes || "No notes"}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Synthesis */}
      <div className="border-t pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">AI Profile Synthesis</h3>
          <Button onClick={handleSynthesize} disabled={synthesizing}>
            {synthesizing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate profile from notes
          </Button>
        </div>

        {/* Diff view */}
        {diffData && (
          <div className="space-y-4">
            {Object.entries(diffData).map(([field, { current, proposed }]) => (
              <div key={field} className="border rounded-lg p-4 space-y-2">
                <h4 className="text-sm font-medium text-foreground capitalize">
                  {field.replace(/_/g, " ")}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current</p>
                    <p className="text-sm bg-muted/30 rounded p-2 min-h-[40px]">{current || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Proposed</p>
                    <p className="text-sm bg-primary/5 rounded p-2 min-h-[40px] border border-primary/20">
                      {proposed}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => applyField(field, proposed)}>
                  Apply
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Synthesis log */}
        {synthesisLogs && synthesisLogs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Synthesis History</h4>
            {synthesisLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{format(new Date(log.synthesized_at), "MMM d, yyyy HH:mm")}</span>
                <span>•</span>
                <span>{log.source_stakeholder_count} stakeholders</span>
                <span>•</span>
                <span>{(log.fields_updated as string[])?.length ?? 0} fields</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
