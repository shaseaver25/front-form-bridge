import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface ChapterReflectionProps {
  chapterId: string;
  questionKey: string;
  label: string;
}

export function ChapterReflection({ chapterId, questionKey, label }: ChapterReflectionProps) {
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    loadReflection();
  }, [chapterId, questionKey]);

  async function loadReflection() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("rebrand_reflections")
        .select("response_html")
        .eq("user_id", user.id)
        .eq("chapter_id", chapterId)
        .eq("question_key", questionKey)
        .maybeSingle();

      if (data) {
        setContent(data.response_html);
        setSavedContent(data.response_html);
      }
    } catch (e) {
      console.error("Error loading reflection:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("rebrand_reflections")
        .upsert(
          {
            user_id: user.id,
            chapter_id: chapterId,
            question_key: questionKey,
            response_html: content,
          },
          { onConflict: "user_id,chapter_id,question_key" }
        );

      if (error) throw error;

      setSavedContent(content);
      setJustSaved(true);
      toast.success("Reflection saved");
      setTimeout(() => setJustSaved(false), 2000);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [content, chapterId, questionKey]);

  const hasChanges = content !== savedContent;

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm" style={{ color: "#9CA3AF" }}>
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="mt-3 mb-2 space-y-2">
      <p className="text-xs font-medium" style={{ color: "#6B7280", fontFamily: "'Lato', sans-serif" }}>
        {label}
      </p>
      <RichTextEditor
        content={content}
        onChange={setContent}
        placeholder="Write your thoughts here…"
        minHeight="100px"
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="text-xs"
          style={{
            backgroundColor: hasChanges ? "#C8A96E" : undefined,
            borderColor: hasChanges ? "#C8A96E" : undefined,
          }}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : justSaved ? (
            <Check className="h-3.5 w-3.5 mr-1" />
          ) : (
            <Save className="h-3.5 w-3.5 mr-1" />
          )}
          {justSaved ? "Saved" : "Save"}
        </Button>
        {hasChanges && (
          <span className="text-xs" style={{ color: "#C8A96E" }}>Unsaved changes</span>
        )}
      </div>
    </div>
  );
}
