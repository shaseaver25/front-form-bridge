import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BoardCardComment, BoardCardWithDetails } from '@/types/boards';
import { boardKeys } from './keys';

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, content, userId }: { cardId: string; content: string; userId?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('board_card_comments')
        .insert({
          card_id: cardId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase
        .from('board_card_activity')
        .insert({
          card_id: cardId,
          user_id: user.id,
          activity_type: 'commented',
          details: {},
        });

      return data;
    },
    onMutate: async ({ cardId, content, userId }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.cardDetails(cardId) });
      const previousData = queryClient.getQueryData(boardKeys.cardDetails(cardId));
      
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        content,
        card_id: cardId,
        user_id: userId || 'unknown',
        created_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData(boardKeys.cardDetails(cardId), (old: BoardCardWithDetails | undefined) => {
        if (!old) return old;
        return {
          ...old,
          comments: [optimisticComment, ...(old.comments || [])],
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

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, commentId, content }: { cardId: string; commentId: string; content: string }) => {
      const { data, error } = await supabase
        .from('board_card_comments')
        .update({ content })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ cardId, commentId, content }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.cardDetails(cardId) });
      const previousData = queryClient.getQueryData(boardKeys.cardDetails(cardId));
      
      queryClient.setQueryData(boardKeys.cardDetails(cardId), (old: BoardCardWithDetails | undefined) => {
        if (!old) return old;
        return {
          ...old,
          comments: old.comments?.map((comment: BoardCardComment) =>
            comment.id === commentId ? { ...comment, content } : comment
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
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, commentId }: { cardId: string; commentId: string }) => {
      const { error } = await supabase
        .from('board_card_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
    },
    onMutate: async ({ cardId, commentId }) => {
      await queryClient.cancelQueries({ queryKey: boardKeys.cardDetails(cardId) });
      const previousData = queryClient.getQueryData(boardKeys.cardDetails(cardId));
      
      queryClient.setQueryData(boardKeys.cardDetails(cardId), (old: BoardCardWithDetails | undefined) => {
        if (!old) return old;
        return {
          ...old,
          comments: old.comments?.filter((comment: BoardCardComment) => comment.id !== commentId),
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
    },
  });
}
