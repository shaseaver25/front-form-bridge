import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Video, 
  Users, 
  Clock, 
  Download, 
  Check, 
  RefreshCw,
  Settings,
  AlertCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useFirefliesIntegration } from "@/hooks/useFirefliesIntegration";

export function FirefliesMeetingsTab() {
  const [showSettings, setShowSettings] = useState(false);
  const {
    settings,
    isLoadingSettings,
    meetings,
    needsApiKey,
    isLoadingMeetings,
    isImporting,
    checkConnection,
    isCheckingConnection,
    importMeeting,
    importAllMeetings,
    isImportingAll,
    updateSettings,
    refetchMeetings,
  } = useFirefliesIntegration();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const unimportedCount = meetings.filter(m => !m.isImported && m.hasTranscript).length;

  if (isLoadingSettings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Not connected state
  if (!settings?.api_key_configured || needsApiKey) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Connect Fireflies.ai
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Import meeting transcripts from Fireflies.ai to automatically extract contacts, 
              notes, and follow-up tasks from your Zoom, Google Meet, and Teams calls.
            </p>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>API Key Required</AlertTitle>
              <AlertDescription>
                To connect, add your Fireflies API key in your project secrets with the name{" "}
                <code className="bg-muted px-1 py-0.5 rounded">FIREFLIES_API_KEY</code>.
                You can find your API key in your{" "}
                <a 
                  href="https://app.fireflies.ai/integrations" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Fireflies Settings <ExternalLink className="h-3 w-3" />
                </a>
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => checkConnection()}
              disabled={isCheckingConnection}
            >
              {isCheckingConnection ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking connection...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status & Actions */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">
                  Connected as {settings.connected_email || "Unknown"}
                </span>
              </div>
              {settings.last_sync_at && (
                <span className="text-sm text-muted-foreground">
                  Last synced {formatDistanceToNow(new Date(settings.last_sync_at), { addSuffix: true })}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchMeetings()}
                disabled={isLoadingMeetings}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingMeetings ? "animate-spin" : ""}`} />
                Refresh
              </Button>

              {unimportedCount > 0 && (
                <Button
                  size="sm"
                  onClick={() => importAllMeetings()}
                  disabled={isImportingAll}
                >
                  {isImportingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Import All ({unimportedCount})
                    </>
                  )}
                </Button>
              )}

              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Fireflies Settings</DialogTitle>
                    <DialogDescription>
                      Configure how meeting transcripts are imported.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-import new meetings</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically import new transcripts when available
                        </p>
                      </div>
                      <Switch
                        checked={settings.auto_import_enabled}
                        onCheckedChange={(checked) => 
                          updateSettings({ auto_import_enabled: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Only my meetings</Label>
                        <p className="text-sm text-muted-foreground">
                          Only import meetings where you are the host
                        </p>
                      </div>
                      <Switch
                        checked={settings.only_host_meetings}
                        onCheckedChange={(checked) => 
                          updateSettings({ only_host_meetings: checked })
                        }
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meetings List */}
      {isLoadingMeetings ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No meetings found</h3>
            <p className="text-sm text-muted-foreground">
              Record a meeting with Fireflies to see it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <Card 
              key={meeting.id}
              className={meeting.isImported ? "opacity-60" : ""}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{meeting.title}</h4>
                      {meeting.isImported && (
                        <Badge variant="secondary" className="shrink-0">
                          <Check className="h-3 w-3 mr-1" />
                          Imported
                        </Badge>
                      )}
                      {!meeting.hasTranscript && (
                        <Badge variant="outline" className="shrink-0">
                          No transcript
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {format(new Date(meeting.date), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(meeting.duration)}
                      </span>
                      {meeting.participants.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {meeting.participants.length} participants
                        </span>
                      )}
                      {meeting.actionItemsCount > 0 && (
                        <span className="text-primary">
                          {meeting.actionItemsCount} action items
                        </span>
                      )}
                    </div>
                  </div>

                  {!meeting.isImported && meeting.hasTranscript && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => importMeeting(meeting.id)}
                      disabled={isImporting === meeting.id}
                    >
                      {isImporting === meeting.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Import
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
