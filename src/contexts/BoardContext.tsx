import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Board, BoardColumn, BoardCard, BoardMember } from '@/types/boards';
import { useBoard, useCreateCard, useUpdateCard, useDeleteCard, useDuplicateCard, useMoveCard, useCreateColumn, useUpdateColumn, useDeleteColumn, useUpdateBoard, useBoardMembers, useAddSubtask, useToggleSubtask, useDeleteSubtask, useAddComment, useUpdateComment, useDeleteComment, useStartTimer, useStopTimer } from '@/hooks/useBoardData';
import { toast } from 'sonner';
import { sendAssignmentNotification } from '@/hooks/useAssignmentNotification';

interface BoardFilters {
  assignee: string | null;
  priority: string | null;
  dueDate: 'overdue' | 'today' | 'week' | null;
}

interface BoardState {
  // Data
  board: Board | null;
  columns: BoardColumn[];
  cards: BoardCard[];
  members: BoardMember[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedCard: BoardCard | null;
  isCardModalOpen: boolean;
  isDragging: boolean;
  searchQuery: string;
  filters: BoardFilters;
  
  // View Options
  viewMode: 'board' | 'calendar' | 'list';
  swimlaneBy: 'assignee' | 'priority' | null;
  showCompletedCards: boolean;
  
  // AI State
  isAiLoading: boolean;
  aiSuggestions: BoardCard[];
  
  // Timer State
  activeTimerCardId: string | null;
  timerStartedAt: Date | null;
}

type BoardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_BOARD'; payload: Board | null }
  | { type: 'SET_COLUMNS'; payload: BoardColumn[] }
  | { type: 'SET_CARDS'; payload: BoardCard[] }
  | { type: 'SET_MEMBERS'; payload: BoardMember[] }
  | { type: 'SET_SELECTED_CARD'; payload: BoardCard | null }
  | { type: 'SET_CARD_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_DRAGGING'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_FILTERS'; payload: Partial<BoardFilters> }
  | { type: 'SET_VIEW_MODE'; payload: 'board' | 'calendar' | 'list' }
  | { type: 'SET_SWIMLANE_BY'; payload: 'assignee' | 'priority' | null }
  | { type: 'SET_SHOW_COMPLETED'; payload: boolean }
  | { type: 'SET_AI_LOADING'; payload: boolean }
  | { type: 'SET_AI_SUGGESTIONS'; payload: BoardCard[] }
  | { type: 'START_TIMER'; payload: { cardId: string; startedAt: Date } }
  | { type: 'STOP_TIMER' }
  | { type: 'OPTIMISTIC_MOVE_CARD'; payload: { cardId: string; toColumnId: string; position: number } };

const initialState: BoardState = {
  board: null,
  columns: [],
  cards: [],
  members: [],
  isLoading: true,
  error: null,
  selectedCard: null,
  isCardModalOpen: false,
  isDragging: false,
  searchQuery: '',
  filters: {
    assignee: null,
    priority: null,
    dueDate: null,
  },
  viewMode: 'board',
  swimlaneBy: null,
  showCompletedCards: true,
  isAiLoading: false,
  aiSuggestions: [],
  activeTimerCardId: null,
  timerStartedAt: null,
};

function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_BOARD':
      return { ...state, board: action.payload };
    case 'SET_COLUMNS':
      return { ...state, columns: action.payload };
    case 'SET_CARDS':
      return { ...state, cards: action.payload };
    case 'SET_MEMBERS':
      return { ...state, members: action.payload };
    case 'SET_SELECTED_CARD':
      return { ...state, selectedCard: action.payload };
    case 'SET_CARD_MODAL_OPEN':
      return { ...state, isCardModalOpen: action.payload };
    case 'SET_DRAGGING':
      return { ...state, isDragging: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_SWIMLANE_BY':
      return { ...state, swimlaneBy: action.payload };
    case 'SET_SHOW_COMPLETED':
      return { ...state, showCompletedCards: action.payload };
    case 'SET_AI_LOADING':
      return { ...state, isAiLoading: action.payload };
    case 'SET_AI_SUGGESTIONS':
      return { ...state, aiSuggestions: action.payload };
    case 'START_TIMER':
      return { 
        ...state, 
        activeTimerCardId: action.payload.cardId,
        timerStartedAt: action.payload.startedAt 
      };
    case 'STOP_TIMER':
      return { ...state, activeTimerCardId: null, timerStartedAt: null };
    case 'OPTIMISTIC_MOVE_CARD':
      return {
        ...state,
        cards: state.cards.map(card => 
          card.id === action.payload.cardId
            ? { ...card, column_id: action.payload.toColumnId, position: action.payload.position }
            : card
        ),
      };
    default:
      return state;
  }
}

interface BoardDispatch {
  // Card Operations
  createCard: (columnId: string, data: Partial<BoardCard>) => Promise<void>;
  updateCard: (cardId: string, data: Partial<BoardCard>) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  duplicateCard: (cardId: string, includeSubtasks?: boolean) => Promise<void>;
  moveCard: (cardId: string, toColumnId: string, position: number) => Promise<void>;
  
