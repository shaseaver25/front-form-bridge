import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Mic, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Calendar, 
  CheckSquare,
  Play,
  ExternalLink
} from "lucide-react";
import { useConstituentVoiceNotes } from "@/hooks/useConstituentVoiceNotes";
import { format } from "date-fns";

interface ConstituentVoiceSectionProps {
  constituentId: string;
  constituentName: string;
  onRecordNote: () => void;
}

export function ConstituentVoiceSection({ 
  constituentId, 
  constituentName,
  onRecordNote 
}: ConstituentVoiceSectionProps) {
  const [isNotesOpen, setIsNotesOpen] = useState(true);
  const [isTasksOpen, setIsTasksOpen] = useState(true);
  const { 
    voiceNotes, 
    loadingNotes, 
    voiceNextSteps, 
    loadingNextSteps,
    completeNextStep,
    isCompletingNextStep
  } = useConstituentVoiceNotes(constituentId);

  const pendingTasks = voiceNextSteps.filter(t => t.status === "pending");

  return (
    <div className="space-y-4">
      {/* Voice Notes Section */}
      <Card>
        <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-left">
                  {isNotesOpen ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Voice Notes
                  </CardTitle>
                  {voiceNotes.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {voiceNotes.length}
                    </Badge>
                  )}
                </button>
              </CollapsibleTrigger>
              <Button size="sm" onClick={onRecordNote}>
                <Mic className="w-4 h-4 mr-1" />
                Add Voice Note
              </Button>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {loadingNotes ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-3 rounded-lg border bg-card">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4 mt-1" />
                    </div>
                  ))}
                </div>
              ) : voiceNotes.length > 0 ? (
                <div className="space-y-3">
                  {voiceNotes.map((note: any) => (
                    <div key={note.id} className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                            {note.voice_recordings?.event_name && (
                              <>
                                <span className="text-muted-foreground/50">•</span>
                                <span className="text-primary">{note.voice_recordings.event_name}</span>
                              </>
                            )}
                          </div>
                          <p className="text-sm">{note.note_content}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {note.voice_recordings?.audio_url && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => window.open(`/voice-notes?recording=${note.recording_id}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No voice notes yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={onRecordNote}
                  >
                    <Mic className="w-4 h-4 mr-1" />
                    Record First Note
                  </Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Voice Follow-up Tasks */}
      {(pendingTasks.length > 0 || loadingNextSteps) && (
        <Card>
          <Collapsible open={isTasksOpen} onOpenChange={setIsTasksOpen}>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-left">
                  {isTasksOpen ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckSquare className="w-5 h-5" />
                    Voice Follow-up Tasks
                  </CardTitle>
                  {pendingTasks.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pendingTasks.length} pending
                    </Badge>
                  )}
                </button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                {loadingNextSteps ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/5 transition-colors"
                      >
                        <Checkbox
                          checked={task.status === "completed"}
                          onCheckedChange={() => completeNextStep(task.id)}
                          disabled={isCompletingNextStep}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{task.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {task.due_date && (
                              <span>Due: {format(new Date(task.due_date), "MMM d")}</span>
                            )}
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                task.priority === "high" ? "border-destructive text-destructive" :
                                task.priority === "medium" ? "border-warning text-warning" :
                                "border-muted"
                              }`}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
}
