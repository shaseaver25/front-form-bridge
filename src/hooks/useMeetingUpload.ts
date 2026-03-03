import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProcessVoiceNote } from "./useProcessVoiceNote";
import type { ProcessedVoiceData } from "@/types/voice-notes";
import type { Json } from "@/integrations/supabase/types";

interface MeetingMetadata {
  title: string;
  date: string;
  attendees?: string;
}

interface UploadState {
  stage: 'idle' | 'uploading' | 'transcribing' | 'processing' | 'review' | 'error';
  uploadProgress: number;
  transcript: string | null;
  processedData: ProcessedVoiceData | null;
  recordingId: string | null;
  error: string | null;
  estimatedCost: number | null;
}

const WHISPER_COST_PER_MINUTE = 0.006; // $0.006 per minute

export function useMeetingUpload() {
  const [state, setState] = useState<UploadState>({
    stage: 'idle',
    uploadProgress: 0,
    transcript: null,
    processedData: null,
    recordingId: null,
    error: null,
    estimatedCost: null,
  });

  const { processVoiceNote } = useProcessVoiceNote();

  const estimateCost = useCallback((file: File): number => {
    // Rough estimate: assume 1MB of audio ≈ 1 minute for typical meeting recordings
    const estimatedMinutes = file.size / (1024 * 1024);
    return Math.max(0.01, estimatedMinutes * WHISPER_COST_PER_MINUTE);
  }, []);

  const reset = useCallback(() => {
    setState({
      stage: 'idle',
      uploadProgress: 0,
      transcript: null,
      processedData: null,
      recordingId: null,
      error: null,
      estimatedCost: null,
    });
  }, []);

  const processTranscript = useCallback(async (transcript: string, metadata: MeetingMetadata) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to process transcripts');
      }

      setState(prev => ({ 
        ...prev, 
        stage: 'processing', 
        transcript,
        error: null,
        estimatedCost: null, // No cost for transcript-only
      }));

      // Create voice_recording entry
      const { data: recording, error: recordingError } = await supabase
        .from('voice_recordings')
        .insert({
          user_id: user.id,
          source: 'meeting_upload',
          meeting_title: metadata.title,
          event_name: metadata.title,
          event_date: metadata.date,
          meeting_attendees: metadata.attendees ? { attendees: metadata.attendees } : null,
          transcript,
          processing_status: 'processing',
          processed_data: { contacts: [], nextSteps: [], notes: [], eventContext: null },
        })
        .select()
        .single();

      if (recordingError) {
        console.error('Recording creation error:', recordingError);
        throw new Error(`Failed to create recording: ${recordingError.message}`);
      }

      setState(prev => ({ 
        ...prev, 
        recordingId: recording.id,
      }));

      // Fetch existing contacts for matching
      const { data: existingContacts } = await supabase
        .from('constituents')
        .select('id, first_name, last_name, full_legal_name, employer')
        .limit(100);

      // Process with AI
      const processed = await processVoiceNote({
        transcript,
        existingContacts: existingContacts || [],
        eventContext: metadata.title,
      });

      if (processed) {
        // Update the recording with processed data
        await supabase
          .from('voice_recordings')
          .update({
            processed_data: JSON.parse(JSON.stringify(processed)) as Json,
            processing_status: 'completed',
          })
          .eq('id', recording.id);

        setState(prev => ({
          ...prev,
          processedData: processed,
          stage: 'review',
        }));
      } else {
        throw new Error('Failed to process transcript');
      }

    } catch (error) {
      console.error('Transcript processing error:', error);
      setState(prev => ({
        ...prev,
        stage: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, [processVoiceNote]);

  const uploadFile = useCallback(async (file: File, metadata: MeetingMetadata) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to upload meetings');
      }

      setState(prev => ({ 
        ...prev, 
        stage: 'uploading', 
        uploadProgress: 0, 
        error: null,
        estimatedCost: estimateCost(file)
      }));

      // Generate unique file path
      const fileExt = file.name.split('.').pop() || 'mp3';
      const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meeting-recordings')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setState(prev => ({ ...prev, uploadProgress: 50 }));

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('meeting-recordings')
        .getPublicUrl(fileName);

      // Create voice_recording entry
      const { data: recording, error: recordingError } = await supabase
        .from('voice_recordings')
        .insert({
          user_id: user.id,
          source: 'meeting_upload',
          meeting_title: metadata.title,
          event_name: metadata.title,
          event_date: metadata.date,
          meeting_attendees: metadata.attendees ? { attendees: metadata.attendees } : null,
          file_url: urlData.publicUrl,
          file_size_bytes: file.size,
          processing_status: 'recording',
          transcript: '',
          processed_data: { contacts: [], nextSteps: [], notes: [], eventContext: null },
        })
        .select()
        .single();

      if (recordingError) {
        console.error('Recording creation error:', recordingError);
        throw new Error(`Failed to create recording: ${recordingError.message}`);
      }

      setState(prev => ({ 
        ...prev, 
        uploadProgress: 100, 
        recordingId: recording.id,
        stage: 'transcribing'
      }));

      // Create form data for transcription
      const transcribeFormData = new FormData();
      transcribeFormData.append('audio', file, file.name);
      transcribeFormData.append('recordingId', recording.id);

      // Call transcription edge function
      const transcribeResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: transcribeFormData,
        }
      );

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json();
        throw new Error(errorData.error || 'Transcription failed');
      }

      const transcribeResult = await transcribeResponse.json();
      
      setState(prev => ({ 
        ...prev, 
        transcript: transcribeResult.transcript,
        stage: 'processing'
      }));

      // Fetch existing contacts for matching
      const { data: existingContacts } = await supabase
        .from('constituents')
        .select('id, first_name, last_name, full_legal_name, employer')
        .limit(100);

      // Process with AI (reuse voice note processing)
      const processed = await processVoiceNote({
        transcript: transcribeResult.transcript,
        existingContacts: existingContacts || [],
        eventContext: metadata.title,
      });

      if (processed) {
        // Update the recording with processed data
        await supabase
          .from('voice_recordings')
          .update({
            processed_data: JSON.parse(JSON.stringify(processed)) as Json,
            processing_status: 'completed',
          })
          .eq('id', recording.id);

        setState(prev => ({
          ...prev,
          processedData: processed,
          stage: 'review',
        }));
      } else {
        throw new Error('Failed to process transcript');
      }

    } catch (error) {
      console.error('Meeting upload error:', error);
      setState(prev => ({
        ...prev,
        stage: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, [processVoiceNote, estimateCost]);

  return {
    ...state,
    uploadFile,
    processTranscript,
    reset,
    estimateCost,
  };
}
