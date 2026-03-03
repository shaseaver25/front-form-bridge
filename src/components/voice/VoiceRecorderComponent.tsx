import { useState, useEffect } from "react";
import { Mic, Square, X, Check, AlertCircle, Loader2, User, ListTodo, FileText, Pencil, Users, ArrowRight, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useProcessVoiceNote } from "@/hooks/useProcessVoiceNote";
import { useVoiceNoteSave } from "@/hooks/useVoiceNoteSave";
import { useVoiceKeyboardShortcuts } from "@/hooks/useVoiceKeyboardShortcuts";
import { KeyboardShortcutsHint } from "@/components/voice/KeyboardShortcutsHint";
import { VoiceErrorState } from "@/components/voice/VoiceErrorState";
import { VoiceEmptyState } from "@/components/voice/VoiceEmptyState";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import type { ExtractedContact, ExtractedNextStep, ExtractedNote, ProcessedVoiceData } from "@/types/voice-notes";

type RecorderState = "idle" | "recording" | "processing" | "review" | "success";

interface VoiceRecorderComponentProps {
  onSave?: (data: ProcessedVoiceData, transcript: string, eventName?: string) => Promise<void>;
  onCancel?: () => void;
  initialContactId?: string;
  initialContactName?: string;
}

export function VoiceRecorderComponent({
  onSave,
  onCancel,
  initialContactId,
  initialContactName,
}: VoiceRecorderComponentProps) {
  const {
    isRecording,
    isSupported,
    transcript,
    interimTranscript,
    duration,
    audioLevel,
    error: recordingError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoiceRecording();

  const { processVoiceNote, isProcessing, error: processingError } = useProcessVoiceNote();
  const { saveVoiceNote, isSaving, result: saveResult } = useVoiceNoteSave();

  const [state, setState] = useState<RecorderState>("idle");
  const [eventName, setEventName] = useState("");
  const [editedTranscript, setEditedTranscript] = useState("");
  const [processingStep, setProcessingStep] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Extracted data state
  const [contacts, setContacts] = useState<(ExtractedContact & { included: boolean })[]>([]);
  const [nextSteps, setNextSteps] = useState<(ExtractedNextStep & { included: boolean })[]>([]);
  const [notes, setNotes] = useState<(ExtractedNote & { included: boolean })[]>([]);

  const error = recordingError || processingError;

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle recording state changes
  useEffect(() => {
    if (isRecording) {
      setState("recording");
    }
  }, [isRecording]);

  // Keyboard shortcuts
  useVoiceKeyboardShortcuts({
    onStartRecording: () => {
      if (state === "idle") handleStartRecording();
    },
    onStopRecording: () => {
      if (state === "recording") handleStopRecording();
    },
    onCancel: () => {
      if (state === "recording") setShowCancelDialog(true);
      else if (state === "idle") onCancel?.();
    },
    isRecording: state === "recording",
    isEnabled: state === "idle" || state === "recording",
  });

  const handleStartRecording = async () => {
    await startRecording();
  };

  const handleStopRecording = async () => {
    setRecordingDuration(duration);
    stopRecording();
    setState("processing");
    
    // Wait a moment for final transcript
    await new Promise(r => setTimeout(r, 500));
    
    setProcessingStep("Transcribing...");
    await new Promise(r => setTimeout(r, 300));
    
    setProcessingStep("Fetching existing contacts...");
    
    // Fetch existing contacts for matching
    let existingContacts: { id: string; first_name: string | null; last_name: string | null; employer: string | null }[] = [];
    try {
      const { data } = await supabase
        .from("constituents")
        .select("id, first_name, last_name, employer")
        .limit(100);
      existingContacts = data || [];
    } catch (err) {
      console.error("Error fetching contacts:", err);
    }
    
    setProcessingStep("Analyzing with AI...");
    
    // Call AI to process the transcript
    const result = await processVoiceNote({
      transcript,
      existingContacts,
      eventContext: eventName || undefined,
    });
    
    if (result) {
      setContacts(result.contacts.map(c => ({ ...c, included: true })));
      setNextSteps(result.nextSteps.map(s => ({ ...s, included: true })));
      setNotes(result.notes.map(n => ({ ...n, included: true })));
    } else {
      // Fallback if AI fails - still show review with transcript
      setContacts([]);
      setNextSteps([]);
      setNotes([]);
    }
    
    setEditedTranscript(transcript);
    setState("review");
  };

  const handleCancelRecording = () => {
    if (isRecording) {
      setShowCancelDialog(true);
    } else {
      onCancel?.();
    }
  };

  const confirmCancelRecording = () => {
    stopRecording();
    resetRecording();
    setState("idle");
    setShowCancelDialog(false);
  };

  const handleDiscard = () => {
    setShowDiscardDialog(true);
  };

  const confirmDiscard = () => {
    resetRecording();
    setState("idle");
    setShowDiscardDialog(false);
    setContacts([]);
    setNextSteps([]);
    setNotes([]);
    setEditedTranscript("");
  };

  const handleSave = async () => {
    const processedData: ProcessedVoiceData = {
      contacts: contacts.filter(c => c.included).map(({ included, ...c }) => c),
      nextSteps: nextSteps.filter(s => s.included).map(({ included, ...s }) => s),
      notes: notes.filter(n => n.included).map(({ included, ...n }) => n),
      eventContext: eventName || null,
    };

    // Use the save hook to persist to database
    const result = await saveVoiceNote({
      transcript: editedTranscript,
      processedData,
      eventName: eventName || undefined,
      durationSeconds: recordingDuration,
    });

    if (result) {
      setState("success");
      // Also call the parent's onSave if provided
      await onSave?.(processedData, editedTranscript, eventName || undefined);
    }
  };

  const handleRecordAnother = () => {
    resetRecording();
    setState("idle");
    setContacts([]);
    setNextSteps([]);
    setNotes([]);
    setEditedTranscript("");
    setEventName("");
  };

  // Generate waveform bars based on audio level
  const waveformBars = Array.from({ length: 20 }, (_, i) => {
    const baseHeight = 8;
    const maxAdditionalHeight = 40;
    const variation = Math.sin((i / 20) * Math.PI) * 0.5 + 0.5;
    const height = baseHeight + (audioLevel * maxAdditionalHeight * variation * (0.5 + Math.random() * 0.5));
    return height;
  });

  if (!isSupported) {
    return (
      <VoiceErrorState 
        type="browser" 
        onManualEntry={() => window.location.href = "/constituents/new"}
      />
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pre-recording / Idle State */}
      {state === "idle" && (
        <div className="flex flex-col items-center py-8 space-y-6">
          <div className="space-y-4 w-full max-w-sm">
            <div>
              <Label htmlFor="event-name">Event Name (optional)</Label>
              <Input
                id="event-name"
                placeholder="e.g., Minnesota Nonprofit Conference"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="mt-1"
              />
            </div>

            {initialContactName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <User className="w-4 h-4" />
                <span>Adding note for: <strong>{initialContactName}</strong></span>
              </div>
            )}
          </div>

          <button
            onClick={handleStartRecording}
            aria-label="Start voice recording"
            className="w-32 h-32 rounded-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 flex items-center justify-center transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[hsl(var(--primary))]/30"
          >
            <Mic className="w-16 h-16 text-primary-foreground" aria-hidden="true" />
          </button>

          <p className="text-muted-foreground text-center" id="recording-hint">
            Tap to start recording
          </p>

          <div className="bg-muted/50 rounded-lg p-4 max-w-sm">
            <p className="text-sm text-muted-foreground">
              <strong>Tip:</strong> Speak naturally. Mention names, organizations, and any follow-up actions you need to take.
            </p>
          </div>

          <KeyboardShortcutsHint isRecording={false} />
        </div>
      )}

      {/* Recording State */}
      {state === "recording" && (
        <div className="flex flex-col items-center py-8 space-y-6">
          {/* Pulsing Mic Button */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-destructive/20 animate-ping" />
            <div className="absolute inset-[-8px] rounded-full border-4 border-destructive/50 animate-pulse" />
            <button
              onClick={handleStopRecording}
              aria-label="Stop recording"
              className="relative w-32 h-32 rounded-full bg-destructive hover:bg-destructive/90 flex items-center justify-center transition-all focus:outline-none focus:ring-4 focus:ring-destructive/30"
            >
              <Square className="w-12 h-12 text-destructive-foreground" aria-hidden="true" />
            </button>
          </div>

          {/* Duration Timer */}
          <div className="text-3xl font-mono font-bold text-foreground">
            {formatDuration(duration)}
          </div>

          {/* Audio Waveform */}
          <div className="flex items-center justify-center gap-1 h-16">
            {waveformBars.map((height, i) => (
              <div
                key={i}
                className="w-1.5 bg-destructive rounded-full transition-all duration-75"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>

          <p className="text-muted-foreground">Tap to stop recording</p>

          {/* Live Transcript Preview */}
          {(transcript || interimTranscript) && (
            <div className="w-full max-w-md p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Live transcript:</p>
              <p className="text-sm">
                {transcript}
                <span className="text-muted-foreground italic">{interimTranscript}</span>
              </p>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={handleCancelRecording}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>

          <KeyboardShortcutsHint isRecording={true} />
        </div>
      )}

      {/* Processing State */}
      {state === "processing" && (
        <div className="flex flex-col items-center py-12 space-y-6">
          {/* Animated waveform processing indicator */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center gap-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${16 + Math.sin(i * 0.8) * 20}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "0.6s",
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-lg font-medium" role="status" aria-live="polite">
              {processingStep}
            </p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>

          {transcript && (
            <Card className="w-full max-w-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{transcript}</p>
              </CardContent>
            </Card>
          )}

          <div className="w-full max-w-md space-y-3">
            <Skeleton className="h-20 w-full animate-pulse" />
            <Skeleton className="h-16 w-full animate-pulse" />
            <Skeleton className="h-16 w-full animate-pulse" />
          </div>
        </div>
      )}

      {/* Review State */}
      {state === "review" && (
        <ScrollArea className="h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Transcript */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Transcript
                </CardTitle>
                <CardDescription>Edit if needed</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  className="min-h-[100px]"
                />
              </CardContent>
            </Card>

            {/* Contacts Found */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Contacts Found
                  <Badge variant="secondary">{contacts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No contacts detected in transcript.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {contacts.map((contact, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border",
                          contact.included ? "bg-background" : "bg-muted/50 opacity-60"
                        )}
                      >
                        <Checkbox
                          checked={contact.included}
                          onCheckedChange={(checked) => {
                            setContacts(prev =>
                              prev.map((c, idx) =>
                                idx === i ? { ...c, included: !!checked } : c
                              )
                            );
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{contact.name}</span>
                            <Badge variant={contact.isNew ? "default" : "secondary"} className="text-xs">
                              {contact.isNew ? "New" : "Existing Match"}
                            </Badge>
                            {contact.confidence >= 0.8 && (
                              <Badge variant="outline" className="text-xs text-green-600">
                                High confidence
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {[contact.title, contact.organization].filter(Boolean).join(" at ")}
                          </p>
                          {contact.email && <p className="text-xs text-muted-foreground">{contact.email}</p>}
                          {contact.phone && <p className="text-xs text-muted-foreground">{contact.phone}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next Steps Found */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListTodo className="w-4 h-4" />
                  Next Steps
                  <Badge variant="secondary">{nextSteps.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nextSteps.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No action items detected. Try mentioning follow-up tasks explicitly.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {nextSteps.map((step, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border",
                          step.included ? "bg-background" : "bg-muted/50 opacity-60"
                        )}
                      >
                        <Checkbox
                          checked={step.included}
                          onCheckedChange={(checked) => {
                            setNextSteps(prev =>
                              prev.map((s, idx) =>
                                idx === i ? { ...s, included: !!checked } : s
                              )
                            );
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{step.action}</p>
                          {step.contactName && (
                            <p className="text-sm text-muted-foreground">
                              Related to: {step.contactName}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {step.suggestedDueDate && (
                              <Badge variant="outline" className="text-xs">
                                Due: {new Date(step.suggestedDueDate).toLocaleDateString()}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                step.priority === "high" && "border-destructive text-destructive",
                                step.priority === "medium" && "border-yellow-500 text-yellow-600",
                                step.priority === "low" && "border-green-500 text-green-600"
                              )}
                            >
                              {step.priority}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Found */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes to Add
                  <Badge variant="secondary">{notes.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No specific notes detected.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border",
                          note.included ? "bg-background" : "bg-muted/50 opacity-60"
                        )}
                      >
                        <Checkbox
                          checked={note.included}
                          onCheckedChange={(checked) => {
                            setNotes(prev =>
                              prev.map((n, idx) =>
                                idx === i ? { ...n, included: !!checked } : n
                              )
                            );
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{note.contactName}</p>
                          <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 pb-8">
              <Button
                variant="outline"
                onClick={handleDiscard}
                className="flex-1"
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Discard
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Save All
              </Button>
            </div>
          </div>
        </ScrollArea>
      )}

      {/* Success State */}
      {state === "success" && saveResult && (
        <div className="flex flex-col items-center py-12 space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">Voice Note Saved!</h3>
            <p className="text-muted-foreground">
              Your networking notes have been processed and saved.
            </p>
          </div>

          {/* Summary */}
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6 space-y-3">
              {saveResult.createdContactIds.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">New contacts created</span>
                  </div>
                  <Badge>{saveResult.createdContactIds.length}</Badge>
                </div>
              )}
              {saveResult.updatedContactIds.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Contacts updated</span>
                  </div>
                  <Badge variant="secondary">{saveResult.updatedContactIds.length}</Badge>
                </div>
              )}
              {saveResult.notesAdded > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Notes added</span>
                  </div>
                  <Badge variant="secondary">{saveResult.notesAdded}</Badge>
                </div>
              )}
              {saveResult.createdNextStepIds.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Follow-ups created</span>
                  </div>
                  <Badge variant="secondary">{saveResult.createdNextStepIds.length}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 w-full max-w-sm">
            {saveResult.createdContactIds.length > 0 && (
              <Button variant="outline" asChild className="w-full">
                <Link to={`/constituents/${saveResult.createdContactIds[0]}`}>
                  <Users className="w-4 h-4 mr-2" />
                  View Created Contact{saveResult.createdContactIds.length > 1 ? "s" : ""}
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Link>
              </Button>
            )}
            
            {saveResult.createdNextStepIds.length > 0 && (
              <Button variant="outline" asChild className="w-full">
                <Link to="/voice-notes/next-steps">
                  <ListTodo className="w-4 h-4 mr-2" />
                  View Next Steps
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Link>
              </Button>
            )}

            <Button
              onClick={handleRecordAnother}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record Another
            </Button>

            <Button variant="ghost" asChild className="w-full">
              <Link to="/voice-notes">
                Done
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Cancel Recording Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Recording?</AlertDialogTitle>
            <AlertDialogDescription>
              This will discard your current recording and any captured audio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Recording</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelRecording} className="bg-destructive text-destructive-foreground">
              Cancel Recording
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discard Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Voice Note?</AlertDialogTitle>
            <AlertDialogDescription>
              This will discard all extracted contacts, next steps, and notes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard} className="bg-destructive text-destructive-foreground">
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
