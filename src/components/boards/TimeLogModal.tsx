import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TimeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (minutes: number, notes?: string) => Promise<void>;
  cardHeadline: string;
}

export function TimeLogModal({ isOpen, onClose, onSave, cardHeadline }: TimeLogModalProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
    if (totalMinutes <= 0) return;

    setIsSaving(true);
    try {
      await onSave(totalMinutes, notes || undefined);
      onClose();
      // Reset form
      setHours('0');
      setMinutes('30');
      setNotes('');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Log Time
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Logging time for: <span className="font-medium text-foreground">{cardHeadline}</span>
          </p>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                max="99"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setHours('0'); setMinutes('15'); }}
            >
              15m
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setHours('0'); setMinutes('30'); }}
            >
              30m
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setHours('1'); setMinutes('0'); }}
            >
              1h
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setHours('2'); setMinutes('0'); }}
            >
              2h
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setHours('4'); setMinutes('0'); }}
            >
              4h
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="What did you work on?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || (parseInt(hours) * 60 + parseInt(minutes)) <= 0}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
