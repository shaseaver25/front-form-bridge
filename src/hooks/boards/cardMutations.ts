import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BoardCard } from '@/types/boards';
import { spawnSubtaskCards, syncSpawnedCardToSubtask } from '../useSubtaskCardSpawning';
import { boardKeys } from './keys';
import { toast } from 'sonner';

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      boardId, 
      columnId, 
      headline,
      ...data 
    }: { 
      boardId: string; 
      columnId: string;
      headline: string;
    } & Partial<BoardCard>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get max position in column
      const { data: existingCards } = await supabase
        .from('board_cards')
        .select('position')
        .eq('column_id', columnId)
        .order('position', { ascending: false })
        .limit(1);

      const maxPosition = existingCards?.[0]?.position ?? -1;

      const { data: card, error } = await supabase
        .from('board_cards')
        .insert({
          board_id: boardId,
          column_id: columnId,
          headline,
          created_by: user.id,
          position: maxPosition + 1,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase
        .from('board_card_activity')
        .insert({
          card_id: card.id,
          user_id: user.id,
          activity_type: 'created',
          details: {},
        });

      return card;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(variables.boardId) });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, ...data }: { cardId: string } & Partial<BoardCard>) => {
      const { data: card, error } = await supabase
        .from('board_cards')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', cardId)
        .select('*, boards!board_cards_board_id_fkey(id)')
        .single();

      if (error) throw error;
      return card;
    },
    onSuccess: (data) => {
      const boardData = data?.boards as { id: string } | null;
      if (boardData?.id) {
        queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardData.id) });
      }
    },
  });
}

export function useMoveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      cardId, 
      toColumnId, 
      position 
    }: { 
      cardId: string; 
      toColumnId: string; 
      position: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Get current card to find board and old column
      const { data: currentCard } = await supabase
        .from('board_cards')
        .select('board_id, column_id')
        .eq('id', cardId)
        .single();

      const fromColumnId = currentCard?.column_id;

      // Update card position and column
      const { data: card, error } = await supabase
        .from('board_cards')
        .update({
          column_id: toColumnId,
          position,
          updated_at: new Date().toISOString(),
        })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;

      // Log move activity
      if (user && fromColumnId !== toColumnId) {
        await supabase
          .from('board_card_activity')
          .insert({
            card_id: cardId,
            user_id: user.id,
            activity_type: 'moved',
            details: { from_column: fromColumnId, to_column: toColumnId },
          });
      }

      // Check if moved to done column
      const { data: toColumn } = await supabase
        .from('board_columns')
        .select('is_done_column, title, column_type')
        .eq('id', toColumnId)
        .single();

      if (toColumn?.is_done_column && !card.completed_at) {
        await supabase
          .from('board_cards')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', cardId);

        // If this card was spawned from a subtask, sync completion back
        if (card.parent_subtask_id && user) {
          await syncSpawnedCardToSubtask({
            cardId,
            isCompleted: true,
            userId: user.id,
          });
        }

        if (user) {
          await supabase
            .from('board_card_activity')
            .insert({
              card_id: cardId,
              user_id: user.id,
              activity_type: 'completed',
              details: {},
            });
        }
      }

      // Spawn subtask cards when moving to a Progress column
      if (user && fromColumnId !== toColumnId && !card.parent_subtask_id && currentCard?.board_id) {
        const spawnResult = await spawnSubtaskCards({
          cardId,
          boardId: currentCard.board_id,
          toColumnId,
          userId: user.id,
        });

        if (spawnResult.spawned > 0) {
          toast.info(`Created ${spawnResult.spawned} subtask card${spawnResult.spawned > 1 ? 's' : ''}`);
        }
      }

      return { card, boardId: currentCard?.board_id };
    },
    onSuccess: (data) => {
      if (data?.boardId) {
        queryClient.invalidateQueries({ queryKey: boardKeys.detail(data.boardId) });
      }
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      // Get board ID first
      const { data: card } = await supabase
        .from('board_cards')
        .select('board_id')
        .eq('id', cardId)
        .single();

      const { error } = await supabase
        .from('board_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;
      return card?.board_id;
    },
    onSuccess: (boardId) => {
      if (boardId) {
        queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
      }
    },
  });
}

export function useDuplicateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, includeSubtasks = true }: { cardId: string; includeSubtasks?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch the original card
      const { data: originalCard, error: cardError } = await supabase
        .from('board_cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (cardError || !originalCard) throw cardError || new Error('Card not found');

      // Get max position in column
      const { data: existingCards } = await supabase
        .from('board_cards')
        .select('position')
        .eq('column_id', originalCard.column_id)
        .order('position', { ascending: false })
        .limit(1);

      const maxPosition = existingCards?.[0]?.position ?? -1;

      // Create the duplicate card
      const { data: newCard, error: insertError } = await supabase
        .from('board_cards')
        .insert({
          board_id: originalCard.board_id,
          column_id: originalCard.column_id,
          headline: `${originalCard.headline} (Copy)`,
          description: originalCard.description,
          priority: originalCard.priority,
          due_date: originalCard.due_date,
          assigned_to: originalCard.assigned_to,
          estimated_hours: originalCard.estimated_hours,
          is_blocked: false,
          blocked_reason: null,
          created_by: user.id,
          position: maxPosition + 1,
          linked_contact_id: originalCard.linked_contact_id,
          linked_grant_id: originalCard.linked_grant_id,
          linked_donation_id: originalCard.linked_donation_id,
          linked_board_id: originalCard.linked_board_id,
        })
        .select()
        .single();

      if (insertError || !newCard) throw insertError || new Error('Failed to create duplicate card');

      // Duplicate subtasks if requested
      if (includeSubtasks) {
        const { data: subtasks } = await supabase
          .from('board_card_subtasks')
          .select('*')
          .eq('card_id', cardId)
          .order('position');

        if (subtasks && subtasks.length > 0) {
          const subtasksToInsert = subtasks.map((subtask) => ({
            card_id: newCard.id,
            text: subtask.text,
            position: subtask.position,
            is_completed: false,
          }));

          await supabase.from('board_card_subtasks').insert(subtasksToInsert);
        }
      }

      // Log activity
      await supabase.from('board_card_activity').insert({
        card_id: newCard.id,
        user_id: user.id,
        activity_type: 'created',
        details: { duplicated_from: cardId },
      });

      return { card: newCard, boardId: originalCard.board_id };
    },
    onSuccess: (data) => {
      if (data?.boardId) {
        queryClient.invalidateQueries({ queryKey: boardKeys.detail(data.boardId) });
      }
    },
  });
}
