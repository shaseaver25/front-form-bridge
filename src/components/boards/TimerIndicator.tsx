import { Timer, Square } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatElapsedTime } from '@/hooks/useTimeTracking';
import { cn } from '@/lib/utils';

interface TimerIndicatorProps {
  elapsedSeconds: number;
  onStop?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function TimerIndicator({ 
  elapsedSeconds, 
  onStop, 
  size = 'md',
  className 
}: TimerIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Badge 
        variant="outline" 
        className={cn(
          'gap-1 bg-primary/10 border-primary/30 text-primary animate-pulse',
          size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5'
        )}
      >
        <Timer className={cn('text-primary', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
        {formatElapsedTime(elapsedSeconds)}
      </Badge>
      {onStop && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'text-destructive hover:text-destructive hover:bg-destructive/10',
                size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onStop();
              }}
            >
              <Square className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Stop Timer</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
