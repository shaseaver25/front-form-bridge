import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserCircle } from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";

interface ReassignTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle: string;
  currentAssignee?: string | null;
  onSuccess?: () => void;
}

export function ReassignTaskDialog({
  open,
  onOpenChange,
  taskId,
  taskTitle,
  currentAssignee,
  onSuccess,
}: ReassignTaskDialogProps) {
  const [assignedTo, setAssignedTo] = useState<string>(currentAssignee || "__unassigned__");
  const [submitting, setSubmitting] = useState(false);
  const { members, loading: loadingMembers, getDisplayName } = useTeamMembers();

  const handleReassign = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ assigned_to: assignedTo === "__unassigned__" ? null : assignedTo })
        .eq("id", taskId);

      if (error) throw error;
      
      toast.success("Task reassigned successfully");
      onSuccess?.();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to reassign task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Reassign Task</DialogTitle>
          <DialogDescription className="truncate">
            {taskTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder={loadingMembers ? "Loading..." : "Select team member"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned__">Unassigned</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4" />
                      {getDisplayName(member)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleReassign} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Reassign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
