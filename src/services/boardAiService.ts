import { supabase } from '@/integrations/supabase/client';
import { BoardCard, BoardColumn, Board, BoardCardActivity } from '@/types/boards';

export interface SuggestedCard {
  headline: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  columnTitle: string;
}

export interface TimeEstimate {
  hours: number;
  reasoning: string;
}

export interface UnblockSuggestion {
  suggestions: string[];
  nextSteps: string[];
}

export interface SprintPlan {
  plan: string;
  selectedCardIds: string[];
  estimatedHours: number;
}

export interface BoardInsights {
  velocity: string;
  bottlenecks: string[];
  recommendations: string[];
}

type BoardContext = {
  board?: Partial<Board>;
  columns?: Partial<BoardColumn>[];
  cards?: Partial<BoardCard>[];
  card?: Partial<BoardCard>;
  activities?: Partial<BoardCardActivity>[];
  teamCapacity?: number;
};

async function callBoardAI<T>(operation: string, context: BoardContext): Promise<T> {
  const { data, error } = await supabase.functions.invoke('board-ai-assistant', {
    body: { operation, context },
  });

  if (error) {
    console.error('Board AI error:', error);
    throw new Error(error.message || 'Failed to get AI response');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data.result as T;
}

export const boardAiService = {
  getSuggestions: async (
    board: Partial<Board>,
    columns: Partial<BoardColumn>[],
    cards: Partial<BoardCard>[]
  ): Promise<SuggestedCard[]> => {
    const result = await callBoardAI<SuggestedCard[]>('suggest_tasks', { board, columns, cards });
    return Array.isArray(result) ? result : [];
  },

  getTimeEstimate: async (card: Partial<BoardCard>): Promise<TimeEstimate> => {
    return callBoardAI<TimeEstimate>('estimate_time', { card });
  },

  getUnblockSuggestion: async (
    card: Partial<BoardCard>,
    cards: Partial<BoardCard>[]
  ): Promise<UnblockSuggestion> => {
    return callBoardAI<UnblockSuggestion>('unblock_suggestion', { card, cards });
  },

  smartSort: async (cards: Partial<BoardCard>[]): Promise<string[]> => {
    const result = await callBoardAI<{ sortedIds: string[] }>('smart_sort', { cards });
    return result.sortedIds || [];
  },

  getSprintPlan: async (
    board: Partial<Board>,
    cards: Partial<BoardCard>[],
    teamCapacity: number
  ): Promise<SprintPlan> => {
    return callBoardAI<SprintPlan>('sprint_plan', { board, cards, teamCapacity });
  },

  summarizeActivity: async (
    card: Partial<BoardCard>,
    activities: Partial<BoardCardActivity>[]
  ): Promise<string> => {
    const result = await callBoardAI<{ summary: string }>('summarize_activity', { card, activities });
    return result.summary || 'No activity to summarize.';
  },

  getBoardInsights: async (
    board: Partial<Board>,
    columns: Partial<BoardColumn>[],
    cards: Partial<BoardCard>[]
  ): Promise<BoardInsights> => {
    return callBoardAI<BoardInsights>('board_insights', { board, columns, cards });
  },

  generateSubtasks: async (
    headline: string,
    description?: string
  ): Promise<string[]> => {
    const result = await callBoardAI<{ subtasks: string[] }>('generate_subtasks', {
      card: { headline, description },
    });
    return result.subtasks || [];
  },
};