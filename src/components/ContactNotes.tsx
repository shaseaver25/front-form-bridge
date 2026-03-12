import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RichTextEditor, { RichTextDisplay } from "@/components/ui/rich-text-editor";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Pin, PinOff, Trash2, Plus, Loader2, StickyNote, Mail, Phone, Calendar, MessageSquare, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ContactNotesProps {
  contactId: string;
}

interface Note {
  id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  source?: "note" | "activity";
  activity_type?: string;
  subject?: string;
}

const activityTypeIcon = (type: string) => {
  switch (type) {
    case "email": return <Mail className="w-3 h-3" />;
    case "call": return <Phone className="w-3 h-3" />;
    case "meeting": return <Calendar className="w-3 h-3" />;
    default: return <MessageSquare className="w-3 h-3" />;
  }
};

const ContactNotes = ({ contactId }: ContactNotesProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const toggleExpand = (noteKey: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(noteKey)) next.delete(noteKey);
      else next.add(noteKey);
      return next;
    });
  };

  const fetchNotes = async () => {
    setLoading(true);

    // Fetch from both crm_contact_notes and crm_activities in parallel
    const [notesRes, activitiesRes] = await Promise.all([
      supabase
        .from("crm_contact_notes")
        .select("*")
        .eq("contact_id", contactId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("crm_activities" as any)
        .select("id, subject, body, activity_type, is_pinned, created_at, scheduled_at")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const manualNotes: Note[] = (notesRes.data || []).map((n: any) => ({
      ...n,
      source: "note" as const,
    }));

    const activityNotes: Note[] = ((activitiesRes.data as any[]) || [])
      .filter((a: any) => a.body || a.subject)
      .map((a: any) => ({
        id: a.id,
        content: [a.subject, a.body].filter(Boolean).join("\n\n"),
        is_pinned: a.is_pinned || false,
        created_at: a.scheduled_at || a.created_at,
        updated_at: a.created_at,
        source: "activity" as const,
        activity_type: a.activity_type,
        subject: a.subject,
      }));

    // Merge: pinned first, then by date
    const all = [...manualNotes, ...activityNotes].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setNotes(all);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [contactId]);

  const addNote = async () => {
    const stripped = newNote.replace(/<[^>]*>/g, "").trim();
    if (!stripped) return;
    setAdding(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("crm_contact_notes").insert({
      contact_id: contactId,
      content: newNote.trim(),
      created_by: user?.id,
    });

    if (error) {
      toast.error("Failed to add note");
    } else {
      toast.success("Note added");
      setNewNote("");
      setShowForm(false);
      fetchNotes();
    }
    setAdding(false);
  };

  const togglePin = async (note: Note) => {
    if (note.source === "activity") return; // Can't pin activities from here
    const { error } = await supabase
      .from("crm_contact_notes")
      .update({ is_pinned: !note.is_pinned })
      .eq("id", note.id);

    if (!error) fetchNotes();
  };

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase.from("crm_contact_notes").delete().eq("id", noteId);
    if (error) {
      toast.error("Failed to delete note");
    } else {
      fetchNotes();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <StickyNote className="w-5 h-5" />
            Notes & Activity
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="space-y-2 border border-border rounded-lg p-3">
            <RichTextEditor
              content={newNote}
              onChange={setNewNote}
              placeholder="Write a note..."
              minHeight="80px"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setNewNote(""); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={addNote} disabled={adding || !newNote.replace(/<[^>]*>/g, "").trim()}>
                {adding && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes or activity yet</p>
        ) : (
          notes.map((note) => {
            const noteKey = `${note.source}-${note.id}`;
            const isExpanded = expandedNotes.has(noteKey);

            return (
              <div
                key={noteKey}
                className={`rounded-lg border text-sm transition-colors ${
                  note.is_pinned ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/20"
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  className="w-full text-left p-3 space-y-1 cursor-pointer"
                  onClick={() => toggleExpand(noteKey)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpand(noteKey); }}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded
                      ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    }
                    {note.source === "activity" && note.activity_type && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        {activityTypeIcon(note.activity_type)}
                        {note.activity_type}
                      </Badge>
                    )}
                    {note.is_pinned && (
                      <Pin className="w-3 h-3 text-primary shrink-0" />
                    )}
                  </div>
                  {isExpanded ? (
                    <RichTextDisplay content={note.content} className="text-foreground" />
                  ) : (
                    <p className="whitespace-pre-line text-foreground line-clamp-1">
                      {note.content.replace(/<[^>]*>/g, "")}
                    </p>
                  )}
                  <span className="text-xs text-muted-foreground block pt-1">
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                  </span>
                </div>
                {note.source === "note" && (
                  <div className="flex items-center justify-end gap-1 px-3 pb-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => togglePin(note)}
                      title={note.is_pinned ? "Unpin" : "Pin"}
                    >
                      {note.is_pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default ContactNotes;
