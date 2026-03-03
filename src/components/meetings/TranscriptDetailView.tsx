import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Users, 
  Calendar,
  Search,
  ExternalLink,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TranscriptTaskList } from './TranscriptTaskList';
import type { MeetingTranscript, MeetingTranscriptTask, MeetingTranscriptConstituent } from '@/hooks/useMeetingTranscripts';

interface TranscriptDetailViewProps {
  transcript: MeetingTranscript;
  tasks: MeetingTranscriptTask[];
  constituents: MeetingTranscriptConstituent[];
}

export function TranscriptDetailView({ transcript, tasks, constituents }: TranscriptDetailViewProps) {
  const navigate = useNavigate();
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTranscript = searchQuery
    ? transcript.transcript_text
        .split('\n')
        .filter(line => line.toLowerCase().includes(searchQuery.toLowerCase()))
        .join('\n')
    : transcript.transcript_text;

  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark>
        : part
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">{transcript.title}</h1>
                  <Badge variant={transcript.source === 'fireflies' ? 'default' : 'secondary'}>
                    {transcript.source === 'fireflies' ? 'Fireflies' : 'Uploaded'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(transcript.meeting_date), 'MMMM d, yyyy h:mm a')}
                  </span>
                  {transcript.duration_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {transcript.duration_minutes} minutes
                    </span>
                  )}
                  {transcript.participants && transcript.participants.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {transcript.participants.length} participants
                    </span>
                  )}
                </div>
              </div>
              {transcript.original_file_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={transcript.original_file_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />
                    Original File
                  </a>
                </Button>
              )}
            </div>

            {/* Participants */}
            {transcript.participants && transcript.participants.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {transcript.participants.map((participant, i) => (
                  <Badge key={i} variant="outline">
                    {participant}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Summary */}
        {transcript.summary && (
          <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
            <Card>
              <CardHeader className="pb-3">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <CardTitle className="text-lg">AI Summary</CardTitle>
                    {summaryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {transcript.summary}
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Full Transcript */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Full Transcript</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transcript..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {searchQuery ? (
                  filteredTranscript.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{highlightText(line)}</p>
                  ))
                ) : (
                  transcript.transcript_text
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Tasks */}
        <TranscriptTaskList tasks={tasks} transcriptId={transcript.id} />
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Linked Constituents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Linked Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            {constituents.length > 0 ? (
              <div className="space-y-2">
                {constituents.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => navigate(`/constituents/${link.constituent_id}`)}
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {link.constituent?.full_legal_name || 'Unknown'}
                      </p>
                      {link.constituent?.primary_email && (
                        <p className="text-xs text-muted-foreground">
                          {link.constituent.primary_email}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {link.match_type}
                      </Badge>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No contacts linked to this transcript.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Task Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Task Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {tasks.filter(t => t.status === 'pending').length}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {tasks.filter(t => t.status === 'approved').length}
                </p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {tasks.filter(t => t.status === 'completed').length}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">
                  {tasks.filter(t => t.status === 'dismissed').length}
                </p>
                <p className="text-xs text-muted-foreground">Dismissed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
