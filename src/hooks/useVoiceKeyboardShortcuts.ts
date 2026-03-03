import { useEffect, useCallback } from "react";

interface VoiceKeyboardShortcutsProps {
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onCancel?: () => void;
  isRecording?: boolean;
  isEnabled?: boolean;
}

export function useVoiceKeyboardShortcuts({
  onStartRecording,
  onStopRecording,
  onCancel,
  isRecording = false,
  isEnabled = true,
}: VoiceKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isEnabled) return;
      
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "r":
          if (!isRecording && onStartRecording) {
            event.preventDefault();
            onStartRecording();
          }
          break;
        case " ":
          if (isRecording && onStopRecording) {
            event.preventDefault();
            onStopRecording();
          }
          break;
        case "escape":
          if (onCancel) {
            event.preventDefault();
            onCancel();
          }
          break;
      }
    },
    [isEnabled, isRecording, onStartRecording, onStopRecording, onCancel]
  );

}
