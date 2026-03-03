import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, FileAudio, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranscriptTasks } from '@/hooks/useTranscriptTasks';
import { format } from 'date-fns';

export function PendingTranscriptTasksWidget() {
  const navigate = useNavigate();
  const { pendingTasks, isLoadingPending, approveTask, dismissTask } = useTranscriptTasks();

  const displayTasks = pendingTasks.slice(0, 5);

  if (isLoadingPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileAudio className="h-5 w-5" />
            Meeting Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileAudio className="h-5 w-5" />
            Meeting Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No pending tasks from meeting transcripts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileAudio className="h-5 w-5" />
            Meeting Tasks
            <Badge variant="secondary">{pendingTasks.length}</Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/meetings/transcripts')}
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.task_text}</p>
                <p className="text-xs text-muted-foreground">
                  From: {task.transcript?.title || 'Unknown meeting'}
                  {task.due_date && (
                    <> • Due: {format(new Date(task.due_date), 'MMM d')}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => approveTask({ taskId: task.id })}
                >
                  <Check className="h-3 w-3 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => dismissTask(task.id)}
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
