import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useMeetingTranscripts } from '@/hooks/useMeetingTranscripts';

interface TranscriptUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TranscriptUploadDialog({ open, onOpenChange }: TranscriptUploadDialogProps) {
  const { uploadTranscript, createManualTranscript, isUploading, isCreating } = useMeetingTranscripts();
  
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState('');
  const [fileMeetingDate, setFileMeetingDate] = useState('');
  const [fileParticipants, setFileParticipants] = useState('');
  
  // Manual entry state
  const [manualTitle, setManualTitle] = useState('');
  const [manualMeetingDate, setManualMeetingDate] = useState('');
  const [manualParticipants, setManualParticipants] = useState('');
  const [manualTranscript, setManualTranscript] = useState('');
  const [manualDuration, setManualDuration] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      // Auto-fill title from filename
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setFileTitle(nameWithoutExt);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  const handleFileUpload = async () => {
    if (!file || !fileTitle || !fileMeetingDate) return;

    const participants = fileParticipants
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    await uploadTranscript({
      file,
      title: fileTitle,
      meetingDate: fileMeetingDate,
      participants,
    });

    resetForm();
    onOpenChange(false);
  };

  const handleManualSubmit = async () => {
    if (!manualTitle || !manualMeetingDate || !manualTranscript) return;

    const participants = manualParticipants
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    await createManualTranscript({
      title: manualTitle,
      meetingDate: manualMeetingDate,
      transcriptText: manualTranscript,
      participants,
      durationMinutes: manualDuration ? parseInt(manualDuration) : undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setFile(null);
    setFileTitle('');
    setFileMeetingDate('');
    setFileParticipants('');
    setManualTitle('');
    setManualMeetingDate('');
    setManualParticipants('');
    setManualTranscript('');
    setManualDuration('');
  };

  const isLoading = isUploading || isCreating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Meeting Transcript</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </TabsTrigger>
            <TabsTrigger value="manual">
              <FileText className="h-4 w-4 mr-2" />
              Paste Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <span className="font-medium">{file.name}</span>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {isDragActive ? 'Drop the file here' : 'Drag and drop a PDF, or click to select'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Supports PDF and TXT files</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="file-title">Meeting Title *</Label>
                <Input
                  id="file-title"
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                  placeholder="Weekly Team Sync"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file-date">Meeting Date *</Label>
                <Input
                  id="file-date"
                  type="datetime-local"
                  value={fileMeetingDate}
                  onChange={(e) => setFileMeetingDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-participants">Participants (comma-separated)</Label>
              <Input
                id="file-participants"
                value={fileParticipants}
                onChange={(e) => setFileParticipants(e.target.value)}
                placeholder="John Doe, jane@example.com, Shannon"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleFileUpload} 
                disabled={!file || !fileTitle || !fileMeetingDate || isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Upload & Process
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manual-title">Meeting Title *</Label>
                <Input
                  id="manual-title"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Board Meeting"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-date">Meeting Date *</Label>
                <Input
                  id="manual-date"
                  type="datetime-local"
                  value={manualMeetingDate}
                  onChange={(e) => setManualMeetingDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manual-participants">Participants (comma-separated)</Label>
                <Input
                  id="manual-participants"
                  value={manualParticipants}
                  onChange={(e) => setManualParticipants(e.target.value)}
                  placeholder="John, Jane, Shannon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-duration">Duration (minutes)</Label>
                <Input
                  id="manual-duration"
                  type="number"
                  value={manualDuration}
                  onChange={(e) => setManualDuration(e.target.value)}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-transcript">Transcript Text *</Label>
              <Textarea
                id="manual-transcript"
                value={manualTranscript}
                onChange={(e) => setManualTranscript(e.target.value)}
                placeholder="Paste the meeting transcript here..."
                rows={10}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleManualSubmit} 
                disabled={!manualTitle || !manualMeetingDate || !manualTranscript || isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save & Process
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