  // Column Operations
  createColumn: (title: string) => Promise<void>;
  updateColumn: (columnId: string, data: Partial<BoardColumn>) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  reorderColumns: (columnOrder: string[]) => Promise<void>;
  
  // Subtasks
  addSubtask: (cardId: string, text: string) => Promise<void>;
  toggleSubtask: (cardId: string, subtaskId: string, currentCompleted?: boolean) => Promise<void>;
  deleteSubtask: (cardId: string, subtaskId: string) => Promise<void>;
  
  // Comments
  addComment: (cardId: string, content: string) => Promise<void>;
  updateComment: (cardId: string, commentId: string, content: string) => Promise<void>;
  deleteComment: (cardId: string, commentId: string) => Promise<void>;
  // Time Tracking
  startTimer: (cardId: string) => void;
  stopTimer: (cardId: string) => Promise<void>;
  
  // AI Features
  getAiSuggestions: () => Promise<void>;
  getAiTimeEstimate: (cardId: string) => Promise<void>;
  getAiUnblockSuggestion: (cardId: string) => Promise<void>;
  
  // UI
  openCardModal: (card?: BoardCard) => void;
  closeCardModal: () => void;
  setFilters: (filters: Partial<BoardFilters>) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: 'board' | 'calendar' | 'list') => void;
  setSwimlaneBy: (by: 'assignee' | 'priority' | null) => void;
  setShowCompletedCards: (show: boolean) => void;
  setDragging: (dragging: boolean) => void;
}

interface BoardContextValue {
  state: BoardState;
  dispatch: BoardDispatch;
}

const BoardContext = createContext<BoardContextValue | null>(null);

interface BoardProviderProps {
  boardId: string;
  children: ReactNode;
}

