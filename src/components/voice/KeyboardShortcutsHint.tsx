interface KeyboardShortcutsHintProps {
  isRecording: boolean;
}

export function KeyboardShortcutsHint({ isRecording }: KeyboardShortcutsHintProps) {
  return (
    <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground mt-4">
      {isRecording ? (
        <>
          <span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Space</kbd>{" "}
            to stop
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd>{" "}
            to cancel
          </span>
        </>
      ) : (
        <span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">R</kbd>{" "}
          to start recording
        </span>
      )}
    </div>
  );
}
