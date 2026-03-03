import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  Calendar, 
  User, 
  Link2, 
  MoreVertical,
  DollarSign,
  ExternalLink,
  Archive,
  ChevronRight,
  UserPlus,
  Kanban,
  Sparkles,
  ArrowUpDown
} from "lucide-react";
import { format, isToday, isPast, isFuture } from "date-fns";
import { useUnifiedTasks, useToggleTaskComplete, useUpdateTask } from "@/hooks/useUnifiedTasks";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useBoards } from "@/hooks/useBoardData";
import { useTaskROIEstimate } from "@/hooks/useTaskROIEstimate";
import { TimeTrackingDialog } from "./TimeTrackingDialog";
import { OutcomeAttributionDialog } from "./OutcomeAttributionDialog";
import { TaskROIBadge } from "./TaskROIBadge";
import { sourceIcons, priorityColors } from "@/types/unified-tasks";
import type { TaskFilters, UnifiedTask, TaskPriority, TaskSource } from "@/types/unified-tasks";
import { cn } from "@/lib/utils";

interface UnifiedTaskListProps {
  filters: TaskFilters;
  showROIEstimate?: boolean;
}

type SortMode = "due_date" | "roi_score" | "priority";

export function UnifiedTaskList({ filters, showROIEstimate = true }: UnifiedTaskListProps) {
  const [timeTrackingTask, setTimeTrackingTask] = useState<string | null>(null);
  const [outcomeTask, setOutcomeTask] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("due_date");
  
  const { data: tasks, isLoading } = useUnifiedTasks(filters);
  const { members: teamMembers } = useTeamMembers();
  const { data: boards } = useBoards({ archived: false });
  const toggleComplete = useToggleTaskComplete();
  const updateTask = useUpdateTask();
  const { estimates, isLoading: isEstimating, estimateROI, getEstimate } = useTaskROIEstimate();

  // Helper to get board name from source_url
  const getBoardName = (task: UnifiedTask) => {
    if (task.source !== 'board_card' || !task.source_url) return null;
    const boardId = task.source_url.replace('/projects/', '');
    const board = boards?.find(b => b.id === boardId);
    return board?.name || null;
  };

  const handleEstimateROI = () => {
    if (filters.assignee && filters.assignee !== "all") {
      estimateROI({ userId: filters.assignee });
    } else {
      const taskIds = tasks?.filter(t => t.status !== "completed").map(t => t.id) || [];
      estimateROI({ taskIds: taskIds.slice(0, 50) });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Sort tasks based on mode
  const sortTasks = (taskList: UnifiedTask[]) => {
    return [...taskList].sort((a, b) => {
      if (sortMode === "roi_score") {
        const aScore = getEstimate(a.id)?.roiScore || 0;
        const bScore = getEstimate(b.id)?.roiScore || 0;
        return bScore - aScore; // Descending
      }
      if (sortMode === "priority") {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // Default: due_date
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  };

  // Group tasks by status
  const overdueTasks = sortTasks(tasks?.filter(
    (t) => t.status !== "completed" && t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))
  ) || []);
  const todayTasks = sortTasks(tasks?.filter(
    (t) => t.status !== "completed" && t.due_date && isToday(new Date(t.due_date))
  ) || []);
  const upcomingTasks = sortTasks(tasks?.filter(
    (t) => t.status !== "completed" && t.due_date && isFuture(new Date(t.due_date)) && !isToday(new Date(t.due_date))
  ) || []);
  const noDueDateTasks = sortTasks(tasks?.filter(
    (t) => t.status !== "completed" && !t.due_date
  ) || []);
  const completedTasks = tasks?.filter((t) => t.status === "completed") || [];

  const TaskItem = ({ task }: { task: UnifiedTask }) => {
    const estimate = getEstimate(task.id);
    
    return (
      <Card className="hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.status === "completed"}
              onCheckedChange={(checked) =>
                toggleComplete.mutate({ id: task.id, completed: !!checked })
              }
              className="mt-1"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg" title={`Source: ${task.source}`}>
                  {sourceIcons[task.source as TaskSource]}
                </span>
                <span className={cn(
                  "font-medium",
                  task.status === "completed" && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </span>
                <Badge className={priorityColors[task.priority as TaskPriority]} variant="secondary">
                  {task.priority}
                </Badge>
                {estimate && <TaskROIBadge estimate={estimate} taskTitle={task.title} />}
                {task.outcome_id && (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    <DollarSign className="h-3 w-3 mr-1" />
                    ${task.outcome_amount?.toLocaleString()}
                  </Badge>
                )}
              </div>
              
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {task.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                {task.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.due_date), "MMM d")}
                  </span>
                )}
                {task.actual_time_minutes > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.round(task.actual_time_minutes / 60 * 10) / 10}h logged
                  </span>
                )}
                {task.assigned_user && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {task.assigned_user.full_name}
                  </span>
                )}
                {task.constituent && (
                  <span className="flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    {task.constituent.first_name} {task.constituent.last_name}
                  </span>
                )}
                {task.grant && (
                  <span className="flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    {(task.grant as { title?: string; name?: string }).title || (task.grant as { name?: string }).name}
                  </span>
                )}
                {getBoardName(task) && (
                  <span className="flex items-center gap-1 text-primary">
                    <Kanban className="h-3 w-3" />
                    {getBoardName(task)}
                  </span>
                )}
                {task.task_category && (
                  <Badge variant="outline" className="text-xs">
                    {task.task_category.replace("_", " ")}
                  </Badge>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover z-50">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Reassign
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="bg-popover z-50">
                      <DropdownMenuItem 
                        onClick={() => updateTask.mutate({ id: task.id, assigned_to: null })}
                      >
                        <User className="h-4 w-4 mr-2 opacity-50" />
                        Unassigned
                      </DropdownMenuItem>
                      {teamMembers?.map((member) => (
                        <DropdownMenuItem 
                          key={member.id}
                          onClick={() => updateTask.mutate({ id: task.id, assigned_to: member.id })}
                        >
                          <User className="h-4 w-4 mr-2" />
                          {[member.first_name, member.last_name].filter(Boolean).join(" ") || member.email}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={() => setTimeTrackingTask(task.id)}>
                  <Clock className="h-4 w-4 mr-2" />
                  Log Time
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOutcomeTask(task.id)}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Attribute Outcome
                </DropdownMenuItem>
                {task.source_url && (
                  <DropdownMenuItem onClick={() => window.open(task.source_url!, "_blank")}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Go to Source
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TaskGroup = ({ title, tasks, variant }: { title: string; tasks: UnifiedTask[]; variant?: "overdue" | "today" | "default" }) => {
    if (tasks.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <h3 className={cn(
          "text-sm font-semibold",
          variant === "overdue" && "text-red-600",
          variant === "today" && "text-blue-600"
        )}>
          {title} ({tasks.length})
        </h3>
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  };

  const activeTasks = [...overdueTasks, ...todayTasks, ...upcomingTasks, ...noDueDateTasks];
  const hasEstimates = Object.keys(estimates).length > 0;

  return (
    <div className="space-y-6">
      {/* ROI Estimation Controls */}
      {showROIEstimate && (
        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleEstimateROI}
            disabled={isEstimating || activeTasks.length === 0}
          >
            <Sparkles className={cn("h-4 w-4 mr-2", isEstimating && "animate-pulse")} />
            {isEstimating ? "Analyzing..." : "Estimate ROI"}
          </Button>
          
          {hasEstimates && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort: {sortMode === "roi_score" ? "ROI Score" : sortMode === "priority" ? "Priority" : "Due Date"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortMode("due_date")}>
                  Due Date
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode("roi_score")}>
                  ROI Score (Highest First)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode("priority")}>
                  Priority
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <TaskGroup title="⚠️ Overdue" tasks={overdueTasks} variant="overdue" />
      <TaskGroup title="📅 Today" tasks={todayTasks} variant="today" />
      <TaskGroup title="📆 Upcoming" tasks={upcomingTasks} />
      <TaskGroup title="📋 No Due Date" tasks={noDueDateTasks} />

      {activeTasks.length === 0 && completedTasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tasks found</p>
        </div>
      )}

      {completedTasks.length > 0 && (
        <Collapsible open={archiveOpen} onOpenChange={setArchiveOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
              <ChevronRight className={cn("h-4 w-4 transition-transform", archiveOpen && "rotate-90")} />
              <Archive className="h-4 w-4" />
              <span>Archived / Completed ({completedTasks.length})</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="space-y-2 pl-6 border-l-2 border-muted">
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      <TimeTrackingDialog 
        taskId={timeTrackingTask} 
        onClose={() => setTimeTrackingTask(null)} 
      />
      <OutcomeAttributionDialog 
        taskId={outcomeTask} 
        onClose={() => setOutcomeTask(null)} 
      />
    </div>
  );
}
