import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, MoreHorizontal, AlertCircle } from 'lucide-react';
import { BoardColumn as BoardColumnType, BoardCard as BoardCardType } from '@/types/boards';
import { BoardCard } from './BoardCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface BoardColumnProps {
  column: BoardColumnType;
  cards: BoardCardType[];
  onCardClick: (card: BoardCardType) => void;
  onAddCard: (headline: string) => void;
  onUpdateColumn: (data: Partial<BoardColumnType>) => void;
  onDeleteColumn: () => void;
  onRenameCard?: (cardId: string, newHeadline: string) => void;
  canAddCards?: boolean;
  canManageColumn?: boolean;
}

export function BoardColumn({
  column,
  cards,
  onCardClick,
  onAddCard,
  onUpdateColumn,
  onDeleteColumn,
  onRenameCard,
  canAddCards = true,
  canManageColumn = true,
}: BoardColumnProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);

  const isOverWipLimit = column.wip_limit && cards.length > column.wip_limit;

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(newCardTitle.trim());
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const handleTitleSave = () => {
    if (editTitle.trim() && editTitle !== column.title) {
      onUpdateColumn({ title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="flex flex-col bg-muted/50 rounded-lg w-72 min-w-72 max-h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditingTitle && canManageColumn ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') {
                  setEditTitle(column.title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="h-7 text-sm font-semibold"
            />
          ) : (
            <h3
              onClick={() => canManageColumn && setIsEditingTitle(true)}
              className={cn(
                "text-sm font-semibold text-foreground truncate",
                canManageColumn && "cursor-pointer hover:text-primary"
              )}
            >
              {column.title}
            </h3>
          )}
          
          {/* Card count */}
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded-full",
            isOverWipLimit 
              ? "bg-destructive/10 text-destructive" 
              : "bg-muted text-muted-foreground"
          )}>
            {cards.length}
            {column.wip_limit && `/${column.wip_limit}`}
          </span>

          {/* WIP limit warning */}
          {isOverWipLimit && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
        </div>

        {canManageColumn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const limit = prompt('Set WIP limit (leave empty to remove):', column.wip_limit?.toString() || '');
                if (limit !== null) {
                  onUpdateColumn({ wip_limit: limit ? parseInt(limit) : null });
                }
              }}>
                Set WIP Limit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateColumn({ is_done_column: !column.is_done_column })}>
                {column.is_done_column ? 'Unmark as Done Column' : 'Mark as Done Column'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDeleteColumn}
                className="text-destructive focus:text-destructive"
              >
                Delete Column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Droppable Cards Area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 overflow-y-auto p-2 space-y-2 min-h-24",
              snapshot.isDraggingOver && "bg-primary/5 rounded-b-lg"
            )}
          >
            {cards.length === 0 && !snapshot.isDraggingOver && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No cards yet
              </div>
            )}
            
            {cards.map((card, index) => (
              <BoardCard
                key={card.id}
                card={card}
                index={index}
                onClick={() => onCardClick(card)}
                onRename={onRenameCard}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add Card */}
      {canAddCards && (
        <div className="p-2 border-t border-border/50">
          {isAddingCard ? (
            <div className="space-y-2">
              <Input
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                placeholder="Card title..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCard();
                  if (e.key === 'Escape') {
                    setNewCardTitle('');
                    setIsAddingCard(false);
                  }
                }}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddCard}>
                  Add
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setNewCardTitle('');
                    setIsAddingCard(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingCard(true)}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
