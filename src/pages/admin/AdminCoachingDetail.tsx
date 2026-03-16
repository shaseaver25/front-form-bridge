import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Loader2,
  MessageSquarePlus,
  Send,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { RichTextDisplay } from "@/components/ui/rich-text-editor";

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface ProgressRow {
  chapter_id: string;
  status: string;
  completed_at: string | null;
  started_at: string;
}

interface HarvestRow {
  id: string;
  job_title: string;
  company_name: string;
  created_at: string;
  keywords: string[];
  problem_language: string[];
  responsibilities: string[];
  qualifications: string[];
  nomenclature: string[];
}

interface GapRow {
  id: string;
  current_term: string;
  target_term: string;
  status: string;
}

interface CoachNote {
  id: string;
  chapter_id: string;
  note_text: string;
  created_at: string;
}

interface ReflectionRow {
  id: string;
  chapter_id: string;
  question_key: string;
  response_html: string;
  updated_at: string;
}

const CHAPTER_LABELS: Record<string, string> = {
  intro: "Introduction",
  ch1: "Ch 1 — The Harvesting Framework",
  ch2: "Ch 2 — The Three Strict Criteria",
  ch3: "Ch 3 — The Brand Audit",
  ch4: "Ch 4 — The Nomenclature Gap",
  ch5: "Ch 5 — The Rewrite",
  ch6: "Ch 6 — The Action Plan",
};

const CATEGORY_META = [
  { key: "keywords" as const, label: "Keywords", color: "#C8A96E" },
  { key: "problem_language" as const, label: "Problem Language", color: "#6366F1" },
  { key: "responsibilities" as const, label: "Responsibilities", color: "#0D9488" },
  { key: "qualifications" as const, label: "Qualifications", color: "#2563EB" },
  { key: "nomenclature" as const, label: "Nomenclature", color: "#9333EA" },
];

