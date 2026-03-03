import { useState, useMemo } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths,
  isBefore
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { BoardCard as BoardCardType } from '@/types/boards';
import { cn } from '@/lib/utils';

interface BoardCalendarViewProps {
  cards: BoardCardType[];
  onCardClick: (card: BoardCardType) => void;
  onAddCard?: (dueDate: Date) => void;
  onCardDueDateChange?: (cardId: string, newDate: Date) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

export function BoardCalendarView({ 
  cards, 
  onCardClick, 
  onAddCard,
  onCardDueDateChange 
}: BoardCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCompleted, setShowCompleted] = useState(false);
  const [draggedCard, setDraggedCard] = useState<BoardCardType | null>(null);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const cardsByDate = useMemo(() => {
    const map = new Map<string, BoardCardType[]>();
    
    cards
      .filter(card => card.due_date && (showCompleted || !card.completed_at))
      .forEach(card => {
        const dateKey = format(new Date(card.due_date!), 'yyyy-MM-dd');
        if (!map.has(dateKey)) map.set(dateKey, []);
        map.get(dateKey)!.push(card);
      });
    
    return map;
  }, [cards, showCompleted]);

  const handleDragStart = (e: React.DragEvent, card: BoardCardType) => {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (draggedCard && onCardDueDateChange) {
      onCardDueDateChange(draggedCard.id, date);
    }
    setDraggedCard(null);
  };

  const handleDayClick = (date: Date) => {
    if (onAddCard) {
      onAddCard(date);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <h2 className="text-xl font-semibold ml-2">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="show-completed"
            checked={showCompleted}
            onCheckedChange={setShowCompleted}
          />
          <Label htmlFor="show-completed" className="text-sm">
            Show completed
          </Label>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-muted p-2 text-center text-sm font-medium">
            {day}
          </div>
        ))}

        {/* Day cells */}
        {calendarDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayCards = cardsByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isDayToday = isToday(day);

          return (
            <div
              key={dateKey}
              className={cn(
                "min-h-[120px] p-1 bg-card transition-colors",
                !isCurrentMonth && "bg-muted/50 opacity-50",
                isDayToday && "ring-2 ring-primary ring-inset",
                draggedCard && "hover:bg-accent"
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
              onClick={() => handleDayClick(day)}
            >
              <div className={cn(
                "text-sm font-medium mb-1 p-1 rounded-full w-7 h-7 flex items-center justify-center",
                isDayToday && "bg-primary text-primary-foreground"
              )}>
                {format(day, 'd')}
              </div>

              <div className="space-y-1 max-h-[80px] overflow-y-auto">
                {dayCards.slice(0, 3).map((card) => {
                  const isOverdue = card.due_date && isBefore(new Date(card.due_date), new Date()) && !card.completed_at;
                  const isComplete = !!card.completed_at;

                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCardClick(card);
                      }}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-pointer transition-colors hover:opacity-80",
                        isOverdue && "bg-destructive/20 border border-destructive/50",
                        isComplete && "bg-muted line-through opacity-60",
                        !isOverdue && !isComplete && "bg-accent"
                      )}
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        PRIORITY_COLORS[card.priority || 'medium']
                      )} />
                      <span className="truncate flex-1">{card.headline}</span>
                      {card.assigned_to && (
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-[8px]">
                            {card.assigned_to.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
                {dayCards.length > 3 && (
                  <Badge variant="secondary" className="text-[10px] px-1">
                    +{dayCards.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 p-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Click day to add card</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Priority:</span>
          {Object.entries(PRIORITY_COLORS).map(([priority, color]) => (
            <div key={priority} className="flex items-center gap-1">
              <div className={cn("w-2 h-2 rounded-full", color)} />
              <span className="capitalize">{priority}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
