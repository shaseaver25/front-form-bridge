import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Users, ListTodo, Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MeetingTranscript } from '@/hooks/useMeetingTranscripts';

interface TranscriptCardProps {
  transcript: MeetingTranscript;
  pendingTaskCount?: number;
  approvedTaskCount?: number;
  onDelete?: () => void;
}

export function TranscriptCard({ 
  transcript, 
  pendingTaskCount = 0, 
  approvedTaskCount = 0,
  onDelete 
}: TranscriptCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{transcript.title}</h3>
              <Badge variant={transcript.source === 'fireflies' ? 'default' : 'secondary'}>
                {transcript.source === 'fireflies' ? 'Fireflies' : 'Uploaded'}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {format(new Date(transcript.meeting_date), 'MMMM d, yyyy h:mm a')}
              {transcript.duration_minutes && ` • ${transcript.duration_minutes} min`}
            </p>

            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              {transcript.participants && transcript.participants.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {transcript.participants.length} participants
                </span>
              )}
              
              {(pendingTaskCount > 0 || approvedTaskCount > 0) && (
                <span className="flex items-center gap-1">
                  <ListTodo className="h-4 w-4" />
                  {pendingTaskCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {pendingTaskCount} pending
                    </Badge>
                  )}
                  {approvedTaskCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {approvedTaskCount} approved
                    </Badge>
                  )}
                </span>
              )}
            </div>

            {transcript.summary && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {transcript.summary}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/meetings/transcripts/${transcript.id}`)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
