import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  LayoutGrid, 
  Calendar, 
  ExternalLink,
  AlertCircle,
  Mic
} from "lucide-react";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface RelatedBoardTasksProps {
  constituentId: string;
  constituentName: string;
}

interface LinkedCard {
  id: string;
  headline: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent' | null;
  completed_at: string | null;
  board_id: string;
  column_id: string;
  boards: {
    id: string;
    name: string;
  };
  board_columns: {
    title: string;
    is_done_column: boolean;
  };
}

interface LinkedTask {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  source_type: string | null;
}

export function RelatedBoardTasks({ constituentId, constituentName }: RelatedBoardTasksProps) {
  const navigate = useNavigate();
  const [cards, setCards] = useState<LinkedCard[]>([]);
  const [tasks, setTasks] = useState<LinkedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinkedCards();
  }, [constituentId]);

  const fetchLinkedCards = async () => {
    setLoading(true);
    const [cardsRes, tasksRes] = await Promise.all([
      supabase
        .from('board_cards')
        .select(`
          id, headline, description, due_date, priority, completed_at, board_id, column_id,
          boards(id, name),
          board_columns(title, is_done_column)
        `)
        .eq('linked_contact_id', constituentId)
        .order('due_date', { ascending: true, nullsFirst: false }),
      supabase
        .from('tasks')
        .select('id, title, description, due_date, status, source_type')
        .eq('constituent_id', constituentId)
        .order('due_date', { ascending: true, nullsFirst: false }),
    ]);

    if (cardsRes.error) {
      console.error('Failed to fetch linked cards:', cardsRes.error);
    } else {
      setCards((cardsRes.data as unknown as LinkedCard[]) || []);
    }
    if (tasksRes.error) {
      console.error('Failed to fetch linked tasks:', tasksRes.error);
    } else {
      setTasks(tasksRes.data || []);
    }
    setLoading(false);
  };

  const handleQuickComplete = async (cardId: string, columnId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;

    const { data: doneColumn } = await supabase
      .from('board_columns')
      .select('id')
      .eq('board_id', card.board_id)
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
        fetchLinkedCards();
      }
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      toast.error("Failed to complete task");
    } else {
      toast.success("Task completed");
      fetchLinkedCards();
    }
  };

  const getDueDateInfo = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const isOverdue = isPast(date) && !isToday(date);
    const today = isToday(date);
    const tomorrow = isTomorrow(date);

    return {
      formatted: today ? 'Today' : tomorrow ? 'Tomorrow' : format(date, 'MMM d'),
      isOverdue,
      today,
      tomorrow,
    };
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const activeTasks = cards.filter(c => !c.completed_at);
  const completedCards = cards.filter(c => c.completed_at);
  const activeLinkedTasks = tasks.filter(t => t.status !== 'completed');
  const completedLinkedTasks = tasks.filter(t => t.status === 'completed');
  const totalActive = activeTasks.length + activeLinkedTasks.length;
  const totalCompleted = completedCards.length + completedLinkedTasks.length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Related Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Related Tasks
            {totalActive > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalActive}
              </Badge>
            )}
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate('/boards')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Create Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {cards.length === 0 && tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No tasks linked to this contact</p>
            <p className="text-xs mt-1">
              Link tasks from project boards to track work related to {constituentName}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Board Cards */}
            {activeTasks.length > 0 && (
              <div className="space-y-2">
                {activeTasks.map((card) => {
                  const dueDateInfo = getDueDateInfo(card.due_date);
                  
                  return (
                    <div
                      key={card.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                    >
                      <Checkbox
                        className="mt-1"
                        checked={false}
                        onCheckedChange={() => handleQuickComplete(card.id, card.column_id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium truncate">{card.headline}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={() => navigate(`/boards/${card.board_id}`)}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="truncate">{card.boards?.name}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {card.board_columns?.title}
                          </Badge>
                        </div>
                        {(dueDateInfo || card.priority) && (
                          <div className="flex items-center gap-2 mt-2">
                            {dueDateInfo && (
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                                dueDateInfo.isOverdue 
                                  ? 'bg-destructive/10 text-destructive' 
                                  : dueDateInfo.today 
                                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                    : 'bg-muted text-muted-foreground'
                              }`}>
                                {dueDateInfo.isOverdue && <AlertCircle className="w-3 h-3" />}
                                <Calendar className="w-3 h-3" />
                                {dueDateInfo.formatted}
                              </span>
                            )}
                            {card.priority && card.priority !== 'low' && (
                              <Badge className={`text-xs capitalize ${getPriorityColor(card.priority)}`}>
                                {card.priority}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active Voice Note / Manual Tasks */}
            {activeLinkedTasks.length > 0 && (
              <div className="space-y-2">
                {activeLinkedTasks.map((task) => {
                  const dueDateInfo = getDueDateInfo(task.due_date);
                  
                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                    >
                      <Checkbox
                        className="mt-1"
                        checked={false}
                        onCheckedChange={() => handleCompleteTask(task.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          {task.source_type === 'voice_note' && (
                            <Mic className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{task.source_type === 'voice_note' ? 'Voice Note' : 'Task'}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0 capitalize">
                            {task.status}
                          </Badge>
                        </div>
                        {dueDateInfo && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                              dueDateInfo.isOverdue 
                                ? 'bg-destructive/10 text-destructive' 
                                : dueDateInfo.today 
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                  : 'bg-muted text-muted-foreground'
                            }`}>
                              {dueDateInfo.isOverdue && <AlertCircle className="w-3 h-3" />}
                              <Calendar className="w-3 h-3" />
                              {dueDateInfo.formatted}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Completed Tasks (collapsed) */}
            {totalCompleted > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  {totalCompleted} completed task{totalCompleted > 1 ? 's' : ''}
                </p>
                <div className="space-y-1">
                  {completedCards.slice(0, 3).map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center gap-3 p-2 rounded text-muted-foreground"
                    >
                      <Checkbox checked disabled className="opacity-50" />
                      <span className="text-sm line-through truncate">{card.headline}</span>
                    </div>
                  ))}
                  {completedLinkedTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-2 rounded text-muted-foreground"
                    >
                      <Checkbox checked disabled className="opacity-50" />
                      <span className="text-sm line-through truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
