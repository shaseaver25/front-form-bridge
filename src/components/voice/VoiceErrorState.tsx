import { Mic, AlertTriangle, WifiOff, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface VoiceErrorStateProps {
  type: "microphone" | "browser" | "processing" | "network";
  onRetry?: () => void;
  onManualEntry?: () => void;
}

export function VoiceErrorState({ type, onRetry, onManualEntry }: VoiceErrorStateProps) {
  if (type === "microphone") {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <Mic className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Microphone Access Required</h3>
        <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
          To record voice notes, please enable microphone access in your browser settings.
        </p>
        <div className="space-y-2 text-sm text-muted-foreground text-left max-w-sm mx-auto bg-muted/50 rounded-lg p-4">
          <p className="font-medium text-foreground mb-2">How to enable:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click the lock/info icon in your browser's address bar</li>
            <li>Find "Microphone" in the permissions</li>
            <li>Select "Allow"</li>
            <li>Refresh this page</li>
          </ol>
        </div>
        <Button onClick={() => window.location.reload()} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Page
        </Button>
      </div>
    );
  }

  if (type === "browser") {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-warning" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Browser Not Supported</h3>
        <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
          Voice recording requires a modern browser with speech recognition support.
        </p>
        <div className="space-y-2 text-sm text-muted-foreground text-left max-w-sm mx-auto bg-muted/50 rounded-lg p-4">
          <p className="font-medium text-foreground mb-2">Supported browsers:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Google Chrome (recommended)</li>
            <li>Microsoft Edge</li>
            <li>Safari (macOS/iOS)</li>
            <li>Brave Browser</li>
          </ul>
        </div>
        {onManualEntry && (
          <Button variant="outline" onClick={onManualEntry} className="mt-4">
            Enter Contact Manually
          </Button>
        )}
      </div>
    );
  }

  if (type === "network") {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Network Error</h3>
        <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
          Unable to process your recording. Please check your internet connection and try again.
        </p>
        <div className="flex gap-2 justify-center">
          {onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {onManualEntry && (
            <Button variant="outline" onClick={onManualEntry}>
              Enter Manually
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Processing failed
  return (
    <div className="text-center py-8 px-4">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Processing Failed</h3>
      <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
        We couldn't process your recording. This might be due to audio quality or a temporary issue.
      </p>
      <div className="flex gap-2 justify-center">
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Processing
          </Button>
        )}
        {onManualEntry && (
          <Button variant="outline" onClick={onManualEntry}>
            Enter Manually Instead
          </Button>
        )}
      </div>
    </div>
  );
}