export default function AdminCoachingDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [harvests, setHarvests] = useState<HarvestRow[]>([]);
  const [gaps, setGaps] = useState<GapRow[]>([]);
  const [notes, setNotes] = useState<CoachNote[]>([]);
  const [reflections, setReflections] = useState<ReflectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedHarvest, setExpandedHarvest] = useState<string | null>(null);
  const [noteChapter, setNoteChapter] = useState("");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [prepSummary, setPrepSummary] = useState<string | null>(null);
  const [prepping, setPrepping] = useState(false);

  useEffect(() => {
    if (userId) loadDetail();
  }, [userId]);

  async function loadDetail() {
    if (!userId) return;
    setLoading(true);
    try {
      const [profileRes, progRes, harvestRes, gapRes, noteRes, reflRes] = await Promise.all([
        supabase.from("user_profiles").select("first_name, last_name, email").eq("id", userId).single(),
        supabase.from("rebrand_progress").select("chapter_id, status, completed_at, started_at").eq("user_id", userId).order("started_at"),
        supabase.from("rebrand_harvests").select("id, job_title, company_name, created_at, keywords, problem_language, responsibilities, qualifications, nomenclature").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("rebrand_gap_analysis").select("id, current_term, target_term, status").eq("user_id", userId),
        supabase.from("rebrand_coach_notes").select("id, chapter_id, note_text, created_at").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("rebrand_reflections").select("id, chapter_id, question_key, response_html, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }),
      ]);

      setProfile(profileRes.data);
      setProgress((progRes.data || []) as ProgressRow[]);
      setHarvests(
        (harvestRes.data || []).map((h: any) => ({
          ...h,
          keywords: Array.isArray(h.keywords) ? h.keywords : [],
          problem_language: Array.isArray(h.problem_language) ? h.problem_language : [],
          responsibilities: Array.isArray(h.responsibilities) ? h.responsibilities : [],
          qualifications: Array.isArray(h.qualifications) ? h.qualifications : [],
          nomenclature: Array.isArray(h.nomenclature) ? h.nomenclature : [],
        }))
      );
      setGaps((gapRes.data || []) as GapRow[]);
      setNotes((noteRes.data || []) as CoachNote[]);
    } catch (e) {
      console.error("Error loading client detail:", e);
    } finally {
      setLoading(false);
    }
  }

  async function saveNote() {
    if (!noteChapter || !noteText.trim() || !userId) return;
    setSavingNote(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("rebrand_coach_notes").insert({
        user_id: userId,
        coach_id: user.id,
        chapter_id: noteChapter,
        note_text: noteText.trim(),
      });
      if (error) throw error;

      toast.success("Coach note saved");
      setNoteText("");
      setNoteChapter("");
      loadDetail();
    } catch (e: any) {
      toast.error(e.message || "Failed to save note");
    } finally {
      setSavingNote(false);
    }
  }

  function prepForSession() {
    setPrepping(true);
    setPrepSummary(null);
    try {
      const completedChapters = progress.filter((p) => p.status === "complete");
      const pendingChapters = Object.keys(CHAPTER_LABELS).filter(
        (ch) => !completedChapters.find((c) => c.chapter_id === ch)
      );
      const unmappedGaps = gaps.filter((g) => g.status === "unmapped").length;

      const lines: string[] = [];
      lines.push(`## Session Prep: ${profile?.first_name} ${profile?.last_name}\n`);
      lines.push(`### Completed (${completedChapters.length} of 7)`);
      completedChapters.forEach((c) => {
        lines.push(
          `- ✅ ${CHAPTER_LABELS[c.chapter_id] || c.chapter_id}${c.completed_at ? ` — ${format(new Date(c.completed_at), "MMM d, yyyy")}` : ""}`
        );
      });

      lines.push(`\n### Pending (${pendingChapters.length})`);
      pendingChapters.forEach((ch) => {
        lines.push(`- ⬜ ${CHAPTER_LABELS[ch] || ch}`);
      });

      lines.push(`\n### Harvests Saved: ${harvests.length}`);
      harvests.slice(0, 3).forEach((h) => {
        lines.push(`- ${h.job_title} at ${h.company_name} (${format(new Date(h.created_at), "MMM d")})`);
      });

      if (unmappedGaps > 0) {
        lines.push(`\n### ⚠️ Flags`);
        lines.push(`- Client has **${unmappedGaps} unmapped terms** in Gap Mapper`);
      }

      if (notes.length > 0) {
        lines.push(`\n### Recent Coach Notes`);
        notes.slice(0, 3).forEach((n) => {
          lines.push(
            `- ${CHAPTER_LABELS[n.chapter_id] || n.chapter_id}: "${n.note_text.slice(0, 80)}${n.note_text.length > 80 ? "…" : ""}"`
          );
        });
      }

      setPrepSummary(lines.join("\n"));
    } finally {
      setPrepping(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/coaching")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {profile?.first_name} {profile?.last_name}
            </h1>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
          <Button onClick={prepForSession} disabled={prepping}>
            {prepping ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Prep for Session
          </Button>
        </div>

        {/* Prep Summary */}
        {prepSummary && (
          <Card className="border-l-4" style={{ borderLeftColor: "#C8A96E" }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Session Prep Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                {prepSummary}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Chapter Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chapter Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(CHAPTER_LABELS).map(([id, label]) => {
                const p = progress.find((pr) => pr.chapter_id === id);
                const isComplete = p?.status === "complete";
                return (
                  <div key={id} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: isComplete ? "#C8A96E" : "hsl(var(--muted))" }}
                    />
                    <span className={`text-sm flex-1 ${isComplete ? "font-medium" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isComplete && p?.completed_at
                        ? format(new Date(p.completed_at), "MMM d, yyyy")
                        : isComplete ? "Completed" : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Harvests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved Harvests ({harvests.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {harvests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No harvests yet.</p>
            ) : (
              harvests.map((h) => (
                <div key={h.id} className="border rounded-lg">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                    onClick={() => setExpandedHarvest(expandedHarvest === h.id ? null : h.id)}
                  >
                    <div>
                      <p className="font-medium text-sm">{h.job_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {h.company_name} • {format(new Date(h.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    {expandedHarvest === h.id ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedHarvest === h.id && (
                    <div className="px-4 pb-4 space-y-3">
                      {CATEGORY_META.map(({ key, label, color }) => (
                        <div key={key}>
                          <p className="text-xs font-semibold mb-1" style={{ color }}>{label}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(h[key] as string[]).map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-full text-xs"
                                style={{ backgroundColor: `${color}12`, color, border: `1px solid ${color}30` }}
                              >
                                {tag}
                              </span>
                            ))}
                            {(h[key] as string[]).length === 0 && (
                              <span className="text-xs text-muted-foreground italic">None</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Gap Analysis */}
        {gaps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gap Analysis ({gaps.length} entries)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium text-muted-foreground">Current Term</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Target Term</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gaps.map((g) => (
                      <tr key={g.id} className="border-b last:border-0">
                        <td className="py-2">{g.current_term}</td>
                        <td className="py-2">{g.target_term}</td>
                        <td className="py-2">
                          <Badge variant={g.status === "mapped" ? "default" : "secondary"}>{g.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Coach Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquarePlus className="h-4 w-4" /> Coach Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <select
                value={noteChapter}
                onChange={(e) => setNoteChapter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">Select chapter…</option>
                {Object.entries(CHAPTER_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a coaching note for this client…"
                rows={3}
              />
              <Button
                size="sm"
                onClick={saveNote}
                disabled={!noteChapter || !noteText.trim() || savingNote}
              >
                {savingNote ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
                Save Note
              </Button>
            </div>

            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No coach notes yet.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((n) => (
                  <div key={n.id} className="border-l-2 pl-3 py-1" style={{ borderColor: "#C8A96E" }}>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">
                      {CHAPTER_LABELS[n.chapter_id] || n.chapter_id} •{" "}
                      {format(new Date(n.created_at), "MMM d, yyyy")}
                    </p>
                    <p className="text-sm">{n.note_text}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
