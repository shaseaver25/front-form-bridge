import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  LayoutGrid,
  Loader2,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import { format, subDays, startOfDay, isBefore, isToday, isThisWeek, startOfMonth, isSameDay } from 'date-fns';
import { BoardCard as BoardCardType, BoardColumn as BoardColumnType } from '@/types/boards';
import { boardAiService } from '@/services/boardAiService';
import { toast } from 'sonner';

interface BoardDashboardViewProps {
  boardId: string;
  boardName: string;
  cards: BoardCardType[];
  columns: BoardColumnType[];
}

const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const STATUS_COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))', 'hsl(var(--accent))'];

const DUE_DATE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#94a3b8'];

export function BoardDashboardView({ boardId, boardName, cards, columns }: BoardDashboardViewProps) {
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insights, setInsights] = useState<{
    velocity?: string;
    bottlenecks?: string[];
    recommendations?: string[];
  } | null>(null);

  // Stats calculations
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);

    const total = cards.length;
    const completed = cards.filter(c => c.completed_at).length;
    const completedThisMonth = cards.filter(c => 
      c.completed_at && new Date(c.completed_at) >= monthStart
    ).length;
    const inProgress = cards.filter(c => !c.completed_at).length;
    const overdue = cards.filter(c => 
      c.due_date && 
      !c.completed_at && 
      isBefore(new Date(c.due_date), startOfDay(now))
    ).length;

    return { total, completed, completedThisMonth, inProgress, overdue };
  }, [cards]);

  // Cards by column chart data
  const cardsByColumnData = useMemo(() => {
    return columns.map(col => {
      const colCards = cards.filter(c => c.column_id === col.id);
      return {
        name: col.title,
        urgent: colCards.filter(c => c.priority === 'urgent').length,
        high: colCards.filter(c => c.priority === 'high').length,
        medium: colCards.filter(c => c.priority === 'medium').length,
        low: colCards.filter(c => c.priority === 'low').length,
        total: colCards.length,
      };
    });
  }, [cards, columns]);

  // Completion trend (last 14 days)
  const completionTrendData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => subDays(new Date(), 13 - i));
    
    return days.map(day => {
      const completed = cards.filter(c => 
        c.completed_at && isSameDay(new Date(c.completed_at), day)
      ).length;
      return {
        date: format(day, 'MMM d'),
        completed,
      };
    });
  }, [cards]);

  // Due date distribution
  const dueDateData = useMemo(() => {
    const now = new Date();
    const distribution = {
      overdue: 0,
      today: 0,
      thisWeek: 0,
      later: 0,
      noDueDate: 0,
    };

    cards.forEach(card => {
      if (card.completed_at) return;
      
      if (!card.due_date) {
        distribution.noDueDate++;
      } else {
        const dueDate = new Date(card.due_date);
        if (isBefore(dueDate, startOfDay(now))) {
          distribution.overdue++;
        } else if (isToday(dueDate)) {
          distribution.today++;
        } else if (isThisWeek(dueDate)) {
          distribution.thisWeek++;
        } else {
          distribution.later++;
        }
      }
    });

    return [
      { name: 'Overdue', value: distribution.overdue, color: DUE_DATE_COLORS[0] },
      { name: 'Today', value: distribution.today, color: DUE_DATE_COLORS[1] },
      { name: 'This Week', value: distribution.thisWeek, color: DUE_DATE_COLORS[2] },
      { name: 'Later', value: distribution.later, color: DUE_DATE_COLORS[3] },
      { name: 'No Due Date', value: distribution.noDueDate, color: DUE_DATE_COLORS[4] },
    ].filter(d => d.value > 0);
  }, [cards]);

  // Workload by assignee
  const workloadData = useMemo(() => {
    const assigneeMap = new Map<string, { todo: number; inProgress: number; done: number }>();
    
    cards.forEach(card => {
      const assignee = card.assigned_to || 'Unassigned';
      if (!assigneeMap.has(assignee)) {
        assigneeMap.set(assignee, { todo: 0, inProgress: 0, done: 0 });
      }
      
      const data = assigneeMap.get(assignee)!;
      const column = columns.find(c => c.id === card.column_id);
      
      if (card.completed_at || column?.is_done_column) {
        data.done++;
      } else if (column?.column_type === 'in_progress') {
        data.inProgress++;
      } else {
        data.todo++;
      }
    });

    return Array.from(assigneeMap.entries())
      .map(([name, data]) => ({
        name: name === 'Unassigned' ? 'Unassigned' : name.slice(0, 8) + '...',
        ...data,
        total: data.todo + data.inProgress + data.done,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [cards, columns]);

  const handleGetInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const result = await boardAiService.getBoardInsights(
        { id: boardId, name: boardName },
        columns,
        cards
      );
      setInsights(result);
    } catch (error) {
      console.error('Error getting insights:', error);
      toast.error('Failed to get AI insights');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cards</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <LayoutGrid className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed (Month)</p>
                <p className="text-3xl font-bold text-green-600">{stats.completedThisMonth}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cards by Column */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Cards by Column
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cardsByColumnData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="urgent" stackId="a" fill={PRIORITY_COLORS.urgent} name="Urgent" />
                <Bar dataKey="high" stackId="a" fill={PRIORITY_COLORS.high} name="High" />
                <Bar dataKey="medium" stackId="a" fill={PRIORITY_COLORS.medium} name="Medium" />
                <Bar dataKey="low" stackId="a" fill={PRIORITY_COLORS.low} name="Low" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Completion Trend (14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={completionTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Workload by Assignee */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Workload by Assignee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={workloadData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="done" stackId="a" fill="#22c55e" name="Done" />
                <Bar dataKey="inProgress" stackId="a" fill="#3b82f6" name="In Progress" />
                <Bar dataKey="todo" stackId="a" fill="#94a3b8" name="To Do" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Due Date Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Due Date Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dueDateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {dueDateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Board Insights
          </CardTitle>
          <Button onClick={handleGetInsights} disabled={isLoadingInsights}>
            {isLoadingInsights ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Get Insights
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {insights ? (
            <div className="space-y-4">
              {insights.velocity && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Velocity Assessment</h4>
                  <p className="text-sm">{insights.velocity}</p>
                </div>
              )}
              
              {insights.bottlenecks && insights.bottlenecks.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Bottlenecks</h4>
                  <div className="flex flex-wrap gap-2">
                    {insights.bottlenecks.map((bottleneck, i) => (
                      <Badge key={i} variant="destructive">{bottleneck}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {insights.recommendations && insights.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {insights.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click "Get Insights" to receive AI-powered analysis of your board's performance, 
              bottlenecks, and recommendations for improvement.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
