export type VoiceProcessingStatus = 'recording' | 'transcribing' | 'processing' | 'completed' | 'failed';
export type VoiceUpdateType = 'created' | 'updated' | 'note_added';
export type VoicePriority = 'low' | 'medium' | 'high';
export type VoiceStepStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface ExtractedContact { name: string; organization: string | null; title: string | null; email: string | null; phone: string | null; linkedContactId: string | null; isNew: boolean; confidence: number; }
export interface ExtractedNextStep { action: string; contactName: string | null; suggestedDueDate: string | null; priority: VoicePriority; }
export interface ExtractedNote { contactName: string; content: string; }
export interface ProcessedVoiceData { contacts: ExtractedContact[]; nextSteps: ExtractedNextStep[]; notes: ExtractedNote[]; eventContext: string | null; }

export interface VoiceRecording { id: string; organization_id: string | null; user_id: string; audio_url: string | null; transcript: string; transcript_raw: string | null; duration_seconds: number | null; processing_status: VoiceProcessingStatus; processed_data: ProcessedVoiceData; event_name: string | null; event_date: string | null; created_at: string; updated_at: string; }
export interface VoiceNextStep { id: string; organization_id: string | null; recording_id: string | null; contact_id: string | null; assigned_to: string; created_by: string; title: string; description: string | null; due_date: string | null; priority: VoicePriority; status: VoiceStepStatus; completed_at: string | null; created_at: string; updated_at: string; }
export interface VoiceContactUpdate { id: string; recording_id: string; contact_id: string; update_type: VoiceUpdateType; fields_updated: Record<string, unknown>; note_content: string | null; created_at: string; }

export interface CreateVoiceRecordingInput { audio_url?: string; transcript: string; transcript_raw?: string; duration_seconds?: number; processing_status?: VoiceProcessingStatus; processed_data?: ProcessedVoiceData; event_name?: string; event_date?: string; }
export interface CreateVoiceNextStepInput { recording_id?: string; contact_id?: string; assigned_to: string; title: string; description?: string; due_date?: string; priority?: VoicePriority; }
export interface UpdateVoiceNextStepInput { title?: string; description?: string; due_date?: string; priority?: VoicePriority; status?: VoiceStepStatus; completed_at?: string; }
export interface VoiceRecordingState { isRecording: boolean; isProcessing: boolean; currentRecording: VoiceRecording | null; error: string | null; }
export interface VoiceNotesFilter { status?: VoiceProcessingStatus; dateRange?: { start: string; end: string; }; eventName?: string; userId?: string; }