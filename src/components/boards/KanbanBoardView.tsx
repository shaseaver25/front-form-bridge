import { useState, useRef, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Settings, 
  Sparkles,
  LayoutGrid,
  Calendar,
  List,
  Users,
  Keyboard,
  ArrowLeft
} from 'lucide-react';
import { useBoardContext, useCardsByColumn } from '@/contexts/BoardContext';
import { useBoardKeyboardShortcuts } from '@/hooks/useBoardKeyboardShortcuts';
import { useBoardPermissions } from '@/hooks/useBoardPermissions';
import { BoardColumn } from './BoardColumn';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { BoardEmptyState } from './BoardEmptyState';
import { BoardSkeleton } from './BoardSkeletons';
import { CardModal } from './CardModal';
import { BoardSettingsSheet } from './BoardSettingsSheet';
import { InviteMembersDialog } from './InviteMembersDialog';
import { AiAgendaParser } from './AiAgendaParser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { BoardCard as BoardCardType, BoardColumn as BoardColumnType } from '@/types/boards';

// Column wrapper to use the hook properly
function ColumnWithCards({
  column, 
  onCardClick, 
  onAddCard, 
  onUpdateColumn, 
  onDeleteColumn,
  onRenameCard
}: {
  column: BoardColumnType;
  onCardClick: (card: BoardCardType) => void;
  onAddCard: (columnId: string, headline: string) => void;
  onUpdateColumn: (columnId: string, data: Record<string, unknown>) => void;
  onDeleteColumn: (columnId: string) => void;
  onRenameCard: (cardId: string, newHeadline: string) => void;
}) {
  const cards = useCardsByColumn(column.id);
  
  return (
    <BoardColumn
      column={column}
      cards={cards}
      onCardClick={onCardClick}
      onAddCard={(headline) => onAddCard(column.id, headline)}
      onUpdateColumn={(data) => onUpdateColumn(column.id, data)}
      onDeleteColumn={() => onDeleteColumn(column.id)}
      onRenameCard={onRenameCard}
    />
  );
}

