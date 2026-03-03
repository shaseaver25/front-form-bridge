import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Check, 
  X, 
  Calendar, 
  Kanban, 
  Pencil, 
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useTranscriptTasks } from '@/hooks/useTranscriptTasks';
import type { MeetingTranscriptTask } from '@/hooks/useMeetingTranscripts';
import { AddToCalendarDialog } from './AddToCalendarDialog';
import { AddToBoardDialog } from './AddToBoardDialog';

interface TranscriptTaskListProps {
  tasks: MeetingTranscriptTask[];
  transcriptId: string;
}

export function TranscriptTaskList({ tasks, transcriptId }: TranscriptTaskListProps) {
  const { approveTask, dismissTask, updateTask, bulkApprove, bulkDismiss, isApproving } = useTranscriptTasks();
  
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<MeetingTranscriptTask>>({});
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [calendarDialogTask, setCalendarDialogTask] = useState<MeetingTranscriptTask | null>(null);
  const [boardDialogTask, setBoardDialogTask] = useState<MeetingTranscriptTask | null>(null);
  const [expanded, setExpanded] = useState(true);

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const otherTasks = tasks.filter(t => t.status !== 'pending');

  const handleEdit = (task: MeetingTranscriptTask) => {
    setEditingTaskId(task.id);
    setEditValues({
      task_text: task.task_text,
      due_date: task.due_date,
      priority: task.priority,
    });
  };

  const handleSaveEdit = async (taskId: string) => {
    await updateTask({
      taskId,
      taskText: editValues.task_text,
      dueDate: editValues.due_date,
      priority: editValues.priority,
    });
    setEditingTaskId(null);
    setEditValues({});
  };

  const handleApprove = async (task: MeetingTranscriptTask) => {
    await approveTask({
      taskId: task.id,
      dueDate: task.due_date || undefined,
      priority: task.priority,
    });
  };

  const handleApproveWithCalendar = (task: MeetingTranscriptTask) => {
    setCalendarDialogTask(task);
  };

  const handleApproveWithBoard = (task: MeetingTranscriptTask) => {
    setBoardDialogTask(task);
  };

  const handleBulkApprove = async () => {
    if (selectedTasks.size === 0) return;
    await bulkApprove(Array.from(selectedTasks));
    setSelectedTasks(new Set());
  };

  const handleBulkDismiss = async () => {
    if (selectedTasks.size === 0) return;
    await bulkDismiss(Array.from(selectedTasks));
    setSelectedTasks(new Set());
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTasks.size === pendingTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(pendingTasks.map(t => t.id)));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'dismissed': return 'bg-gray-400';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-yellow-500';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Extracted Tasks
            <Badge variant="outline">{pendingTasks.length} pending</Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Bulk actions */}
          {pendingTasks.length > 0 && (
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                checked={selectedTasks.size === pendingTasks.length && pendingTasks.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {selectedTasks.size > 0 ? `${selectedTasks.size} selected` : 'Select all'}
              </span>
              {selectedTasks.size > 0 && (
                <>
                  <Button size="sm" variant="outline" onClick={handleBulkApprove}>
                    <Check className="h-3 w-3 mr-1" />
                    Approve All
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBulkDismiss}>
                    <X className="h-3 w-3 mr-1" />
                    Dismiss All
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Pending tasks */}
          {pendingTasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Checkbox
                checked={selectedTasks.has(task.id)}
                onCheckedChange={() => toggleTaskSelection(task.id)}
              />
              
              <div className="flex-1 min-w-0">
                {editingTaskId === task.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editValues.task_text || ''}
                      onChange={(e) => setEditValues({ ...editValues, task_text: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={editValues.due_date || ''}
                        onChange={(e) => setEditValues({ ...editValues, due_date: e.target.value })}
                        className="w-40"
                      />
                      <Select
                        value={editValues.priority}
                        onValueChange={(v) => setEditValues({ ...editValues, priority: v as MeetingTranscriptTask['priority'] })}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={() => handleSaveEdit(task.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingTaskId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium">{task.task_text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground">
                          Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {editingTaskId !== task.id && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(task)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleApprove(task)}
                    disabled={isApproving}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleApproveWithCalendar(task)}
                  >
                    <Calendar className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleApproveWithBoard(task)}
                  >
                    <Kanban className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissTask(task.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Processed tasks */}
          {otherTasks.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Processed Tasks</h4>
              {otherTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 py-2 opacity-60">
                  <div className={`h-2 w-2 rounded-full ${getStatusColor(task.status)}`} />
                  <span className="text-sm flex-1">{task.task_text}</span>
                  <Badge variant="outline" className="text-xs">
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tasks extracted from this transcript yet.
            </p>
          )}
        </CardContent>
      )}

      {calendarDialogTask && (
        <AddToCalendarDialog
          open={!!calendarDialogTask}
          onOpenChange={(open) => !open && setCalendarDialogTask(null)}
          task={calendarDialogTask}
        />
      )}

      {boardDialogTask && (
        <AddToBoardDialog
          open={!!boardDialogTask}
          onOpenChange={(open) => !open && setBoardDialogTask(null)}
          task={boardDialogTask}
        />
      )}
    </Card>
  );
}
