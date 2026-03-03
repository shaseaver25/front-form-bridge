import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  ListTodo,
  RefreshCw,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { VoiceRecordingWithStats } from "@/hooks/useVoiceNotes";

interface VoiceRecordingCardProps {
  recording: VoiceRecordingWithStats;
}

export function VoiceRecordingCard({ recording }: VoiceRecordingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "processing":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "failed":
        return "bg-red-500/10 text-red-600 border-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete associated records first (but not the contacts/tasks created)
      await supabase
        .from("voice_contact_updates")
        .delete()
        .eq("recording_id", recording.id);

      await supabase
        .from("voice_next_steps")
        .delete()
        .eq("recording_id", recording.id);

      // Delete the recording
      const { error } = await supabase
        .from("voice_recordings")
        .delete()
        .eq("id", recording.id);

      if (error) throw error;

      toast.success("Recording deleted");
      queryClient.invalidateQueries({ queryKey: ["voice-recordings"] });
      queryClient.invalidateQueries({ queryKey: ["voice-notes-stats"] });
    } catch (error) {
      console.error("Error deleting recording:", error);
      toast.error("Failed to delete recording");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const transcriptPreview = recording.transcript
    ? recording.transcript.slice(0, 100) + (recording.transcript.length > 100 ? "..." : "")
    : "No transcript available";

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">
                  {format(new Date(recording.created_at), "MMM d, yyyy 'at' h:mm a")}
                </span>
                <Badge variant="outline" className={getStatusColor(recording.processing_status)}>
                  {recording.processing_status}
                </Badge>
              </div>
              {recording.event_name && (
                <p className="text-sm text-muted-foreground">{recording.event_name}</p>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{formatDuration(recording.duration_seconds)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">{transcriptPreview}</p>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-primary" />
              <span>
                {recording.contacts_created + recording.contacts_updated} contacts
              </span>
            </div>
            <div className="flex items-center gap-1">
              <ListTodo className="w-4 h-4 text-primary" />
              <span>{recording.next_steps_count} tasks</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show Details
              </>
            )}
          </Button>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {/* Full Transcript */}
              <div>
                <h4 className="text-sm font-medium mb-2">Full Transcript</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  {recording.transcript || "No transcript available"}
                </p>
              </div>

              {/* Created/Updated Contacts */}
              {(recording.contacts_created > 0 || recording.contacts_updated > 0) && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Contacts</h4>
                  <div className="flex gap-2 flex-wrap">
                    {recording.contacts_created > 0 && (
                      <Badge variant="secondary">
                        {recording.contacts_created} created
                      </Badge>
                    )}
                    {recording.contacts_updated > 0 && (
                      <Badge variant="outline">
                        {recording.contacts_updated} updated
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              {recording.next_steps_count > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Next Steps</h4>
                  <Badge variant="secondary">
                    {recording.next_steps_count} tasks created
                  </Badge>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/voice-notes/next-steps")}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Tasks
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Reprocess
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recording</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the recording and its metadata. Contacts and tasks
              created from this recording will NOT be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
