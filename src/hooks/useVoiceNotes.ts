import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, endOfWeek } from "date-fns";

export interface VoiceRecordingWithStats {
  id: string;
  created_at: string;
  event_name: string | null;
  duration_seconds: number | null;
  transcript: string | null;
  processing_status: string;
  processed_data: Record<string, unknown> | null;
  contacts_created: number;
  contacts_updated: number;
  next_steps_count: number;
}

interface VoiceNotesStats {
  recordingsThisWeek: number;
  contactsCreated: number;
  pendingNextSteps: number;
  notesAddedThisWeek: number;
}

interface VoiceNotesFilter {
  status?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export function useVoiceNotes(filter?: VoiceNotesFilter) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });

  // Fetch recordings with counts
  const recordingsQuery = useQuery({
    queryKey: ["voice-recordings", filter],
    queryFn: async () => {
      let query = supabase
        .from("voice_recordings")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter?.status && filter.status !== "all") {
        query = query.eq("processing_status", filter.status as "completed" | "processing" | "failed" | "recording" | "transcribing");
      }

      if (filter?.search) {
        query = query.ilike("transcript", `%${filter.search}%`);
      }

      if (filter?.dateFrom) {
        query = query.gte("created_at", filter.dateFrom.toISOString());
      }

      if (filter?.dateTo) {
        query = query.lte("created_at", filter.dateTo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get contact updates counts for each recording
      const recordingsWithStats: VoiceRecordingWithStats[] = await Promise.all(
        (data || []).map(async (recording) => {
          const { data: contactUpdates } = await supabase
            .from("voice_contact_updates")
            .select("update_type")
            .eq("recording_id", recording.id);

          const { data: nextSteps } = await supabase
            .from("voice_next_steps")
            .select("id")
            .eq("recording_id", recording.id);

          const created = contactUpdates?.filter(u => u.update_type === "created").length || 0;
          const updated = contactUpdates?.filter(u => u.update_type === "updated" || u.update_type === "note_added").length || 0;

          return {
            id: recording.id,
            created_at: recording.created_at,
            event_name: recording.event_name,
            duration_seconds: recording.duration_seconds,
            transcript: recording.transcript,
            processing_status: recording.processing_status || "pending",
            processed_data: recording.processed_data as Record<string, unknown> | null,
            contacts_created: created,
            contacts_updated: updated,
            next_steps_count: nextSteps?.length || 0,
          };
        })
      );

      return recordingsWithStats;
    },
    staleTime: 30 * 1000,
  });

  // Fetch stats
  const statsQuery = useQuery({
    queryKey: ["voice-notes-stats"],
    queryFn: async () => {
      // Recordings this week
      const { count: recordingsCount } = await supabase
        .from("voice_recordings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());

      // Contacts created from voice
      const { count: contactsCreated } = await supabase
        .from("voice_contact_updates")
        .select("*", { count: "exact", head: true })
        .eq("update_type", "created");

      // Pending next steps for current user
      const { data: { user } } = await supabase.auth.getUser();
      let pendingCount = 0;
      if (user) {
        const { count } = await supabase
          .from("voice_next_steps")
          .select("*", { count: "exact", head: true })
          .eq("assigned_to", user.id)
          .eq("status", "pending");
        pendingCount = count || 0;
      }

      // Notes added this week
      const { count: notesCount } = await supabase
        .from("voice_contact_updates")
        .select("*", { count: "exact", head: true })
        .eq("update_type", "note_added")
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString());

      const stats: VoiceNotesStats = {
        recordingsThisWeek: recordingsCount || 0,
        contactsCreated: contactsCreated || 0,
        pendingNextSteps: pendingCount,
        notesAddedThisWeek: notesCount || 0,
      };

      return stats;
    },
    staleTime: 60 * 1000,
  });

  // Fetch next steps for current user
  const nextStepsQuery = useQuery({
    queryKey: ["voice-next-steps-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("voice_next_steps")
        .select(`
          *,
          contact:contact_id (
            id,
            first_name,
            last_name,
            full_legal_name
          )
        `)
        .eq("assigned_to", user.id)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000,
  });

  return {
    recordings: recordingsQuery.data || [],
    isLoadingRecordings: recordingsQuery.isLoading,
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    nextSteps: nextStepsQuery.data || [],
    isLoadingNextSteps: nextStepsQuery.isLoading,
    refetch: () => {
      recordingsQuery.refetch();
      statsQuery.refetch();
      nextStepsQuery.refetch();
    },
  };
}
