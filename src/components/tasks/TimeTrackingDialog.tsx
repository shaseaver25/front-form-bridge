import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLogTaskTime } from "@/hooks/useUnifiedTasks";
import { useToast } from "@/hooks/use-toast";
import { Clock, Plus } from "lucide-react";
import { format } from "date-fns";

interface TimeTrackingDialogProps {
  taskId: string | null;
  onClose: () => void;
}

export function TimeTrackingDialog({ taskId, onClose }: TimeTrackingDialogProps) {
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const logTime = useLogTaskTime();
  const { toast } = useToast();

  const { data: task } = useQuery({
    queryKey: ["task-time-detail", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const { data, error } = await supabase
        .from("unified_tasks")
        .select("id, title, actual_time_minutes")
        .eq("id", taskId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  const { data: timeEntries } = useQuery({
    queryKey: ["task-time-entries", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from("task_time_entries")
        .select("*")
        .eq("unified_task_id", taskId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    
    if (totalMinutes <= 0) {
      toast({ title: "Please enter a valid time", variant: "destructive" });
      return;
    }

    try {
      await logTime.mutateAsync({
        taskId: taskId!,
        minutes: totalMinutes,
        notes: notes.trim() || undefined,
      });
      
      toast({ title: "Time logged successfully" });
      setHours("");
      setMinutes("");
      setNotes("");
    } catch (error) {
      toast({ 
        title: "Error logging time", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <Dialog open={!!taskId} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Log Time
          </DialogTitle>
        </DialogHeader>

        {task && (
          <div className="space-y-4">
            <div>
              <p className="font-medium">{task.title}</p>
              <p className="text-sm text-muted-foreground">
                Total logged: {formatDuration(task.actual_time_minutes || 0)}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours">Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="0"
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
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What did you work on?"
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full" disabled={logTime.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                {logTime.isPending ? "Logging..." : "Log Time"}
              </Button>
            </form>

            {timeEntries && timeEntries.length > 0 && (
              <div className="space-y-2">
                <Label>Previous Entries</Label>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {timeEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm"
                    >
                      <div>
                        <span className="font-medium">
                          {formatDuration(entry.duration_minutes || 0)}
                        </span>
                        {entry.notes && (
                          <span className="text-muted-foreground ml-2">- {entry.notes}</span>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {format(new Date(entry.created_at), "MMM d")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
