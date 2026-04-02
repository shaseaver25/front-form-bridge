import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UnifiedTask, TaskFilters, TaskPriority, TaskCategoryType, TaskOutcomeType, TaskSource, TaskStatus } from "@/types/unified-tasks";

export function useUnifiedTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: ["unified-tasks", filters],
    queryFn: async () => {
      let query = supabase
        .from("unified_tasks")
        .select("*")
        .order("due_date", { ascending: true, nullsFirst: false });

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters.source !== "all") {
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

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as UnifiedTask[];
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
        .select(`
          *,
          constituent:constituents(id, first_name, last_name),
          organization:organizations(id, name),
          grant:grant_opportunities(id, title)
        `)
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
