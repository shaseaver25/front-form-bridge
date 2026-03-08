import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Pin, PinOff, Trash2, Plus, Loader2, StickyNote, Mail, Phone, Calendar, MessageSquare } from "lucide-react";
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
    if (!newNote.trim()) return;
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
            <Textarea
              placeholder="Write a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setNewNote(""); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={addNote} disabled={adding || !newNote.trim()}>
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
          notes.map((note) => (
            <div
              key={`${note.source}-${note.id}`}
              className={`p-3 rounded-lg border text-sm space-y-1 ${
                note.is_pinned ? "border-primary/30 bg-primary/5" : "border-border"
              }`}
            >
              {note.source === "activity" && note.activity_type && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge variant="secondary" className="text-xs gap-1">
                    {activityTypeIcon(note.activity_type)}
                    {note.activity_type}
                  </Badge>
                </div>
              )}
              <p className="whitespace-pre-line text-foreground">{note.content}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                </span>
                {note.source === "note" && (
                  <div className="flex items-center gap-1">
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
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ContactNotes;
