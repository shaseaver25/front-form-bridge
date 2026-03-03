import { Mic, CheckCircle2, ListTodo, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceEmptyStateProps {
  type: "no-recordings" | "no-next-steps" | "processing" | "no-notes";
  action?: React.ReactNode;
  className?: string;
}

export function VoiceEmptyState({ type, action, className }: VoiceEmptyStateProps) {
  if (type === "no-recordings") {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Mic className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Start capturing contacts</h3>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          Record your networking conversations and let AI extract contacts and follow-up tasks automatically.
        </p>
        {action}
      </div>
    );
  }

  if (type === "no-next-steps") {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          No pending follow-ups from your voice notes. Great job staying on top of things!
        </p>
        {action}
      </div>
    );
  }

  if (type === "no-notes") {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium mb-1">No voice notes yet</h3>
        <p className="text-sm text-muted-foreground">
          Record a voice note to add context to this contact.
        </p>
        {action}
      </div>
    );
  }

  // Processing state
  return (
    <div className={cn("text-center py-12", className)}>
      <div className="relative w-24 h-24 mx-auto mb-4">
        {/* Animated waveform */}
        <div className="absolute inset-0 flex items-center justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full animate-pulse"
              style={{
                height: `${20 + Math.random() * 30}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: "0.8s",
              }}
            />
          ))}
        </div>
        <Loader2 className="absolute inset-0 w-24 h-24 text-primary/20 animate-spin" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Analyzing your recording...</h3>
      <p className="text-muted-foreground max-w-sm mx-auto">
        Our AI is extracting contacts, notes, and follow-up tasks from your voice note.
      </p>
    </div>
  );
}
