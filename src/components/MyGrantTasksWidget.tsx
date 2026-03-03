import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ListTodo, 
  Calendar,
  ChevronRight,
  FileText,
  Clock,
  AlertCircle
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, isThisWeek, startOfDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface GrantTask {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
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

export function MyGrantTasksWidget() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<GrantTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

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
        id, title, description, due_date, status,
        grant_opportunities:related_grant_opportunity_id(id, title)
      `)
      .eq('assigned_to', uid)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Failed to fetch tasks:', error);
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
      default: return 'border-l-muted-foreground/20';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListTodo className="w-5 h-5" />
            My Grant Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <Skeleton className="h-4 w-4" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListTodo className="w-5 h-5" />
            My Grant Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No tasks assigned to you</p>
            <p className="text-xs mt-1">Tasks from grants will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const grouped = groupTasks(tasks);

  const TaskGroup = ({ title, tasks, variant }: { title: string; tasks: GrantTask[]; variant: 'overdue' | 'today' | 'normal' }) => {
    if (tasks.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className={`text-xs font-semibold uppercase tracking-wide ${
            variant === 'overdue' ? 'text-destructive' : 
            variant === 'today' ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {title}
          </h4>
          <Badge variant={variant === 'overdue' ? 'destructive' : 'secondary'} className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        {tasks.slice(0, 5).map((task) => (
          <div
            key={task.id}
            className={`flex items-start gap-3 p-3 rounded-lg border-l-2 bg-card hover:bg-muted/50 transition-colors group ${getStatusColor(task.status)}`}
          >
            <Checkbox
              className="mt-0.5"
              checked={false}
              onCheckedChange={() => handleComplete(task.id)}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                {task.grant_opportunities && (
                  <span className="flex items-center gap-1 truncate">
                    <FileText className="w-3 h-3" />
                    {task.grant_opportunities.title}
                  </span>
                )}
                {task.due_date && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(task.due_date), 'MMM d')}
                    </span>
                  </>
                )}
                {task.status === 'in_progress' && (
                  <Badge variant="secondary" className="text-[10px] h-4">
                    <Clock className="w-2 h-2 mr-1" />
                    In Progress
                  </Badge>
                )}
              </div>
            </div>
            {task.grant_opportunities && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={() => navigate(`/grants?id=${task.grant_opportunities!.id}`)}
              >
                <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListTodo className="w-5 h-5" />
            My Grant Tasks
            <Badge variant="secondary" className="ml-1">{tasks.length}</Badge>
          </CardTitle>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => navigate('/my-tasks')}
            className="text-muted-foreground"
          >
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <TaskGroup title="Overdue" tasks={grouped.overdue} variant="overdue" />
        <TaskGroup title="Today" tasks={grouped.today} variant="today" />
        <TaskGroup title="Upcoming" tasks={grouped.upcoming} variant="normal" />
        {grouped.noDueDate.length > 0 && (
          <TaskGroup title="No Due Date" tasks={grouped.noDueDate} variant="normal" />
        )}
      </CardContent>
    </Card>
  );
}