import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BoardColumn } from '@/types/boards';
import { boardKeys } from './keys';

export function useCreateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, title }: { boardId: string; title: string }) => {
      // Get max position
      const { data: existingColumns } = await supabase
        .from('board_columns')
        .select('position')
        .eq('board_id', boardId)
        .order('position', { ascending: false })
        .limit(1);

      const maxPosition = existingColumns?.[0]?.position ?? -1;

      const { data, error } = await supabase
        .from('board_columns')
        .insert({
          board_id: boardId,
          title,
          position: maxPosition + 1,
          column_type: 'custom',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(variables.boardId) });
    },
  });
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ columnId, ...data }: { columnId: string } & Partial<BoardColumn>) => {
      const { data: column, error } = await supabase
        .from('board_columns')
        .update(data)
        .eq('id', columnId)
        .select('*, boards(id)')
        .single();

      if (error) throw error;
      return column;
    },
    onSuccess: (data) => {
      if (data?.boards?.id) {
        queryClient.invalidateQueries({ queryKey: boardKeys.detail(data.boards.id) });
      }
    },
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (columnId: string) => {
      // Get board ID first
      const { data: column } = await supabase
        .from('board_columns')
        .select('board_id')
        .eq('id', columnId)
        .single();

      const { error } = await supabase
        .from('board_columns')
        .delete()
        .eq('id', columnId);

      if (error) throw error;
      return column?.board_id;
    },
    onSuccess: (boardId) => {
      if (boardId) {
        queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
      }
    },
  });
}

export function useReorderColumns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      boardId, 
      columnUpdates 
    }: { 
      boardId: string; 
      columnUpdates: Array<{ id: string; position: number }>;
    }) => {
      const promises = columnUpdates.map(({ id, position }) =>
        supabase
          .from('board_columns')
          .update({ position })
          .eq('id', id)
      );

      await Promise.all(promises);
      return boardId;
    },
    onSuccess: (boardId) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });
}
