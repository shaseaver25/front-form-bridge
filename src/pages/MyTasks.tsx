import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ListTodo,
  Calendar,
  ChevronRight,
  FileText,
  Clock,
  AlertCircle,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ReassignTaskDialog } from "@/components/ReassignTaskDialog";

interface GrantTask {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  assigned_to: string | null;
  grant_opportunities: {
    id: string;
    title: string;
  } | null;
}

interface GroupedTasks {
  overdue: GrantTask[];
  today: GrantTask[];
  upcoming: GrantTask[];
  noDueDate: GrantTask[];
}

export default function MyTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<GrantTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active"); // Default to active (not completed/cancelled)
  const [grantFilter, setGrantFilter] = useState<string>("all");
  
  // Bulk selection
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  
  // Reassign dialog
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [reassignTaskId, setReassignTaskId] = useState<string>("");
  const [reassignTaskTitle, setReassignTaskTitle] = useState<string>("");
  const [reassignCurrentAssignee, setReassignCurrentAssignee] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndTasks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchMyTasks(user.id);
      } else {
        setLoading(false);
      }
    };
    fetchUserAndTasks();
  }, []);

  const fetchMyTasks = async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id, title, description, due_date, status, assigned_to,
        grant_opportunities:related_grant_opportunity_id(id, title)
      `)
      .eq('assigned_to', uid)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error("Failed to load tasks");
    } else {
      setTasks((data as unknown as GrantTask[]) || []);
    }
    setLoading(false);
  };

  const handleComplete = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', taskId);

    if (error) {
      toast.error("Failed to complete task");
    } else {
      toast.success("Task completed");
      if (userId) fetchMyTasks(userId);
    }
  };

  const handleBulkComplete = async () => {
    if (selectedTasks.size === 0) return;
    
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .in('id', Array.from(selectedTasks));

    if (error) {
      toast.error("Failed to complete tasks");
    } else {
      toast.success(`${selectedTasks.size} tasks completed`);
      setSelectedTasks(new Set());
      if (userId) fetchMyTasks(userId);
    }
  };

  const handleBulkCancel = async () => {
    if (selectedTasks.size === 0) return;
    
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'cancelled' })
      .in('id', Array.from(selectedTasks));

    if (error) {
      toast.error("Failed to cancel tasks");
    } else {
      toast.success(`${selectedTasks.size} tasks cancelled`);
      setSelectedTasks(new Set());
      if (userId) fetchMyTasks(userId);
    }
  };

  const openReassignDialog = (task: GrantTask) => {
    setReassignTaskId(task.id);
    setReassignTaskTitle(task.title);
    setReassignCurrentAssignee(task.assigned_to);
    setReassignDialogOpen(true);
  };

  // Get unique grants for filter dropdown
  const uniqueGrants = useMemo(() => {
    const grants = new Map<string, string>();
    tasks.forEach(task => {
      if (task.grant_opportunities) {
        grants.set(task.grant_opportunities.id, task.grant_opportunities.title);
      }
    });
    return Array.from(grants.entries());
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Status filter
      if (statusFilter === "active") {
        // Show only non-completed and non-cancelled tasks
        if (task.status === 'completed' || task.status === 'cancelled') {
          return false;
        }
      } else if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }
      // Grant filter
      if (grantFilter !== "all" && task.grant_opportunities?.id !== grantFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, searchQuery, statusFilter, grantFilter]);

  const groupTasks = (tasks: GrantTask[]): GroupedTasks => {
    const groups: GroupedTasks = {
      overdue: [],
      today: [],
      upcoming: [],
      noDueDate: [],
    };

    tasks.forEach(task => {
      if (!task.due_date) {
        groups.noDueDate.push(task);
        return;
      }
      const dueDate = new Date(task.due_date);
      if (isPast(dueDate) && !isToday(dueDate)) {
        groups.overdue.push(task);
      } else if (isToday(dueDate)) {
        groups.today.push(task);
      } else {
        groups.upcoming.push(task);
      }
    });

    return groups;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'border-l-primary';
      case 'pending': return 'border-l-yellow-500';
      case 'completed': return 'border-l-green-500';
      case 'cancelled': return 'border-l-muted-foreground/30';
      default: return 'border-l-muted-foreground/20';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="default" className="text-xs"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-xs">Pending</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-xs text-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-xs text-muted-foreground"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
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
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const grouped = groupTasks(filteredTasks);

  const TaskRow = ({ task }: { task: GrantTask }) => (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border-l-4 bg-card hover:bg-muted/50 transition-colors group ${getStatusColor(task.status)}`}
    >
      <Checkbox
        className="mt-1"
        checked={selectedTasks.has(task.id)}
        onCheckedChange={() => toggleTaskSelection(task.id)}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${task.status === 'completed' || task.status === 'cancelled' ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </p>
          {getStatusBadge(task.status)}
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
          {task.grant_opportunities && (
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {task.grant_opportunities.title}
            </span>
          )}
          {task.due_date && (
            <span className={`flex items-center gap-1 ${isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) ? 'text-destructive' : ''}`}>
              <Calendar className="w-3 h-3" />
              {format(new Date(task.due_date), 'MMM d, yyyy')}
            </span>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {task.status !== 'completed' && (
            <DropdownMenuItem onClick={() => handleComplete(task.id)}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Complete
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => openReassignDialog(task)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Reassign
          </DropdownMenuItem>
          {task.grant_opportunities && (
            <DropdownMenuItem onClick={() => navigate(`/grants?id=${task.grant_opportunities!.id}`)}>
              <ChevronRight className="w-4 h-4 mr-2" />
              View Grant
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const TaskGroup = ({ title, tasks, variant }: { title: string; tasks: GrantTask[]; variant: 'overdue' | 'today' | 'normal' }) => {
    if (tasks.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
          <h3 className={`text-sm font-semibold ${
            variant === 'overdue' ? 'text-destructive' : 
            variant === 'today' ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {variant === 'overdue' && <AlertCircle className="w-4 h-4 inline mr-1" />}
            {title}
          </h3>
          <Badge variant={variant === 'overdue' ? 'destructive' : 'secondary'}>
            {tasks.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ListTodo className="w-6 h-6" />
              My Tasks
            </h1>
            <p className="text-muted-foreground mt-1">
              All tasks assigned to you across grants
            </p>
          </div>
          <Button onClick={() => navigate('/grants')}>
            <FileText className="w-4 h-4 mr-2" />
            View Grants
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active Tasks</SelectItem>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={grantFilter} onValueChange={setGrantFilter}>
                <SelectTrigger className="w-[200px]">
                  <FileText className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Grant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grants</SelectItem>
                  {uniqueGrants.map(([id, title]) => (
                    <SelectItem key={id} value={id}>{title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedTasks.size > 0 && (
          <Card className="border-primary">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedTasks(new Set())}>
                    Clear Selection
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleBulkCancel}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleBulkComplete}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Complete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Tasks
                <Badge variant="secondary" className="ml-2">{filteredTasks.length}</Badge>
              </CardTitle>
              {filteredTasks.length > 0 && (
                <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                  {selectedTasks.size === filteredTasks.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-lg border">
                    <Skeleton className="h-4 w-4" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No tasks found</p>
                <p className="text-xs mt-1">
                  {tasks.length === 0 
                    ? "Tasks assigned to you will appear here"
                    : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <>
                <TaskGroup title="Overdue" tasks={grouped.overdue} variant="overdue" />
                <TaskGroup title="Due Today" tasks={grouped.today} variant="today" />
                <TaskGroup title="Upcoming" tasks={grouped.upcoming} variant="normal" />
                <TaskGroup title="No Due Date" tasks={grouped.noDueDate} variant="normal" />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ReassignTaskDialog
        open={reassignDialogOpen}
        onOpenChange={setReassignDialogOpen}
        taskId={reassignTaskId}
        taskTitle={reassignTaskTitle}
        currentAssignee={reassignCurrentAssignee}
        onSuccess={() => userId && fetchMyTasks(userId)}
      />
    </Layout>
  );
}
