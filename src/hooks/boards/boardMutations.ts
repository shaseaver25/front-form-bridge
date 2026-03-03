import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Board } from '@/types/boards';
import { boardKeys } from './keys';

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Board> & { name: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const boardType = (data.board_type || 'general') as 'general' | 'grant_application' | 'event' | 'campaign' | 'program';

      const { data: board, error } = await supabase
        .from('boards')
        .insert({
          name: data.name,
          description: data.description,
          board_type: boardType,
          theme_color: data.theme_color || 'teal',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create default columns
      const defaultColumns: Array<{
        board_id: string;
        title: string;
        position: number;
        column_type: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'custom';
        is_done_column?: boolean;
      }> = [
        { board_id: board.id, title: 'To Do', position: 0, column_type: 'todo' },
        { board_id: board.id, title: 'In Progress', position: 1, column_type: 'in_progress' },
        { board_id: board.id, title: 'Done', position: 2, column_type: 'done', is_done_column: true },
      ];

      const { error: columnsError } = await supabase
        .from('board_columns')
        .insert(defaultColumns);

      if (columnsError) throw columnsError;

      // Add creator as owner
      await supabase
        .from('board_members')
        .insert({
          board_id: board.id,
          user_id: user.id,
          role: 'owner',
        });

      return board;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
    },
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ boardId, ...data }: { boardId: string } & Partial<Board>) => {
      // Filter out settings/column_order to avoid type issues, handle separately if needed
      const { settings, column_order, ...safeData } = data as Board & { settings?: unknown; column_order?: unknown };
      const updateData = { ...safeData, updated_at: new Date().toISOString() };
      
      const { data: board, error } = await supabase
        .from('boards')
        .update(updateData)
        .eq('id', boardId)
        .select()
        .single();

      if (error) throw error;
      return board;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(variables.boardId) });
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boardId: string) => {
      const { error } = await supabase
        .from('boards')
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq('id', boardId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
    },
  });
}
