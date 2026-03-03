import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckSquare, 
  ExternalLink,
  Calendar,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, isThisWeek, startOfDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface MyTask {
  id: string;
  headline: string;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  board_id: string;
  column_id: string;
  boards: {
    id: string;
    name: string;
  };
  board_columns: {
    title: string;
  };
}

interface GroupedTasks {
  overdue: MyTask[];
  today: MyTask[];
  tomorrow: MyTask[];
  thisWeek: MyTask[];
  later: MyTask[];
}

export function MyTasksWidget() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<MyTask[]>([]);
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
      .from('board_cards')
      .select(`
        id, headline, due_date, priority, board_id, column_id,
        boards:boards!board_cards_board_id_fkey(id, name),
        board_columns(title)
      `)
      .eq('assigned_to', uid)
      .is('completed_at', null)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Failed to fetch tasks:', error);
    } else {
      setTasks((data as unknown as MyTask[]) || []);
    }
    setLoading(false);
  };

  const handleComplete = async (cardId: string, boardId: string) => {
    // Find done column
    const { data: doneColumn } = await supabase
      .from('board_columns')
      .select('id')
      .eq('board_id', boardId)
      .eq('is_done_column', true)
      .single();

    if (doneColumn) {
      const { error } = await supabase
        .from('board_cards')
        .update({ 
          column_id: doneColumn.id,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId);

      if (error) {
        toast.error("Failed to complete task");
      } else {
        toast.success("Task completed");
        if (userId) fetchMyTasks(userId);
      }
    }
  };

  const groupTasks = (tasks: MyTask[]): GroupedTasks => {
    const now = startOfDay(new Date());
    const groups: GroupedTasks = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
    };

    tasks.forEach(task => {
      if (!task.due_date) {
        groups.later.push(task);
        return;
      }
      const dueDate = new Date(task.due_date);
      if (isPast(dueDate) && !isToday(dueDate)) {
        groups.overdue.push(task);
      } else if (isToday(dueDate)) {
        groups.today.push(task);
      } else if (isTomorrow(dueDate)) {
        groups.tomorrow.push(task);
      } else if (isThisWeek(dueDate)) {
        groups.thisWeek.push(task);
      } else {
        groups.later.push(task);
      }
    });

    return groups;
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'urgent': return 'border-l-destructive';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      default: return 'border-l-muted-foreground/20';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            My Tasks
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
            <CheckSquare className="w-5 h-5" />
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">You're all caught up!</p>
            <p className="text-xs mt-1">No tasks assigned to you</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const grouped = groupTasks(tasks);

  const TaskGroup = ({ title, tasks, variant }: { title: string; tasks: MyTask[]; variant: 'overdue' | 'today' | 'normal' }) => {
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
        {tasks.slice(0, variant === 'normal' ? 3 : 5).map((task) => (
          <div
            key={task.id}
            className={`flex items-start gap-3 p-3 rounded-lg border-l-2 bg-card hover:bg-muted/50 transition-colors group ${getPriorityColor(task.priority)}`}
          >
            <Checkbox
              className="mt-0.5"
              checked={false}
              onCheckedChange={() => handleComplete(task.id, task.board_id)}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.headline}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className="truncate">{task.boards?.name}</span>
                {task.due_date && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(task.due_date), 'MMM d')}
                    </span>
                  </>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={() => navigate(`/boards/${task.board_id}`)}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
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
            <CheckSquare className="w-5 h-5" />
            My Tasks
            <Badge variant="secondary" className="ml-1">{tasks.length}</Badge>
          </CardTitle>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => navigate('/boards')}
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
        <TaskGroup title="Tomorrow" tasks={grouped.tomorrow} variant="normal" />
        <TaskGroup title="This Week" tasks={grouped.thisWeek} variant="normal" />
        {grouped.later.length > 0 && (
          <TaskGroup title="Later" tasks={grouped.later} variant="normal" />
        )}
      </CardContent>
    </Card>
  );
}
