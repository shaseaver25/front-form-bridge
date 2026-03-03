import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BoardCardSubtask, BoardCardWithDetails } from '@/types/boards';
import { boardKeys } from './keys';

export function useAddSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, text }: { cardId: string; text: string }) => {
      // Get max position
      const { data: existingSubtasks } = await supabase
        .from('board_card_subtasks')
        .select('position')
        .eq('card_id', cardId)
        .order('position', { ascending: false })
        .limit(1);

      const maxPosition = existingSubtasks?.[0]?.position ?? -1;

      const { data, error } = await supabase
        .from('board_card_subtasks')
        .insert({
          card_id: cardId,
          text,
          position: maxPosition + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.all });
    },
  });
}

export function useToggleSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, subtaskId, currentCompleted }: { cardId: string; subtaskId: string; currentCompleted?: boolean }) => {
      const newCompleted = currentCompleted !== undefined ? !currentCompleted : true;
      
      const { data, error } = await supabase
        .from('board_card_subtasks')
        .update({
          is_completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq('id', subtaskId)
        .select('*, spawned_card_id')
        .single();

      if (error) throw error;

      // If this subtask has a spawned card, sync the completion status
      if (data.spawned_card_id) {
        const { data: spawnedCard } = await supabase
          .from('board_cards')
          .select('id, board_id, column_id')
          .eq('id', data.spawned_card_id)
          .single();

        if (spawnedCard && newCompleted) {
          const { data: doneColumn } = await supabase
            .from('board_columns')
            .select('id')
            .eq('board_id', spawnedCard.board_id)
            .eq('is_done_column', true)
            .single();

          if (doneColumn && doneColumn.id !== spawnedCard.column_id) {
            const { data: existingCards } = await supabase
              .from('board_cards')
              .select('position')
              .eq('column_id', doneColumn.id)
              .order('position', { ascending: false })
              .limit(1);

            await supabase
              .from('board_cards')
              .update({
                column_id: doneColumn.id,
                position: (existingCards?.[0]?.position ?? -1) + 1,
                completed_at: new Date().toISOString(),
              })
              .eq('id', data.spawned_card_id);
          }
        }
      }

      return data;
    },
    onMutate: async ({ cardId, subtaskId, currentCompleted }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.cardDetails(cardId) });
      const previousData = queryClient.getQueryData(boardKeys.cardDetails(cardId));
      
      queryClient.setQueryData(boardKeys.cardDetails(cardId), (old: BoardCardWithDetails | undefined) => {
        if (!old) return old;
        const newCompleted = currentCompleted !== undefined ? !currentCompleted : true;
        return {
          ...old,
          subtasks: old.subtasks?.map((subtask: BoardCardSubtask) =>
            subtask.id === subtaskId
              ? { 
                  ...subtask, 
                  is_completed: newCompleted, 
                  completed_at: newCompleted ? new Date().toISOString() : null 
                }
              : subtask
          ),
        };
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(boardKeys.cardDetails(variables.cardId), context.previousData);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.cardDetails(variables.cardId) });
      queryClient.invalidateQueries({ queryKey: boardKeys.all });
    },
  });
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, subtaskId }: { cardId: string; subtaskId: string }) => {
      const { error } = await supabase
        .from('board_card_subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.all });
    },
  });
}