function KanbanBoardViewContent() {
  const navigate = useNavigate();
  const { state, dispatch } = useBoardContext();
  const { board, columns, isLoading, error, searchQuery, filters, viewMode } = state;
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [showFirstColumnAddCard, setShowFirstColumnAddCard] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Permissions
  const permissions = useBoardPermissions(board?.id || '');

  // Keyboard shortcuts
  const { showShortcutsHelp, setShowShortcutsHelp } = useBoardKeyboardShortcuts({
    enabled: true,
    onNewCard: useCallback(() => {
      // Focus first column's add card
      setShowFirstColumnAddCard(true);
    }, []),
    onOpenSearch: useCallback(() => {
      searchInputRef.current?.focus();
    }, []),
  });
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    dispatch.moveCard(draggableId, destination.droppableId, destination.index);
  };

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      dispatch.createColumn(newColumnTitle.trim());
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  const handleAddCard = (columnId: string, headline: string) => {
    dispatch.createCard(columnId, { headline });
  };

  const handleCardClick = (card: BoardCardType) => {
    dispatch.openCardModal(card);
  };

  // Loading state
  if (isLoading) {
    return <BoardSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Board not found</p>
      </div>
    );
  }

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

  return (
    <div className="h-full flex flex-col">
      {/* Board Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/projects')}
            className="mr-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">{board.name}</h1>
          {board.board_type !== 'general' && (
            <Badge variant="secondary" className="capitalize">
              {board.board_type?.replace('_', ' ')}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <ToggleGroup 
            type="single" 
            value={viewMode}
            onValueChange={(value) => value && dispatch.setViewMode(value as 'board' | 'calendar' | 'list')}
            className="border rounded-md"
          >
            <ToggleGroupItem value="board" size="sm" className="px-2">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" size="sm" className="px-2">
              <Calendar className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" size="sm" className="px-2">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search cards... (/)"
              value={searchQuery}
              onChange={(e) => dispatch.setSearchQuery(e.target.value)}
              className="pl-8 w-48"
            />
          </div>

          {/* Filters */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className={cn(
                (filters.assignee || filters.priority || filters.dueDate) && "border-primary"
              )}>
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 bg-popover">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select 
                    value={filters.priority || 'all'} 
                    onValueChange={(v) => dispatch.setFilters({ priority: v === 'all' ? null : v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All priorities</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <Select 
                    value={filters.dueDate || 'all'} 
                    onValueChange={(v) => dispatch.setFilters({ dueDate: v === 'all' ? null : v as 'overdue' | 'today' | 'week' })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All dates</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="today">Due today</SelectItem>
                      <SelectItem value="week">Due this week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(filters.priority || filters.dueDate) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => dispatch.setFilters({ priority: null, dueDate: null, assignee: null })}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Members & Invite */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex -space-x-2">
              {state.members.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    <Users className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
              ))}
              {state.members.length > 3 && (
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                  +{state.members.length - 3}
                </div>
              )}
            </div>
            {permissions.canInviteMembers && board && (
              <InviteMembersDialog
                boardId={board.id}
                boardName={board.name}
                existingMembers={state.members.map(m => ({
                  id: m.id,
                  user_id: m.user_id,
                  role: m.role || 'member',
                  added_at: m.added_at || new Date().toISOString(),
                }))}
                createdBy={board.created_by}
              />
            )}
          </div>

          {/* AI Agenda Parser */}
          <AiAgendaParser />

          {/* AI Suggest - hidden on mobile */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => dispatch.getAiSuggestions()}
            disabled={state.isAiLoading}
            className="hidden sm:flex"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Suggest
          </Button>

          {/* Keyboard shortcuts */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowShortcutsHelp(true)}
                className="hidden md:flex"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Keyboard shortcuts (?)</TooltipContent>
          </Tooltip>

          {/* Settings - only for admins */}
          {permissions.canManageSettings && (
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Board Content */}
      {viewMode === 'board' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex-1 flex gap-4 p-4 overflow-x-auto bg-muted/30">
            {sortedColumns.map((column) => (
              <ColumnWithCards
                key={column.id}
                column={column}
                onCardClick={handleCardClick}
                onAddCard={handleAddCard}
                onUpdateColumn={(columnId, data) => dispatch.updateColumn(columnId, data)}
                onDeleteColumn={(columnId) => dispatch.deleteColumn(columnId)}
                onRenameCard={(cardId, newHeadline) => dispatch.updateCard(cardId, { headline: newHeadline })}
              />
            ))}

            {/* Add Column */}
            <div className="w-72 min-w-72">
              {isAddingColumn ? (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <Input
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    placeholder="Column title..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddColumn();
                      if (e.key === 'Escape') {
                        setNewColumnTitle('');
                        setIsAddingColumn(false);
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddColumn}>
                      Add Column
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setNewColumnTitle('');
                        setIsAddingColumn(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : permissions.canManageColumns ? (
                <Button
                  variant="ghost"
                  onClick={() => setIsAddingColumn(true)}
                  className="w-full h-12 border-2 border-dashed border-muted-foreground/30 hover:border-primary/50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Column
                </Button>
              ) : null}
            </div>
          </div>
        </DragDropContext>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="flex-1 flex items-center justify-center bg-muted/30">
          <div className="text-center space-y-2">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">Calendar View</h3>
            <p className="text-sm text-muted-foreground">Coming soon - view cards by due date</p>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="flex-1 flex items-center justify-center bg-muted/30">
          <div className="text-center space-y-2">
            <List className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-medium">List View</h3>
            <p className="text-sm text-muted-foreground">Coming soon - view all cards as a list</p>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog 
        open={showShortcutsHelp} 
        onOpenChange={setShowShortcutsHelp} 
      />

      {/* Card Modal */}
      {state.selectedCard && (
        <CardModal
          card={{
            ...state.selectedCard,
            subtasks: [],
            comments: [],
            activity: [],
            dependencies: [],
            time_logs: [],
          }}
          columns={columns}
          isOpen={state.isCardModalOpen}
          onClose={() => dispatch.closeCardModal()}
        />
      )}

      {/* Board Settings Sheet */}
      {board && (
        <BoardSettingsSheet
          board={board}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          showCompletedCards={state.showCompletedCards}
          onShowCompletedCardsChange={(show) => dispatch.setShowCompletedCards(show)}
        />
      )}
    </div>
  );
}

// Exported wrapper that ensures context is available
export function KanbanBoardView() {
  return <KanbanBoardViewContent />;
}
