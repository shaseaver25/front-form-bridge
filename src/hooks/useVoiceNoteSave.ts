import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { saveVoiceNoteResults } from "@/utils/voice-save";
import type { ProcessedVoiceData } from "@/types/voice-notes";

interface SaveVoiceNoteParams {
  transcript: string;
  processedData: ProcessedVoiceData;
  eventName?: string;
  durationSeconds?: number;
}

interface SaveResult {
  recordingId: string;
  createdContactIds: string[];
  updatedContactIds: string[];
  createdNextStepIds: string[];
  notesAdded: number;
}

export function useVoiceNoteSave() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaveResult | null>(null);
  const queryClient = useQueryClient();

  const saveVoiceNote = async ({
    transcript,
    processedData,
    eventName,
    durationSeconds,
  }: SaveVoiceNoteParams): Promise<SaveResult | null> => {
    setIsSaving(true);
    setError(null);
    setResult(null);

    const toastId = toast.loading("Saving voice note...");

    try {
      // Show progress for contacts
      if (processedData.contacts.length > 0) {
        const newCount = processedData.contacts.filter(c => c.isNew).length;
        const existingCount = processedData.contacts.length - newCount;
        
        if (newCount > 0) {
          toast.loading(`Creating ${newCount} new contact${newCount > 1 ? "s" : ""}...`, { id: toastId });
        }
        if (existingCount > 0) {
          toast.loading(`Updating ${existingCount} existing contact${existingCount > 1 ? "s" : ""}...`, { id: toastId });
        }
      }

      const saveResult = await saveVoiceNoteResults({
        transcript,
        processedData,
        eventName,
        durationSeconds,
      });

      setResult(saveResult);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["constituents"] });
      queryClient.invalidateQueries({ queryKey: ["voice-recordings"] });
      queryClient.invalidateQueries({ queryKey: ["voice-next-steps"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });

      // Build success message
      const parts: string[] = [];
      if (saveResult.createdContactIds.length > 0) {
        parts.push(`${saveResult.createdContactIds.length} contact${saveResult.createdContactIds.length > 1 ? "s" : ""} created`);
      }
      if (saveResult.updatedContactIds.length > 0) {
        parts.push(`${saveResult.updatedContactIds.length} contact${saveResult.updatedContactIds.length > 1 ? "s" : ""} updated`);
      }
      if (saveResult.notesAdded > 0) {
        parts.push(`${saveResult.notesAdded} note${saveResult.notesAdded > 1 ? "s" : ""} added`);
      }
      if (saveResult.createdNextStepIds.length > 0) {
        parts.push(`${saveResult.createdNextStepIds.length} follow-up${saveResult.createdNextStepIds.length > 1 ? "s" : ""} created`);
      }

      const message = parts.length > 0 
        ? `Voice note saved! ${parts.join(", ")}.`
        : "Voice note saved!";

      toast.success(message, { id: toastId });

      return saveResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save voice note";
      console.error("Error saving voice note:", message);
      setError(message);
      toast.error(message, { id: toastId });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    saveVoiceNote,
    isSaving,
    error,
    result,
    clearError: () => setError(null),
    clearResult: () => setResult(null),
  };
}
