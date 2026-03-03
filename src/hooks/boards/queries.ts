import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Board, BoardColumn, BoardCard, BoardMember, BoardCardSubtask, BoardCardComment } from '@/types/boards';
import { boardKeys } from './keys';

interface BoardWithData {
  board: Board;
  columns: BoardColumn[];
  cards: BoardCard[];
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: async (): Promise<BoardWithData> => {
      // Fetch board
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (boardError) throw boardError;

      // Fetch columns
      const { data: columns, error: columnsError } = await supabase
        .from('board_columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position');

      if (columnsError) throw columnsError;

      // Fetch cards
      const { data: cards, error: cardsError } = await supabase
        .from('board_cards')
        .select('*')
        .eq('board_id', boardId)
        .order('position');

      if (cardsError) throw cardsError;

      return {
        board: board as Board,
        columns: columns as BoardColumn[],
        cards: cards as BoardCard[],
      };
    },
    enabled: !!boardId,
  });
}

export function useBoards(filters?: { archived?: boolean; type?: string }) {
  return useQuery({
    queryKey: boardKeys.list(filters ?? {}),
    queryFn: async () => {
      let query = supabase
        .from('boards')
        .select(`
          *,
          board_columns(count),
          board_cards!board_cards_board_id_fkey(count),
          board_members(count)
        `)
        .order('updated_at', { ascending: false });

      if (filters?.archived !== undefined) {
        query = query.eq('is_archived', filters.archived);
      }
      if (filters?.type) {
        const boardType = filters.type as 'general' | 'grant_application' | 'event' | 'campaign' | 'program';
        query = query.eq('board_type', boardType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useBoardMembers(boardId: string) {
  return useQuery({
    queryKey: boardKeys.members(boardId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('board_members')
        .select('*')
        .eq('board_id', boardId);

      if (error) throw error;
      return data as BoardMember[];
    },
    enabled: !!boardId,
  });
}

export function useCardDetails(cardId: string) {
  return useQuery({
    queryKey: boardKeys.cardDetails(cardId),
    queryFn: async () => {
      const [subtasksResult, commentsResult, activityResult] = await Promise.all([
        supabase
          .from('board_card_subtasks')
          .select('*')
          .eq('card_id', cardId)
          .order('position'),
        supabase
          .from('board_card_comments')
          .select('*')
          .eq('card_id', cardId)
          .order('created_at', { ascending: false }),
        supabase
          .from('board_card_activity')
          .select('*')
          .eq('card_id', cardId)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      return {
        subtasks: (subtasksResult.data || []) as BoardCardSubtask[],
        comments: (commentsResult.data || []) as BoardCardComment[],
        activity: activityResult.data || [],
      };
    },
    enabled: !!cardId,
  });
}