export function BoardProvider({ boardId, children }: BoardProviderProps) {
  const [state, reducerDispatch] = useReducer(boardReducer, initialState);
  
  // React Query hooks
  const { data: boardData, isLoading, error } = useBoard(boardId);
  const { data: membersData } = useBoardMembers(boardId);
  
  const createCardMutation = useCreateCard();
  const updateCardMutation = useUpdateCard();
  const deleteCardMutation = useDeleteCard();
  const duplicateCardMutation = useDuplicateCard();
  const moveCardMutation = useMoveCard();
  const createColumnMutation = useCreateColumn();
  const updateColumnMutation = useUpdateColumn();
  const deleteColumnMutation = useDeleteColumn();
  const updateBoardMutation = useUpdateBoard();
  const addSubtaskMutation = useAddSubtask();
  const toggleSubtaskMutation = useToggleSubtask();
  const deleteSubtaskMutation = useDeleteSubtask();
  const addCommentMutation = useAddComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();
  const startTimerMutation = useStartTimer();
  const stopTimerMutation = useStopTimer();

  // Sync React Query data with local state
  React.useEffect(() => {
    reducerDispatch({ type: 'SET_LOADING', payload: isLoading });
  }, [isLoading]);

  React.useEffect(() => {
    if (error) {
      reducerDispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [error]);

  React.useEffect(() => {
    if (boardData) {
      reducerDispatch({ type: 'SET_BOARD', payload: boardData.board });
      reducerDispatch({ type: 'SET_COLUMNS', payload: boardData.columns });
      reducerDispatch({ type: 'SET_CARDS', payload: boardData.cards });
    }
  }, [boardData]);

  React.useEffect(() => {
    if (membersData) {
      reducerDispatch({ type: 'SET_MEMBERS', payload: membersData });
    }
  }, [membersData]);

  // Dispatch actions
  const dispatch: BoardDispatch = {
    // Card Operations
    createCard: useCallback(async (columnId: string, data: Partial<BoardCard>) => {
      try {
        await createCardMutation.mutateAsync({ 
          boardId, 
          columnId, 
          headline: data.headline || 'New Card',
          ...data 
        });
        toast.success('Card created');
      } catch (err) {
        toast.error('Failed to create card');
        throw err;
      }
    }, [boardId, createCardMutation]),

    updateCard: useCallback(async (cardId: string, data: Partial<BoardCard>) => {
      try {
        // Check if assigned_to is changing
        const currentCard = state.cards.find(c => c.id === cardId);
        const isNewAssignment = data.assigned_to && 
          data.assigned_to !== currentCard?.assigned_to;

        await updateCardMutation.mutateAsync({ cardId, ...data });

        // Send notification if there's a new assignment
        if (isNewAssignment && data.assigned_to && state.board) {
          sendAssignmentNotification({
            assigneeUserId: data.assigned_to,
            itemName: currentCard?.headline || 'Task',
            itemType: 'task',
            projectName: state.board.name,
            itemId: cardId,
          }).catch(console.error); // Fire and forget
        }
      } catch (err) {
        toast.error('Failed to update card');
        throw err;
      }
    }, [updateCardMutation, state.cards, state.board]),

    deleteCard: useCallback(async (cardId: string) => {
      try {
        await deleteCardMutation.mutateAsync(cardId);
        toast.success('Card deleted');
        reducerDispatch({ type: 'SET_CARD_MODAL_OPEN', payload: false });
      } catch (err) {
        toast.error('Failed to delete card');
        throw err;
      }
    }, [deleteCardMutation]),

    duplicateCard: useCallback(async (cardId: string, includeSubtasks = true) => {
      try {
        await duplicateCardMutation.mutateAsync({ cardId, includeSubtasks });
        toast.success('Card duplicated');
      } catch (err) {
        toast.error('Failed to duplicate card');
        throw err;
      }
    }, [duplicateCardMutation]),

    moveCard: useCallback(async (cardId: string, toColumnId: string, position: number) => {
      // Optimistic update
      reducerDispatch({ type: 'OPTIMISTIC_MOVE_CARD', payload: { cardId, toColumnId, position } });
      try {
        await moveCardMutation.mutateAsync({ cardId, toColumnId, position });
      } catch (err) {
        toast.error('Failed to move card');
        throw err;
      }
    }, [moveCardMutation]),

    // Column Operations
    createColumn: useCallback(async (title: string) => {
      try {
        await createColumnMutation.mutateAsync({ boardId, title });
        toast.success('Column created');
      } catch (err) {
        toast.error('Failed to create column');
        throw err;
      }
    }, [boardId, createColumnMutation]),

    updateColumn: useCallback(async (columnId: string, data: Partial<BoardColumn>) => {
      try {
        await updateColumnMutation.mutateAsync({ columnId, ...data });
      } catch (err) {
        toast.error('Failed to update column');
        throw err;
      }
    }, [updateColumnMutation]),

    deleteColumn: useCallback(async (columnId: string) => {
      try {
        await deleteColumnMutation.mutateAsync(columnId);
        toast.success('Column deleted');
      } catch (err) {
        toast.error('Failed to delete column');
        throw err;
      }
    }, [deleteColumnMutation]),

    reorderColumns: useCallback(async (columnOrder: string[]) => {
      try {
        await updateBoardMutation.mutateAsync({ boardId, column_order: columnOrder });
      } catch (err) {
        toast.error('Failed to reorder columns');
        throw err;
      }
    }, [boardId, updateBoardMutation]),

    // Subtasks
    addSubtask: useCallback(async (cardId: string, text: string) => {
      try {
        await addSubtaskMutation.mutateAsync({ cardId, text });
      } catch (err) {
        toast.error('Failed to add subtask');
        throw err;
      }
    }, [addSubtaskMutation]),

    toggleSubtask: useCallback(async (cardId: string, subtaskId: string, currentCompleted?: boolean) => {
      try {
        await toggleSubtaskMutation.mutateAsync({ cardId, subtaskId, currentCompleted });
      } catch (err) {
        toast.error('Failed to update subtask');
        throw err;
      }
    }, [toggleSubtaskMutation]),

    deleteSubtask: useCallback(async (cardId: string, subtaskId: string) => {
      try {
        await deleteSubtaskMutation.mutateAsync({ cardId, subtaskId });
      } catch (err) {
        toast.error('Failed to delete subtask');
        throw err;
      }
    }, [deleteSubtaskMutation]),

    // Comments
    addComment: useCallback(async (cardId: string, content: string) => {
      try {
        await addCommentMutation.mutateAsync({ cardId, content });
      } catch (err) {
        toast.error('Failed to add comment');
        throw err;
      }
    }, [addCommentMutation]),

    updateComment: useCallback(async (cardId: string, commentId: string, content: string) => {
      try {
        await updateCommentMutation.mutateAsync({ cardId, commentId, content });
      } catch (err) {
        toast.error('Failed to update comment');
        throw err;
      }
    }, [updateCommentMutation]),

    deleteComment: useCallback(async (cardId: string, commentId: string) => {
      try {
        await deleteCommentMutation.mutateAsync({ cardId, commentId });
        toast.success('Comment deleted');
      } catch (err) {
        toast.error('Failed to delete comment');
        throw err;
      }
    }, [deleteCommentMutation]),

    // Time Tracking
    startTimer: useCallback((cardId: string) => {
      reducerDispatch({ type: 'START_TIMER', payload: { cardId, startedAt: new Date() } });
      startTimerMutation.mutate({ cardId });
    }, [startTimerMutation]),

    stopTimer: useCallback(async (cardId: string) => {
      try {
        await stopTimerMutation.mutateAsync({ cardId });
        reducerDispatch({ type: 'STOP_TIMER' });
      } catch (err) {
        toast.error('Failed to stop timer');
        throw err;
      }
    }, [stopTimerMutation]),

    // AI Features
    getAiSuggestions: useCallback(async () => {
      reducerDispatch({ type: 'SET_AI_LOADING', payload: true });
      try {
        // AI suggestions feature - not yet implemented
        // Future: integrate with boardAiService
        toast.info('AI card suggestions are coming in a future update');
        reducerDispatch({ type: 'SET_AI_SUGGESTIONS', payload: [] });
      } finally {
        reducerDispatch({ type: 'SET_AI_LOADING', payload: false });
      }
    }, []),

    getAiTimeEstimate: useCallback(async (cardId: string) => {
      // AI time estimation feature - not yet implemented
      toast.info('AI time estimation is coming in a future update');
    }, []),

    getAiUnblockSuggestion: useCallback(async (cardId: string) => {
      // AI unblock suggestions feature - not yet implemented
      toast.info('AI unblock suggestions are coming in a future update');
    }, []),

    // UI
    openCardModal: useCallback((card?: BoardCard) => {
      if (card) {
        reducerDispatch({ type: 'SET_SELECTED_CARD', payload: card });
      }
      reducerDispatch({ type: 'SET_CARD_MODAL_OPEN', payload: true });
    }, []),

    closeCardModal: useCallback(() => {
      reducerDispatch({ type: 'SET_CARD_MODAL_OPEN', payload: false });
      reducerDispatch({ type: 'SET_SELECTED_CARD', payload: null });
    }, []),

    setFilters: useCallback((filters: Partial<BoardFilters>) => {
      reducerDispatch({ type: 'SET_FILTERS', payload: filters });
    }, []),

    setSearchQuery: useCallback((query: string) => {
      reducerDispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    }, []),

    setViewMode: useCallback((mode: 'board' | 'calendar' | 'list') => {
      reducerDispatch({ type: 'SET_VIEW_MODE', payload: mode });
    }, []),

    setSwimlaneBy: useCallback((by: 'assignee' | 'priority' | null) => {
      reducerDispatch({ type: 'SET_SWIMLANE_BY', payload: by });
    }, []),

    setShowCompletedCards: useCallback((show: boolean) => {
      reducerDispatch({ type: 'SET_SHOW_COMPLETED', payload: show });
    }, []),

    setDragging: useCallback((dragging: boolean) => {
      reducerDispatch({ type: 'SET_DRAGGING', payload: dragging });
    }, []),
  };

  return (
    <BoardContext.Provider value={{ state, dispatch }}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoardContext() {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardContext must be used within a BoardProvider');
  }
  return context;
}

// Selector hooks for optimized re-renders
export function useBoardState() {
  const { state } = useBoardContext();
  return state;
}

export function useBoardDispatch() {
  const { dispatch } = useBoardContext();
  return dispatch;
}

export function useFilteredCards() {
  const { state } = useBoardContext();
  const { cards, searchQuery, filters, showCompletedCards, columns } = state;
  
  return React.useMemo(() => {
    let filtered = [...cards];
    
    // Filter out completed cards if not showing them
    if (!showCompletedCards) {
      const doneColumnIds = columns
        .filter(col => col.is_done_column)
        .map(col => col.id);
      filtered = filtered.filter(card => !doneColumnIds.includes(card.column_id));
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(card =>
        card.headline.toLowerCase().includes(query) ||
        card.description?.toLowerCase().includes(query)
      );
    }
    
    // Assignee filter
    if (filters.assignee) {
      filtered = filtered.filter(card => card.assigned_to === filters.assignee);
    }
    
    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(card => card.priority === filters.priority);
    }
    
    // Due date filter
    if (filters.dueDate) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      
      filtered = filtered.filter(card => {
        if (!card.due_date) return false;
        const dueDate = new Date(card.due_date);
        
        switch (filters.dueDate) {
          case 'overdue':
            return dueDate < today;
          case 'today':
            return dueDate.toDateString() === today.toDateString();
          case 'week':
            return dueDate >= today && dueDate <= weekFromNow;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  }, [cards, searchQuery, filters, showCompletedCards, columns]);
}

export function useCardsByColumn(columnId: string) {
  const filteredCards = useFilteredCards();
  
  return React.useMemo(() => {
    return filteredCards
      .filter(card => card.column_id === columnId)
      .sort((a, b) => a.position - b.position);
  }, [filteredCards, columnId]);
}
