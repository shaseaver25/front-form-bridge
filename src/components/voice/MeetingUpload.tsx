import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  FileAudio,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  DollarSign,
  HelpCircle,
  Users,
  ListTodo,
  ClipboardPaste,
} from "lucide-react";
import { useMeetingUpload } from "@/hooks/useMeetingUpload";
import { useVoiceNoteSave } from "@/hooks/useVoiceNoteSave";
import { format } from "date-fns";

const SUPPORTED_AUDIO_FORMATS = ['mp3', 'm4a', 'wav', 'mp4', 'webm', 'mpeg', 'mpga'];
const SUPPORTED_TRANSCRIPT_FORMATS = ['txt', 'srt', 'vtt', 'doc', 'docx'];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

type InputMode = 'audio' | 'transcript-file' | 'transcript-paste';

interface MeetingUploadProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function MeetingUpload({ onComplete, onCancel }: MeetingUploadProps) {
  const [inputMode, setInputMode] = useState<InputMode>('audio');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedTranscript, setPastedTranscript] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendees, setAttendees] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);

  const {
    stage,
    uploadProgress,
    transcript,
    processedData,
    recordingId,
    error,
    estimatedCost,
    uploadFile,
    processTranscript,
    reset,
    estimateCost,
  } = useMeetingUpload();

  const { saveVoiceNote, isSaving } = useVoiceNoteSave();

  const onDropAudio = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
    }
  }, []);

  const onDropTranscript = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
      
      // Read text file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          setPastedTranscript(content);
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps: getAudioRootProps, getInputProps: getAudioInputProps, isDragActive: isAudioDragActive } = useDropzone({
    onDrop: onDropAudio,
    accept: {
      'audio/*': ['.mp3', '.m4a', '.wav', '.webm'],
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm'],
    },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
  });

  const { getRootProps: getTranscriptRootProps, getInputProps: getTranscriptInputProps, isDragActive: isTranscriptDragActive } = useDropzone({
    onDrop: onDropTranscript,
    accept: {
      'text/plain': ['.txt'],
      'text/srt': ['.srt'],
      'text/vtt': ['.vtt'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!title.trim()) return;

    if (inputMode === 'audio' && selectedFile) {
      await uploadFile(selectedFile, {
        title: title.trim(),
        date,
        attendees: attendees.trim() || undefined,
      });
    } else if ((inputMode === 'transcript-file' || inputMode === 'transcript-paste') && pastedTranscript.trim()) {
      await processTranscript(pastedTranscript.trim(), {
        title: title.trim(),
        date,
        attendees: attendees.trim() || undefined,
      });
    }
  };

  const handleSave = async () => {
    if (!transcript && !pastedTranscript) return;
    if (!processedData || !recordingId) return;

    await saveVoiceNote({
      transcript: transcript || pastedTranscript,
      processedData,
      eventName: title,
      durationSeconds: 0,
    });

    onComplete?.();
  };

  const handleReset = () => {
    reset();
    setSelectedFile(null);
    setPastedTranscript("");
    setTitle("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setAttendees("");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canSubmit = () => {
    if (!title.trim()) return false;
    if (inputMode === 'audio') return !!selectedFile;
    return pastedTranscript.trim().length > 50;
  };

  // Idle state - input mode selection
  if (stage === 'idle' && !selectedFile && !pastedTranscript) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Meeting Content
          </CardTitle>
          <CardDescription>
            Upload audio for transcription, or provide an existing transcript
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as InputMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="audio" className="flex items-center gap-1">
                <FileAudio className="w-4 h-4" />
                Audio
              </TabsTrigger>
              <TabsTrigger value="transcript-file" className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                File
              </TabsTrigger>
              <TabsTrigger value="transcript-paste" className="flex items-center gap-1">
                <ClipboardPaste className="w-4 h-4" />
                Paste
              </TabsTrigger>
            </TabsList>

            <TabsContent value="audio" className="mt-4">
              <div
                {...getAudioRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isAudioDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <input {...getAudioInputProps()} />
                <FileAudio className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                {isAudioDragActive ? (
                  <p className="text-lg font-medium">Drop the file here...</p>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">
                      Drag & drop a meeting recording
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Formats: {SUPPORTED_AUDIO_FORMATS.join(', ').toUpperCase()} • Max 500MB
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Will be transcribed using AI ($0.006/min)
                    </p>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="transcript-file" className="mt-4">
              <div
                {...getTranscriptRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isTranscriptDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <input {...getTranscriptInputProps()} />
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                {isTranscriptDragActive ? (
                  <p className="text-lg font-medium">Drop the transcript file here...</p>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">
                      Upload a transcript file
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Formats: TXT, SRT, VTT
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Free! Skip transcription costs entirely
                    </p>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="transcript-paste" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paste-title">Meeting Title *</Label>
                <Input
                  id="paste-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Donor Strategy Meeting"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paste-transcript">Paste Transcript *</Label>
                <Textarea
                  id="paste-transcript"
                  value={pastedTranscript}
                  onChange={(e) => setPastedTranscript(e.target.value)}
                  placeholder="Paste your meeting transcript here..."
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {pastedTranscript.length} characters • Free processing, no transcription cost
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paste-date">Meeting Date</Label>
                <Input
                  id="paste-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paste-attendees">Attendees (optional)</Label>
                <Input
                  id="paste-attendees"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  placeholder="John Smith, Jane Doe"
                />
              </div>
              <Button 
                onClick={handleUpload} 
                className="w-full"
                disabled={!canSubmit()}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Process Transcript
              </Button>
            </TabsContent>
          </Tabs>

          <Collapsible open={helpOpen} onOpenChange={setHelpOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  How to get transcripts
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${helpOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-3">
                <div>
                  <p className="font-medium">Zoom</p>
                  <p className="text-muted-foreground">Enable "Audio transcript" in settings. Download from cloud recordings.</p>
                </div>
                <div>
                  <p className="font-medium">Google Meet</p>
                  <p className="text-muted-foreground">Enable captions during meeting, or use Google Docs voice typing.</p>
                </div>
                <div>
                  <p className="font-medium">Microsoft Teams</p>
                  <p className="text-muted-foreground">Enable transcription. Download from meeting recap.</p>
                </div>
                <div>
                  <p className="font-medium">Otter.ai / Rev / Other</p>
                  <p className="text-muted-foreground">Export transcript as .txt and upload or copy/paste.</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="w-full">
              Cancel
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // File selected - metadata form (for audio or transcript file)
  if (stage === 'idle' && (selectedFile || (inputMode === 'transcript-file' && pastedTranscript))) {
    const isAudioMode = inputMode === 'audio';
    const cost = selectedFile && isAudioMode ? estimateCost(selectedFile) : 0;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meeting Details</CardTitle>
          <CardDescription>
            {isAudioMode ? 'Review and add details before transcription' : 'Review and add details before processing'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File info */}
          {selectedFile && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {isAudioMode ? (
                <FileAudio className="w-8 h-8 text-primary" />
              ) : (
                <FileText className="w-8 h-8 text-primary" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {isAudioMode ? formatFileSize(selectedFile.size) : `${pastedTranscript.length} characters`}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => {
                setSelectedFile(null);
                setPastedTranscript("");
              }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Cost estimate - only for audio */}
          {isAudioMode && selectedFile && (
            <Alert>
              <DollarSign className="w-4 h-4" />
              <AlertDescription>
                Estimated transcription cost: <strong>${cost.toFixed(2)}</strong>
                {selectedFile.size > 25 * 1024 * 1024 && (
                  <span className="block text-muted-foreground mt-1">
                    Large files may take several minutes to process.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Free badge for transcript */}
          {!isAudioMode && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Free! Transcript provided—no transcription cost.
              </AlertDescription>
            </Alert>
          )}

          {/* Transcript preview for transcript file */}
          {!isAudioMode && pastedTranscript && (
            <div className="space-y-2">
              <Label>Transcript Preview</Label>
              <div className="max-h-32 overflow-y-auto bg-muted/50 rounded-lg p-3 text-sm font-mono">
                {pastedTranscript.slice(0, 500)}{pastedTranscript.length > 500 && '...'}
              </div>
            </div>
          )}

          {/* Metadata form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Donor Strategy Meeting"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Meeting Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendees">Attendees (optional)</Label>
              <Textarea
                id="attendees"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="John Smith, Jane Doe, mike@company.com"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated names or emails
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              className="flex-1"
              disabled={!title.trim()}
            >
              {isAudioMode ? (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Transcribe
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Process Transcript
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Uploading state
  if (stage === 'uploading') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Uploading...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-center text-muted-foreground">
            Uploading file... {uploadProgress}%
          </p>
        </CardContent>
      </Card>
    );
  }

  // Transcribing state
  if (stage === 'transcribing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Transcribing Audio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Converting speech to text...</p>
              <p className="text-sm text-muted-foreground mt-2">
                This may take a few minutes for longer recordings
              </p>
              {estimatedCost && (
                <Badge variant="secondary" className="mt-4">
                  Est. cost: ${estimatedCost.toFixed(2)}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Processing state
  if (stage === 'processing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing Transcript
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Extracting contacts and action items...</p>
              <p className="text-sm text-muted-foreground mt-2">
                AI is analyzing the meeting transcript
              </p>
            </div>
          </div>
          {transcript && (
            <div className="max-h-32 overflow-y-auto bg-muted/50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">{transcript.slice(0, 500)}...</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Review state
  if (stage === 'review' && processedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Review Extracted Data
          </CardTitle>
          <CardDescription>
            Review what was extracted from your meeting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {processedData.contacts.length} Contacts
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <ListTodo className="w-3 h-3" />
              {processedData.nextSteps.length} Action Items
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {processedData.notes.length} Notes
            </Badge>
          </div>

          {/* Contacts */}
          {processedData.contacts.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Contacts
              </h4>
              <div className="space-y-2">
                {processedData.contacts.map((contact, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      {contact.organization && (
                        <p className="text-sm text-muted-foreground">{contact.organization}</p>
                      )}
                    </div>
                    <Badge variant={contact.isNew ? "default" : "secondary"}>
                      {contact.isNew ? "New" : "Existing"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          {processedData.nextSteps.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <ListTodo className="w-4 h-4" />
                Action Items
              </h4>
              <div className="space-y-2">
                {processedData.nextSteps.map((step, i) => (
                  <div key={i} className="p-2 bg-muted/50 rounded-lg">
                    <p className="font-medium">{step.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {step.contactName && (
                        <span className="text-sm text-muted-foreground">
                          For: {step.contactName}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {step.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcript preview */}
          {transcript && (
            <div>
              <h4 className="font-medium mb-2">Transcript</h4>
              <div className="max-h-40 overflow-y-auto bg-muted/50 rounded-lg p-3 text-sm">
                <p className="whitespace-pre-wrap">{transcript}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Discard
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save to CRM
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (stage === 'error') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            Upload Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error || 'An unknown error occurred'}</AlertDescription>
          </Alert>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleReset} className="flex-1">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
