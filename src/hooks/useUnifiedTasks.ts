import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UnifiedTask, TaskFilters, TaskPriority, TaskCategoryType, TaskOutcomeType, TaskSource, TaskStatus } from "@/types/unified-tasks";

export function useUnifiedTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: ["unified-tasks", filters],
    queryFn: async () => {
      // Fetch from unified_tasks table
      let query = supabase
        .from("unified_tasks")
        .select("*")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters.source !== "all" && filters.source !== "board_card") {
        query = query.eq("source", filters.source as TaskSource);
      }
      if (filters.assignee !== "all") {
        query = query.eq("assigned_to", filters.assignee);
      }
      if (filters.category !== "all") {
        query = query.eq("task_category", filters.category as TaskCategoryType);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data: unifiedData, error: unifiedError } = await query;
      if (unifiedError) throw unifiedError;

      // Also fetch board_cards (project tasks) and merge them
      let boardQuery = supabase
        .from("board_cards")
        .select("id, headline, description, priority, due_date, assigned_to, created_by, created_at, updated_at, completed_at, board_id, column_id, estimated_hours, actual_hours")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (filters.assignee !== "all") {
        boardQuery = boardQuery.eq("assigned_to", filters.assignee);
      }
      if (filters.search) {
        boardQuery = boardQuery.or(`headline.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data: boardCards, error: boardError } = await boardQuery;
      if (boardError) {
        console.error("Error fetching board cards:", boardError);
      }

      // Map board_cards to UnifiedTask shape
      const boardTasks: UnifiedTask[] = (boardCards || []).map((card) => {
        // Map board card status to unified task status
        let taskStatus: TaskStatus = "pending";
        if (card.completed_at) taskStatus = "completed";

        return {
          id: card.id,
          source: "board_card" as TaskSource,
          source_id: card.board_id,
          source_url: `/boards/${card.board_id}`,
          title: card.headline,
          description: card.description,
          status: taskStatus,
          priority: (card.priority || "medium") as TaskPriority,
          due_date: card.due_date,
          completed_at: card.completed_at,
          assigned_to: card.assigned_to,
          created_by: card.created_by,
          constituent_id: null,
          organization_id: null,
          grant_opportunity_id: null,
          estimated_time_minutes: card.estimated_hours ? Math.round(card.estimated_hours * 60) : null,
          actual_time_minutes: card.actual_hours ? Math.round(card.actual_hours * 60) : 0,
          task_category: null,
          outcome_type: null,
          outcome_id: null,
          outcome_amount: null,
          outcome_date: null,
          outcome_notes: null,
          tags: [],
          created_at: card.created_at,
          updated_at: card.updated_at,
        };
      });

      // Filter board tasks by status if needed
      let filteredBoardTasks = boardTasks;
      if (filters.status !== "all") {
        filteredBoardTasks = boardTasks.filter(t => t.status === filters.status);
      }
      if (filters.source !== "all" && filters.source !== "board_card") {
        filteredBoardTasks = []; // Don't include board cards if filtering to another source
      }

      // Merge, deduplicate (by source_id match), and sort
      const unifiedTasks = (unifiedData || []) as unknown as UnifiedTask[];
      const existingBoardIds = new Set(
        unifiedTasks.filter(t => t.source === "board_card").map(t => t.source_id)
      );
      const newBoardTasks = filteredBoardTasks.filter(t => !existingBoardIds.has(t.id));

      const allTasks = [...unifiedTasks, ...newBoardTasks];
      
      // Sort by due_date ascending, nulls last
      allTasks.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });

      return allTasks;
    },
  });
}

export function useTaskDetail(taskId: string | null) {
  return useQuery({
    queryKey: ["unified-task", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const { data, error } = await supabase
        .from("unified_tasks")
        .select("*")
        .eq("id", taskId)
        .single();
      if (error) throw error;
      return data as unknown as UnifiedTask;
    },
    enabled: !!taskId,
  });
}

export function useToggleTaskComplete() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("unified_tasks")
        .update({
          status: completed ? "completed" : "pending",
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unified-tasks"] });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (task: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      status?: TaskStatus;
      due_date?: string;
      assigned_to?: string;
      constituent_id?: string;
      grant_opportunity_id?: string;
      task_category?: TaskCategoryType;
      estimated_time_minutes?: number;
      tags?: string[];
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("unified_tasks")
        .insert({
          ...task,
          source: "manual",
          created_by: user.user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unified-tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UnifiedTask> & { id: string }) => {
      const { error } = await supabase
        .from("unified_tasks")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unified-tasks"] });
    },
  });
}

export function useLogTaskTime() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, minutes, notes }: { taskId: string; minutes: number; notes?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");
      
      // Insert time entry
      const { error: entryError } = await supabase
        .from("task_time_entries")
        .insert({
          unified_task_id: taskId,
          user_id: user.user.id,
          started_at: new Date().toISOString(),
          duration_minutes: minutes,
          notes,
        });
      if (entryError) throw entryError;
      
      // Update task total
      const { data: task } = await supabase
        .from("unified_tasks")
        .select("actual_time_minutes")
        .eq("id", taskId)
        .single();
        
      const newTotal = (task?.actual_time_minutes || 0) + minutes;
      
      const { error } = await supabase
        .from("unified_tasks")
        .update({ actual_time_minutes: newTotal })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unified-tasks"] });
    },
  });
}

export function useAttributeOutcome() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      taskId, 
      outcomeType, 
      outcomeId, 
      outcomeAmount, 
      notes 
    }: { 
      taskId: string; 
      outcomeType: TaskOutcomeType; 
      outcomeId?: string; 
      outcomeAmount?: number; 
      notes?: string;
    }) => {
      const { error } = await supabase
        .from("unified_tasks")
        .update({
          outcome_type: outcomeType,
          outcome_id: outcomeId || null,
          outcome_amount: outcomeAmount || null,
          outcome_date: new Date().toISOString(),
          outcome_notes: notes || null,
        })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unified-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-roi"] });
    },
  });
}
