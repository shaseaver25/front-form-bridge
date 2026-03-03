import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface VoiceNote {
  id: string;
  created_at: string;
  event_name: string | null;
  transcript: string | null;
  duration_seconds: number | null;
  recording_id: string;
  user_profiles?: {
    full_name: string | null;
  };
  voice_recordings?: {
    id: string;
    audio_url: string | null;
    transcript: string | null;
    event_name: string | null;
    duration_seconds: number | null;
  };
}

interface VoiceNextStep {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
  description: string | null;
  created_at: string;
}

export function useConstituentVoiceNotes(constituentId: string) {
  const queryClient = useQueryClient();

  // Fetch voice notes (contact updates where update_type = 'note_added')
  const { data: voiceNotes = [], isLoading: loadingNotes } = useQuery({
    queryKey: ["constituent-voice-notes", constituentId],
    queryFn: async (): Promise<Array<{ id: string; created_at: string; note_content: string | null; recording_id: string }>> => {
      const { data, error } = await supabase
        .from("voice_contact_updates")
        .select("id, created_at, note_content, recording_id")
        .eq("contact_id", constituentId)
        .eq("update_type", "note_added")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Array<{ id: string; created_at: string; note_content: string | null; recording_id: string }>;
    },
    enabled: !!constituentId,
  });

  // Fetch voice next steps for this constituent
  const { data: voiceNextSteps = [], isLoading: loadingNextSteps } = useQuery({
    queryKey: ["constituent-voice-next-steps", constituentId],
    queryFn: async (): Promise<VoiceNextStep[]> => {
      const { data, error } = await supabase
        .from("voice_next_steps")
        .select("id, title, priority, status, due_date, description, created_at")
        .eq("contact_id", constituentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as VoiceNextStep[];
    },
    enabled: !!constituentId,
  });

  // Check if constituent was created via voice
  const { data: voiceOrigin } = useQuery({
    queryKey: ["constituent-voice-origin", constituentId],
    queryFn: async (): Promise<{ id: string; created_at: string; recording_id: string } | null> => {
      const { data, error } = await supabase
        .from("voice_contact_updates")
        .select("id, created_at, recording_id")
        .eq("contact_id", constituentId)
        .eq("update_type", "created")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as { id: string; created_at: string; recording_id: string } | null;
    },
    enabled: !!constituentId,
  });

  // Mark next step as complete
  const completeNextStep = useMutation({
    mutationFn: async (nextStepId: string) => {
      const { error } = await supabase
        .from("voice_next_steps")
        .update({ status: "completed" })
        .eq("id", nextStepId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task marked as complete");
      queryClient.invalidateQueries({ queryKey: ["constituent-voice-next-steps", constituentId] });
    },
    onError: () => {
      toast.error("Failed to complete task");
    },
  });

  return {
    voiceNotes,
    loadingNotes,
    voiceNextSteps,
    loadingNextSteps,
    voiceOrigin,
    completeNextStep: completeNextStep.mutate,
    isCompletingNextStep: completeNextStep.isPending,
  };
}
