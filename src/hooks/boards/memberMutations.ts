import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { boardKeys } from './keys';

export function useAddBoardMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      boardId, 
      userId, 
      role = 'member' 
    }: { 
      boardId: string; 
      userId: string; 
      role?: 'owner' | 'admin' | 'member' | 'viewer';
    }) => {
      const { data, error } = await supabase
        .from('board_members')
        .insert({
          board_id: boardId,
          user_id: userId,
          role,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.members(variables.boardId) });
    },
  });
}

export function useUpdateBoardMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      memberId, 
      role,
      boardId,
    }: { 
      memberId: string; 
      role: 'owner' | 'admin' | 'member' | 'viewer';
      boardId: string;
    }) => {
      const { data, error } = await supabase
        .from('board_members')
        .update({ role })
        .eq('id', memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.members(variables.boardId) });
    },
  });
}

export function useRemoveBoardMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, boardId }: { memberId: string; boardId: string }) => {
      const { error } = await supabase
        .from('board_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.members(variables.boardId) });
    },
  });
}
