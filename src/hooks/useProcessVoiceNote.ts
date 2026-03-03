import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProcessedVoiceData, ExtractedContact, ExtractedNextStep, ExtractedNote } from "@/types/voice-notes";

interface ExistingContact {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_legal_name?: string;
  employer?: string | null;
}

interface ProcessVoiceNoteParams {
  transcript: string;
  existingContacts?: ExistingContact[];
  eventContext?: string;
}

interface ProcessVoiceNoteResult {
  contacts: ExtractedContact[];
  nextSteps: ExtractedNextStep[];
  notes: ExtractedNote[];
  eventContext: string | null;
}

export function useProcessVoiceNote() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processVoiceNote = async ({
    transcript,
    existingContacts = [],
    eventContext,
  }: ProcessVoiceNoteParams): Promise<ProcessVoiceNoteResult | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "process-voice-note",
        {
          body: {
            transcript,
            existingContacts,
            eventContext,
          },
        }
      );

      if (functionError) {
        console.error("Edge function error:", functionError);
        throw new Error(functionError.message || "Failed to process voice note");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Ensure data has the correct structure
      const result: ProcessVoiceNoteResult = {
        contacts: (data?.contacts || []).map((c: ExtractedContact) => ({
          name: c.name || "Unknown",
          organization: c.organization || null,
          title: c.title || null,
          email: c.email || null,
          phone: c.phone || null,
          linkedContactId: c.linkedContactId || null,
          isNew: c.isNew ?? true,
          confidence: c.confidence ?? 0.5,
        })),
        nextSteps: (data?.nextSteps || []).map((s: ExtractedNextStep) => ({
          action: s.action || "",
          contactName: s.contactName || null,
          suggestedDueDate: s.suggestedDueDate || null,
          priority: s.priority || "medium",
        })),
        notes: (data?.notes || []).map((n: ExtractedNote) => ({
          contactName: n.contactName || "General",
          content: n.content || "",
        })),
        eventContext: data?.eventContext || eventContext || null,
      };

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process voice note";
      console.error("Error processing voice note:", message);
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processVoiceNote,
    isProcessing,
    error,
    clearError: () => setError(null),
  };
}
