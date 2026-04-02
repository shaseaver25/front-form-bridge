import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TaskROIByCategory, TaskROIByUser } from "@/types/unified-tasks";

async function fetchMergedTaskData(dateFilter: string) {
  // Fetch unified_tasks
  const { data: unified, error: e1 } = await supabase
    .from("unified_tasks")
    .select("task_category, actual_time_minutes, outcome_amount, status, outcome_id, completed_at, created_at, assigned_to")
    .gte("created_at", dateFilter);
  if (e1) throw e1;

  // Fetch board_cards
  const { data: boards, error: e2 } = await supabase
    .from("board_cards")
    .select("id, headline, actual_hours, completed_at, assigned_to, created_at, board_id, linked_donation_id")
    .gte("created_at", dateFilter);
  if (e2) throw e2;

  // Deduplicate: exclude board cards already synced to unified_tasks
  const unifiedSourceIds = new Set(
    (unified || []).filter((t: any) => t.source === "board_card").map((t: any) => t.source_id)
  );

  // Merge into a common shape
  const allTasks = [
    ...(unified || []).map((t: any) => ({
      task_category: t.task_category || null,
      actual_time_minutes: t.actual_time_minutes || 0,
      outcome_amount: Number(t.outcome_amount) || 0,
      status: t.status,
      outcome_id: t.outcome_id,
      assigned_to: t.assigned_to,
    })),
    ...(boards || [])
      .filter((c: any) => !unifiedSourceIds.has(c.id))
      .map((c: any) => ({
        task_category: null,
        actual_time_minutes: c.actual_hours ? Math.round(Number(c.actual_hours) * 60) : 0,
        outcome_amount: 0, // board cards don't have outcome_amount directly
        status: c.completed_at ? "completed" : "pending",
        outcome_id: c.linked_donation_id || null,
        assigned_to: c.assigned_to,
      })),
  ];

  return allTasks;
}

export function useTaskROIByCategory() {
  return useQuery({
    queryKey: ["task-roi-category"],
    queryFn: async () => {
      const dateFilter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const allTasks = await fetchMergedTaskData(dateFilter);

      const grouped = allTasks.reduce((acc, task) => {
        const cat = task.task_category || "uncategorized";
        if (!acc[cat]) {
          acc[cat] = { count: 0, timeMinutes: 0, outcomes: 0, completed: 0, withOutcome: 0 };
        }
        acc[cat].count++;
        acc[cat].timeMinutes += task.actual_time_minutes;
        acc[cat].outcomes += task.outcome_amount;
        if (task.status === "completed") acc[cat].completed++;
        if (task.outcome_id) acc[cat].withOutcome++;
        return acc;
      }, {} as Record<string, { count: number; timeMinutes: number; outcomes: number; completed: number; withOutcome: number }>);

      return Object.entries(grouped).map(([category, d]) => ({
        task_category: category === "uncategorized" ? null : category,
        total_tasks: d.count,
        completed_tasks: d.completed,
        total_time_invested: d.timeMinutes,
        tasks_with_outcomes: d.withOutcome,
        total_outcome_amount: d.outcomes,
        revenue_per_hour: d.timeMinutes > 0 ? d.outcomes / (d.timeMinutes / 60) : 0,
        avg_completion_hours: null,
      })) as TaskROIByCategory[];
    },
  });
}

export function useTaskROIByUser() {
  return useQuery({
    queryKey: ["task-roi-user"],
    queryFn: async () => {
      const dateFilter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const allTasks = await fetchMergedTaskData(dateFilter);

      // Filter to only assigned tasks
      const assignedTasks = allTasks.filter((t) => t.assigned_to);

      // Get unique user IDs and fetch their names
      const userIds = [...new Set(assignedTasks.map((t) => t.assigned_to!))];
      
      let userMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("id, first_name, last_name, email")
          .in("id", userIds);
        
        (profiles || []).forEach((p: any) => {
          const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
          userMap[p.id] = name || p.email || "Team Member";
        });
      }

      // Group by user
      const grouped = assignedTasks.reduce((acc, task) => {
        const userId = task.assigned_to!;
        if (!acc[userId]) {
          acc[userId] = { timeMinutes: 0, outcomes: 0, completed: 0, withOutcome: 0, total: 0 };
        }
        acc[userId].total++;
        acc[userId].timeMinutes += task.actual_time_minutes;
        acc[userId].outcomes += task.outcome_amount;
        if (task.status === "completed") acc[userId].completed++;
        if (task.outcome_id) acc[userId].withOutcome++;
        return acc;
      }, {} as Record<string, { timeMinutes: number; outcomes: number; completed: number; withOutcome: number; total: number }>);

      return Object.entries(grouped).map(([userId, d]) => ({
        user_id: userId,
        full_name: userMap[userId] || "Team Member",
        total_tasks: d.total,
        completed_tasks: d.completed,
        total_time_invested: d.timeMinutes,
        tasks_with_outcomes: d.withOutcome,
        total_outcome_amount: d.outcomes,
        revenue_per_hour: d.timeMinutes > 0 ? d.outcomes / (d.timeMinutes / 60) : 0,
      })) as TaskROIByUser[];
    },
  });
}

export function useTaskSummaryStats() {
  return useQuery({
    queryKey: ["task-summary-stats"],
    queryFn: async () => {
      const dateFilter = new Date();
      dateFilter.setFullYear(dateFilter.getFullYear() - 1);
      const allTasks = await fetchMergedTaskData(dateFilter.toISOString());

      const totalTime = allTasks.reduce((sum, t) => sum + t.actual_time_minutes, 0);
      const totalOutcome = allTasks.reduce((sum, t) => sum + t.outcome_amount, 0);
      const completedTasks = allTasks.filter((t) => t.status === "completed").length;
      const tasksWithOutcome = allTasks.filter((t) => t.outcome_id).length;

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
