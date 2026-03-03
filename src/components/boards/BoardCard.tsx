import { useState, useRef, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { 
  Calendar, 
  MessageSquare, 
  Link2, 
  AlertTriangle,
  User,
  CheckSquare,
  Timer,
  GitBranch,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { BoardCard as BoardCardType, BoardCardPriority } from '@/types/boards';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface BoardCardProps {
  card: BoardCardType;
  index: number;
  onClick: () => void;
  onRename?: (cardId: string, newHeadline: string) => void;
  subtaskCount?: { completed: number; total: number };
  commentCount?: number;
  hasActiveTimer?: boolean;
  isSpawnedSubtask?: boolean;
}

const priorityColors: Record<BoardCardPriority, string> = {
  low: 'border-l-emerald-500',
  medium: 'border-l-amber-500',
  high: 'border-l-orange-500',
  urgent: 'border-l-red-500',
};

const priorityBadgeColors: Record<BoardCardPriority, string> = {
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function getDueDateStatus(dueDate: string | null) {
  if (!dueDate) return null;
  
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (isPast(date) && !isToday(date)) {
    return { label: 'Overdue', className: 'text-destructive bg-destructive/10' };
  }
  if (isToday(date)) {
    return { label: 'Today', className: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' };
  }
  if (isTomorrow(date)) {
    return { label: 'Tomorrow', className: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' };
  }
  return { label: format(date, 'MMM d'), className: 'text-muted-foreground bg-muted' };
}

export function BoardCard({ 
  card, 
  index, 
  onClick,
  onRename,
  subtaskCount,
  commentCount = 0,
  hasActiveTimer = false,
  isSpawnedSubtask = false
}: BoardCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(card.headline);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const dueDateStatus = getDueDateStatus(card.due_date);
  const hasLinks = card.linked_contact_id || card.linked_grant_id || card.linked_donation_id;
  const isSpawned = isSpawnedSubtask || !!card.parent_subtask_id;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(card.headline);
    setIsEditing(true);
  };

  const handleSaveEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editValue.trim() && editValue !== card.headline && onRename) {
      onRename(card.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditValue(card.headline);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={isEditing ? undefined : onClick}
          className={cn(
            'group bg-card rounded-lg border border-l-4 p-3 cursor-pointer transition-all',
            'hover:shadow-md hover:border-primary/30',
            priorityColors[card.priority],
            snapshot.isDragging && 'shadow-lg rotate-2 border-primary',
            card.is_blocked && 'opacity-75 bg-destructive/5',
            isSpawned && 'border-l-violet-500 bg-violet-50/50 dark:bg-violet-950/20'
          )}
        >
          {/* Spawned subtask indicator */}
          {isSpawned && (
            <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400 text-xs mb-2">
              <GitBranch className="h-3 w-3" />
              <span>Subtask</span>
            </div>
          )}

          {/* Blocked indicator */}
          {card.is_blocked && (
            <div className="flex items-center gap-1 text-destructive text-xs mb-2">
              <AlertTriangle className="h-3 w-3" />
              <span>Blocked</span>
            </div>
          )}

          {/* Active timer indicator */}
          {hasActiveTimer && (
            <div className="flex items-center gap-1 text-primary text-xs mb-2">
              <Timer className="h-3 w-3 animate-pulse" />
              <span className="animate-pulse">Timer running</span>
            </div>
          )}

          {/* Headline */}
          {isEditing ? (
            <div className="flex items-center gap-1 mb-2" onClick={(e) => e.stopPropagation()}>
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => handleSaveEdit()}
                className="h-7 text-sm font-medium"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={handleSaveEdit}
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={handleCancelEdit}
              >
                <X className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-1 mb-2">
              <h4 className="text-sm font-medium text-foreground leading-tight flex-1">
                {card.headline}
              </h4>
              {onRename && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handleStartEdit}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rename</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

          {/* Description preview */}
          {card.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {card.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Priority badge for urgent/high */}
              {(card.priority === 'urgent' || card.priority === 'high') && (
                <Badge variant="outline" className={cn('text-xs px-1.5 py-0', priorityBadgeColors[card.priority])}>
                  {card.priority}
                </Badge>
              )}

              {/* Due date */}
              {dueDateStatus && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className={cn('text-xs px-1.5 py-0 gap-1', dueDateStatus.className)}>
                      <Calendar className="h-3 w-3" />
                      {dueDateStatus.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Due: {card.due_date && format(new Date(card.due_date), 'PPP')}
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Subtask progress */}
              {subtaskCount && subtaskCount.total > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs px-1.5 py-0 gap-1 text-muted-foreground">
                      <CheckSquare className="h-3 w-3" />
                      {subtaskCount.completed}/{subtaskCount.total}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {subtaskCount.completed} of {subtaskCount.total} subtasks complete
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Comment count */}
              {commentCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs px-1.5 py-0 gap-1 text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      {commentCount}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {commentCount} comment{commentCount !== 1 ? 's' : ''}
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Link indicator */}
              {hasLinks && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs px-1.5 py-0 gap-1 text-muted-foreground">
                      <Link2 className="h-3 w-3" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    Linked to CRM record
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Assignee */}
            {card.assigned_to && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>Assigned</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
