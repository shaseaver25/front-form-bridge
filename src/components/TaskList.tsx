import { useState, useEffect, useCallback } from "react";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { CheckCircle2, Clock, Loader2, AlertCircle, User, Plus, LucideIcon } from "lucide-react";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import TaskForm from "@/components/TaskForm";

interface TaskListProps {
  grantId?: string;
  showAll?: boolean;
}

type Task = Record<string, any> & {
  grant_opportunities?: {
    title: string;
    organizations?: { name: string } | null;
  } | null;
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const TaskList = ({ grantId, showAll = false }: TaskListProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const { members, getDisplayName, getMemberById } = useTeamMembers();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("tasks")
      .select(
        `
        *,
        grant_opportunities (
          title,
          organizations (name)
        )
      `
      )
      .order("created_at", { ascending: false });

    if (grantId) {
      query = query.eq("related_grant_opportunity_id", grantId);
    }

    if (!showAll) {
      query = query.neq("status", "completed");
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to load tasks");
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  }, [grantId, showAll]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);

    if (error) {
      toast.error("Failed to update task");
    } else {
      toast.success("Task updated");
      fetchTasks();
    }
  };

  const handleAssigneeChange = async (taskId: string, assigneeId: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ assigned_to: assigneeId === "__unassigned__" ? null : assigneeId })
      .eq("id", taskId);

    if (error) {
      toast.error("Failed to update assignee");
    } else {
      toast.success("Assignee updated");
      fetchTasks();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: BadgeVariant; icon: LucideIcon; label: string }> = {
      pending: { variant: "outline", icon: Clock, label: "Pending" },
      in_progress: { variant: "secondary", icon: AlertCircle, label: "In Progress" },
      completed: { variant: "default", icon: CheckCircle2, label: "Completed" },
      cancelled: { variant: "destructive", icon: AlertCircle, label: "Cancelled" },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No deadline";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "completed" || status === "cancelled") return false;
    return new Date(dueDate) < new Date();
  };

  const getInitials = (member: TeamMember): string => {
    const first = member?.first_name?.[0] || "";
    const last = member?.last_name?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const renderAssignee = (task: Task) => {
    const assignee = task.assigned_to ? getMemberById(task.assigned_to) : null;

    return (
      <Select
        value={task.assigned_to || "__unassigned__"}
        onValueChange={(value) => handleAssigneeChange(task.id, value)}
      >
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue>
            {assignee ? (
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {getInitials(assignee)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{getDisplayName(assignee)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>Unassigned</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__unassigned__">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>Unassigned</span>
            </div>
          </SelectItem>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {getInitials(member)}
                  </AvatarFallback>
                </Avatar>
                <span>{getDisplayName(member)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center" role="status" aria-label="Loading">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Tasks {!showAll && "(Active)"}</CardTitle>
          <Button size="sm" onClick={() => setShowNewTaskModal(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Task
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No tasks to display</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                  isOverdue(task.due_date, task.status)
                    ? "border-destructive bg-destructive/5"
                    : "bg-card"
                }`}
                onClick={() => setEditingTask(task)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.status === "completed"}
                    onCheckedChange={(checked) => {
                      handleStatusChange(task.id, checked ? "completed" : "pending");
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground">{task.description}</p>
                        )}
                        {task.grant_opportunities && (
                          <p className="text-xs text-muted-foreground">
                            Grant: {task.grant_opportunities.title}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(task.status)}
                    </div>
                    <div className="flex items-center gap-4 text-xs flex-wrap">
                      <span
                        className={
                          isOverdue(task.due_date, task.status)
                            ? "text-destructive font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        Due: {formatDate(task.due_date)}
                      </span>
                      <div onClick={(e) => e.stopPropagation()}>{renderAssignee(task)}</div>
                      {task.depends_on_task_id && (
                        <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                          ⚠️ Depends on another task
                        </span>
                      )}
                      {task.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(task.id, "in_progress");
                          }}
                        >
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={showNewTaskModal} onOpenChange={setShowNewTaskModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            grantId={grantId}
            onSuccess={() => {
              setShowNewTaskModal(false);
              fetchTasks();
            }}
            onCancel={() => setShowNewTaskModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              task={editingTask as any}
              onSuccess={() => {
                setEditingTask(null);
                fetchTasks();
              }}
              onCancel={() => setEditingTask(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskList;
