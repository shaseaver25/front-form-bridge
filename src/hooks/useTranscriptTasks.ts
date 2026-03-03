import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { MeetingTranscriptTask } from './useMeetingTranscripts';

export function useTranscriptTasks() {
  const queryClient = useQueryClient();

  const pendingTasksQuery = useQuery({
    queryKey: ['meeting-transcript-pending-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_transcript_tasks')
        .select(`
          *,
          transcript:meeting_transcripts(id, title, meeting_date)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (MeetingTranscriptTask & { 
        transcript: { id: string; title: string; meeting_date: string } 
      })[];
    },
  });

  const approveTaskMutation = useMutation({
    mutationFn: async (params: {
      taskId: string;
      assignedTo?: string;
      dueDate?: string;
      priority?: string;
      addToCalendar?: boolean;
      boardId?: string;
      columnId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: task, error } = await supabase
        .from('meeting_transcript_tasks')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          assigned_to: params.assignedTo || null,
          due_date: params.dueDate || null,
          priority: params.priority || 'medium',
        })
        .eq('id', params.taskId)
        .select()
        .single();

      if (error) throw error;

      if (params.boardId && params.columnId) {
        const { data: maxPos } = await supabase
          .from('board_cards')
          .select('position')
          .eq('column_id', params.columnId)
          .order('position', { ascending: false })
          .limit(1)
          .single();

        const { data: cardData, error: cardError } = await supabase
          .from('board_cards')
          .insert({
            board_id: params.boardId,
            column_id: params.columnId,
            headline: task.task_text,
            created_by: user.id,
            assigned_to: params.assignedTo || null,
            due_date: params.dueDate || null,
            priority: (params.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
            position: (maxPos?.position || 0) + 1,
          })
          .select()
          .single();

        if (!cardError && cardData) {
          await supabase
            .from('meeting_transcript_tasks')
            .update({ board_card_id: cardData.id })
            .eq('id', params.taskId);
        }
      }

      if (params.addToCalendar && params.dueDate) {
        try {
          await supabase.functions.invoke('create-calendar-event-from-task', {
            body: { taskId: params.taskId, title: task.task_text, date: params.dueDate },
          });
        } catch (e) {
          console.error('Failed to create calendar event:', e);
        }
      }

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-transcript-pending-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['meeting-transcript-tasks'] });
      toast.success('Task approved');
    },
    onError: (error) => {
      toast.error('Failed to approve task: ' + error.message);
    },
  });

  const dismissTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('meeting_transcript_tasks')
        .update({ status: 'dismissed' })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-transcript-pending-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['meeting-transcript-tasks'] });
      toast.success('Task dismissed');
    },
    onError: (error) => {
      toast.error('Failed to dismiss task: ' + error.message);
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('meeting_transcript_tasks')
        .update({ status: 'completed' })
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-transcript-pending-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['meeting-transcript-tasks'] });
      toast.success('Task completed');
    },
    onError: (error) => {
      toast.error('Failed to complete task: ' + error.message);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (params: {
      taskId: string;
      taskText?: string;
      assignedTo?: string | null;
      dueDate?: string | null;
      priority?: string;
    }) => {
      const { error } = await supabase
        .from('meeting_transcript_tasks')
        .update({
          task_text: params.taskText,
          assigned_to: params.assignedTo,
          due_date: params.dueDate,
          priority: params.priority,
        })
        .eq('id', params.taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-transcript-tasks'] });
      toast.success('Task updated');
    },
    onError: (error) => {
      toast.error('Failed to update task: ' + error.message);
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('meeting_transcript_tasks')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .in('id', taskIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-transcript-pending-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['meeting-transcript-tasks'] });
      toast.success('Tasks approved');
    },
    onError: (error) => {
      toast.error('Failed to approve tasks: ' + error.message);
    },
  });

  const bulkDismissMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const { error } = await supabase
        .from('meeting_transcript_tasks')
        .update({ status: 'dismissed' })
        .in('id', taskIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-transcript-pending-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['meeting-transcript-tasks'] });
      toast.success('Tasks dismissed');
    },
    onError: (error) => {
      toast.error('Failed to dismiss tasks: ' + error.message);
    },
  });

  return {
    pendingTasks: pendingTasksQuery.data || [],
    isLoadingPending: pendingTasksQuery.isLoading,
    approveTask: approveTaskMutation.mutateAsync,
    dismissTask: dismissTaskMutation.mutateAsync,
    completeTask: completeTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    bulkApprove: bulkApproveMutation.mutateAsync,
    bulkDismiss: bulkDismissMutation.mutateAsync,
    isApproving: approveTaskMutation.isPending,
  };
}
