import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TaskROIByCategory, TaskROIByUser } from "@/types/unified-tasks";

export function useTaskROIByCategory() {
  return useQuery({
    queryKey: ["task-roi-category"],
    queryFn: async () => {
      // Views aren't in types, use RPC or raw query
      const { data, error } = await supabase
        .from("unified_tasks")
        .select("task_category, actual_time_minutes, outcome_amount, status, outcome_id, completed_at, created_at")
        .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      
      // Group by category manually
      const grouped = (data || []).reduce((acc, task) => {
        const cat = task.task_category || "uncategorized";
        if (!acc[cat]) {
          acc[cat] = { tasks: [], timeMinutes: 0, outcomes: 0, completed: 0, withOutcome: 0 };
        }
        acc[cat].tasks.push(task);
        acc[cat].timeMinutes += task.actual_time_minutes || 0;
        acc[cat].outcomes += Number(task.outcome_amount) || 0;
        if (task.status === "completed") acc[cat].completed++;
        if (task.outcome_id) acc[cat].withOutcome++;
        return acc;
      }, {} as Record<string, { tasks: unknown[]; timeMinutes: number; outcomes: number; completed: number; withOutcome: number }>);
      
      return Object.entries(grouped).map(([category, data]) => ({
        task_category: category === "uncategorized" ? null : category,
        total_tasks: data.tasks.length,
        completed_tasks: data.completed,
        total_time_invested: data.timeMinutes,
        tasks_with_outcomes: data.withOutcome,
        total_outcome_amount: data.outcomes,
        revenue_per_hour: data.timeMinutes > 0 ? data.outcomes / (data.timeMinutes / 60) : 0,
        avg_completion_hours: null,
      })) as TaskROIByCategory[];
    },
  });
}

export function useTaskROIByUser() {
  return useQuery({
    queryKey: ["task-roi-user"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unified_tasks")
        .select("assigned_to, actual_time_minutes, outcome_amount, status, outcome_id")
        .not("assigned_to", "is", null)
        .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      
      // Group by user
      const grouped = (data || []).reduce((acc, task) => {
        const userId = task.assigned_to!;
        if (!acc[userId]) {
          acc[userId] = { timeMinutes: 0, outcomes: 0, completed: 0, withOutcome: 0, total: 0 };
        }
        acc[userId].total++;
        acc[userId].timeMinutes += task.actual_time_minutes || 0;
        acc[userId].outcomes += Number(task.outcome_amount) || 0;
        if (task.status === "completed") acc[userId].completed++;
        if (task.outcome_id) acc[userId].withOutcome++;
        return acc;
      }, {} as Record<string, { timeMinutes: number; outcomes: number; completed: number; withOutcome: number; total: number }>);
      
      return Object.entries(grouped).map(([userId, data]) => ({
        user_id: userId,
        full_name: "Team Member", // Would need separate query for names
        total_tasks: data.total,
        completed_tasks: data.completed,
        total_time_invested: data.timeMinutes,
        tasks_with_outcomes: data.withOutcome,
        total_outcome_amount: data.outcomes,
        revenue_per_hour: data.timeMinutes > 0 ? data.outcomes / (data.timeMinutes / 60) : 0,
      })) as TaskROIByUser[];
    },
  });
}

export function useTaskSummaryStats() {
  return useQuery({
    queryKey: ["task-summary-stats"],
    queryFn: async () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      const { data, error } = await supabase
        .from("unified_tasks")
        .select("actual_time_minutes, outcome_amount, status, outcome_id")
        .gte("created_at", oneYearAgo.toISOString());
      
      if (error) throw error;
      
      const totalTime = (data || []).reduce((sum, t) => sum + (t.actual_time_minutes || 0), 0);
      const totalOutcome = (data || []).reduce((sum, t) => sum + (Number(t.outcome_amount) || 0), 0);
      const completedTasks = (data || []).filter((t) => t.status === "completed").length;
      const tasksWithOutcome = (data || []).filter((t) => t.outcome_id).length;
      
      return {
        totalTimeHours: Math.round(totalTime / 60),
        totalOutcome,
        completedTasks,
        tasksWithOutcome,
        conversionRate: completedTasks > 0 ? Math.round((tasksWithOutcome / completedTasks) * 100) : 0,
        revenuePerHour: totalTime > 0 ? Math.round(totalOutcome / (totalTime / 60)) : 0,
      };
    },
  });
}
