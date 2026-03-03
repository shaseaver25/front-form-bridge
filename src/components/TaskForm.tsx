import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserCircle } from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";

interface TaskFormProps {
  task?: {
    id: string;
    title: string;
    description?: string | null;
    due_date?: string | null;
    status: string;
    assigned_to?: string | null;
    related_grant_opportunity_id?: string | null;
  };
  grantId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TaskForm = ({ task, grantId, onSuccess, onCancel }: TaskFormProps) => {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [dueDate, setDueDate] = useState(task?.due_date || "");
  const [status, setStatus] = useState(task?.status || "pending");
  const [assignedTo, setAssignedTo] = useState<string>(task?.assigned_to || "__unassigned__");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { members, loading: loadingMembers, getDisplayName } = useTeamMembers();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      
      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate || null,
        status,
        assigned_to: assignedTo === "__unassigned__" ? null : assignedTo,
        related_grant_opportunity_id: grantId || task?.related_grant_opportunity_id || null,
        ...(task ? {} : { created_by: user?.user?.id }),
      };

      if (task) {
        const { error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", task.id);

        if (error) throw error;
        toast.success("Task updated successfully");
      } else {
        const { error } = await supabase.from("tasks").insert(taskData);

        if (error) throw error;
        toast.success("Task created successfully");
      }

      onSuccess?.();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter task description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignedTo">Assign To</Label>
        <Select value={assignedTo || "__unassigned__"} onValueChange={setAssignedTo}>
          <SelectTrigger>
            <SelectValue placeholder={loadingMembers ? "Loading..." : "Select team member"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__unassigned__">Unassigned</SelectItem>
            {currentUserId && (
              <SelectItem value={currentUserId}>
                <div className="flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-primary" />
                  Assign to me
                </div>
              </SelectItem>
            )}
            {members.filter(m => m.id !== currentUserId).map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {getDisplayName(member)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {task ? "Update Task" : "Create Task"}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;
