import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useTranscriptTasks } from '@/hooks/useTranscriptTasks';
import type { MeetingTranscriptTask } from '@/hooks/useMeetingTranscripts';
import { format } from 'date-fns';

interface AddToCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: MeetingTranscriptTask;
}

export function AddToCalendarDialog({ open, onOpenChange, task }: AddToCalendarDialogProps) {
  const { approveTask, isApproving } = useTranscriptTasks();
  
  const [title, setTitle] = useState(task.task_text);
  const [date, setDate] = useState(task.due_date || format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState('30');

  const handleSubmit = async () => {
    await approveTask({
      taskId: task.id,
      dueDate: date,
      priority: task.priority,
      addToCalendar: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Calendar</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cal-title">Event Title</Label>
            <Input
              id="cal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cal-date">Date</Label>
              <Input
                id="cal-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cal-time">Time</Label>
              <Input
                id="cal-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cal-duration">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isApproving}>
            {isApproving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
