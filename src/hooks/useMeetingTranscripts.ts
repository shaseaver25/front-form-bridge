import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MeetingTranscript {
  id: string;
  user_id: string;
  source: 'fireflies' | 'upload';
  fireflies_meeting_id: string | null;
  title: string;
  meeting_date: string;
  duration_minutes: number | null;
  participants: string[] | null;
  transcript_text: string;
  summary: string | null;
  original_file_url: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingTranscriptTask {
  id: string;
  transcript_id: string;
  task_text: string;
  assigned_to: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'dismissed' | 'completed';
  calendar_event_id: string | null;
  board_card_id: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface MeetingTranscriptConstituent {
  id: string;
  transcript_id: string;
  constituent_id: string;
  match_type: 'email' | 'name' | 'manual';
  created_at: string;
  constituent?: {
    id: string;
    full_legal_name: string;
    primary_email: string | null;
  };
}

export function useMeetingTranscripts() {
  const queryClient = useQueryClient();

  const transcriptsQuery = useQuery({
    queryKey: ['meeting-transcripts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_transcripts')
        .select('*')
        .order('meeting_date', { ascending: false });

      if (error) throw error;
      return data as MeetingTranscript[];
    },
  });

  const getTranscriptQuery = (transcriptId: string | undefined) => useQuery({
    queryKey: ['meeting-transcript', transcriptId],
    queryFn: async () => {
      if (!transcriptId) return null;
      
      const { data, error } = await supabase
        .from('meeting_transcripts')
        .select('*')
        .eq('id', transcriptId)
        .single();

      if (error) throw error;
      return data as MeetingTranscript;
    },
    enabled: !!transcriptId,
  });

  const getTranscriptTasksQuery = (transcriptId: string | undefined) => useQuery({
    queryKey: ['meeting-transcript-tasks', transcriptId],
    queryFn: async () => {
      if (!transcriptId) return [];
      
      const { data, error } = await supabase
        .from('meeting_transcript_tasks')
        .select('*')
        .eq('transcript_id', transcriptId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as MeetingTranscriptTask[];
    },
    enabled: !!transcriptId,
  });

  const getTranscriptConstituentsQuery = (transcriptId: string | undefined) => useQuery({
    queryKey: ['meeting-transcript-constituents', transcriptId],
    queryFn: async () => {
      if (!transcriptId) return [];
      
      const { data, error } = await supabase
        .from('meeting_transcript_constituents')
        .select(`
          *,
          constituent:constituents(id, full_legal_name, primary_email)
        `)
        .eq('transcript_id', transcriptId);

      if (error) throw error;
      return data as MeetingTranscriptConstituent[];
    },
    enabled: !!transcriptId,
  });

  const uploadTranscriptMutation = useMutation({
    mutationFn: async (params: {
      file: File;
      title: string;
      meetingDate: string;
      participants?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const filePath = `${user.id}/${Date.now()}-${params.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('meeting-transcripts')
        .upload(filePath, params.file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('meeting-transcripts')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('meeting_transcripts')
        .insert({
          user_id: user.id,
          source: 'upload',
          title: params.title,
          meeting_date: params.meetingDate,
          participants: params.participants || [],
          transcript_text: 'Processing...',
          original_file_url: urlData.publicUrl,
        })
        .select()
        .single();

      if (error) throw error;

      try {
        await supabase.functions.invoke('process-meeting-transcript', {
          body: { transcriptId: data.id },
        });
      } catch (e) {
        console.error('Failed to process transcript:', e);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-transcripts'] });
      toast.success('Transcript uploaded and processing');
    },
    onError: (error) => {
      toast.error('Failed to upload transcript: ' + error.message);
    },
  });

  const createManualTranscriptMutation = useMutation({
    mutationFn: async (params: {
      title: string;
      meetingDate: string;
      transcriptText: string;
      participants?: string[];
      durationMinutes?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meeting_transcripts')
        .insert({
          user_id: user.id,
          source: 'upload',
          title: params.title,
          meeting_date: params.meetingDate,
          transcript_text: params.transcriptText,
          participants: params.participants || [],
          duration_minutes: params.durationMinutes,
        })
        .select()
        .single();

      if (error) throw error;

      try {
        await supabase.functions.invoke('process-meeting-transcript', {
          body: { transcriptId: data.id },
        });
      } catch (e) {
        console.error('Failed to process transcript:', e);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-transcripts'] });
      toast.success('Transcript created and processing');
    },
    onError: (error) => {
      toast.error('Failed to create transcript: ' + error.message);
    },
  });

  const deleteTranscriptMutation = useMutation({
    mutationFn: async (transcriptId: string) => {
      const { error } = await supabase
        .from('meeting_transcripts')
        .delete()
        .eq('id', transcriptId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-transcripts'] });
      toast.success('Transcript deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete transcript: ' + error.message);
    },
  });

  return {
    transcripts: transcriptsQuery.data || [],
    isLoading: transcriptsQuery.isLoading,
    error: transcriptsQuery.error,
    getTranscript: getTranscriptQuery,
    getTranscriptTasks: getTranscriptTasksQuery,
    getTranscriptConstituents: getTranscriptConstituentsQuery,
    uploadTranscript: uploadTranscriptMutation.mutateAsync,
    createManualTranscript: createManualTranscriptMutation.mutateAsync,
    deleteTranscript: deleteTranscriptMutation.mutateAsync,
    isUploading: uploadTranscriptMutation.isPending,
    isCreating: createManualTranscriptMutation.isPending,
  };
}
