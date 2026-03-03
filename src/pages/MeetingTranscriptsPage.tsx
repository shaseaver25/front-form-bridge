import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  FileAudio, 
  ListTodo, 
  Settings,
  Loader2
} from 'lucide-react';
import { useMeetingTranscripts } from '@/hooks/useMeetingTranscripts';
import { useTranscriptTasks } from '@/hooks/useTranscriptTasks';
import { TranscriptCard } from '@/components/meetings/TranscriptCard';
import { TranscriptUploadDialog } from '@/components/meetings/TranscriptUploadDialog';
import { TranscriptDetailView } from '@/components/meetings/TranscriptDetailView';
import { TranscriptTaskList } from '@/components/meetings/TranscriptTaskList';
import { FirefliesConnectionCard } from '@/components/meetings/FirefliesConnectionCard';

export default function MeetingTranscriptsPage() {
  const { transcriptId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { 
    transcripts, 
    isLoading, 
    deleteTranscript,
    getTranscript,
    getTranscriptTasks,
    getTranscriptConstituents,
  } = useMeetingTranscripts();

  const { pendingTasks } = useTranscriptTasks();

  // If viewing a specific transcript
  const transcriptQuery = getTranscript(transcriptId);
  const tasksQuery = getTranscriptTasks(transcriptId);
  const constituentsQuery = getTranscriptConstituents(transcriptId);

  if (transcriptId) {
    if (transcriptQuery.isLoading || tasksQuery.isLoading || constituentsQuery.isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!transcriptQuery.data) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Transcript not found.</p>
        </div>
      );
    }

    return (
      <TranscriptDetailView
        transcript={transcriptQuery.data}
        tasks={tasksQuery.data || []}
        constituents={constituentsQuery.data || []}
      />
    );
  }

  const filteredTranscripts = transcripts.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.participants?.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meeting Transcripts</h1>
            <p className="text-muted-foreground">
              Sync from Fireflies or upload meeting transcripts to extract action items
            </p>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transcript
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transcripts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transcripts" className="flex items-center gap-2">
              <FileAudio className="h-4 w-4" />
              All Transcripts
              <Badge variant="secondary">{transcripts.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Pending Tasks
              {pendingTasks.length > 0 && (
                <Badge variant="destructive">{pendingTasks.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* All Transcripts Tab */}
          <TabsContent value="transcripts" className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transcripts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredTranscripts.length > 0 ? (
              <div className="grid gap-4">
                {filteredTranscripts.map((transcript) => (
                  <TranscriptCard
                    key={transcript.id}
                    transcript={transcript}
                    onDelete={() => deleteTranscript(transcript.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileAudio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">No transcripts yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a transcript or connect Fireflies to get started.
                </p>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Transcript
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Pending Tasks Tab */}
          <TabsContent value="pending" className="space-y-4">
            {pendingTasks.length > 0 ? (
              <div className="space-y-4">
                {/* Group tasks by transcript */}
                {Object.entries(
                  pendingTasks.reduce((acc, task) => {
                    const key = task.transcript?.id || 'unknown';
                    if (!acc[key]) {
                      acc[key] = {
                        transcript: task.transcript,
                        tasks: [],
                      };
                    }
                    acc[key].tasks.push(task);
                    return acc;
                  }, {} as Record<string, { transcript: any; tasks: typeof pendingTasks }>)
                ).map(([key, { transcript, tasks }]) => (
                  <div key={key}>
                    <h3 className="font-medium mb-2">
                      {transcript?.title || 'Unknown Transcript'}
                    </h3>
                    <TranscriptTaskList 
                      tasks={tasks} 
                      transcriptId={transcript?.id || ''} 
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ListTodo className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">All caught up!</h3>
                <p className="text-sm text-muted-foreground">
                  No pending tasks from meeting transcripts.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <FirefliesConnectionCard />
          </TabsContent>
        </Tabs>
      </div>

      <TranscriptUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />
    </>
  );
}
