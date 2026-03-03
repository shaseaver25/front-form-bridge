import { FolderKanban, Plus, Search, Filter, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateConfig {
  icon: typeof FolderKanban;
  title: string;
  description: string;
  actionLabel: string;
  actionIcon: typeof Plus;
  isSecondary?: boolean;
}

interface BoardEmptyStateProps {
  type: 'no-boards' | 'empty-column' | 'no-results' | 'no-cards';
  onAction?: () => void;
  onClearFilters?: () => void;
  className?: string;
}

export function BoardEmptyState({ 
  type, 
  onAction, 
  onClearFilters,
  className 
}: BoardEmptyStateProps) {
  const config: Record<BoardEmptyStateProps['type'], EmptyStateConfig> = {
    'no-boards': {
      icon: FolderKanban,
      title: 'No boards yet',
      description: 'Create your first board to start organizing your work',
      actionLabel: 'Create Board',
      actionIcon: Plus,
    },
    'empty-column': {
      icon: LayoutGrid,
      title: 'No cards',
      description: 'Add a card to get started',
      actionLabel: 'Add Card',
      actionIcon: Plus,
    },
    'no-results': {
      icon: Search,
      title: 'No matching cards',
      description: 'Try adjusting your search or filters',
      actionLabel: 'Clear Filters',
      actionIcon: Filter,
      isSecondary: true,
    },
    'no-cards': {
      icon: LayoutGrid,
      title: 'This board is empty',
      description: 'Start by adding cards to track your tasks',
      actionLabel: 'Add First Card',
      actionIcon: Plus,
    },
  };

  const { icon: Icon, title, description, actionLabel, actionIcon: ActionIcon, isSecondary } = config[type];

  const handleAction = () => {
    if (type === 'no-results' && onClearFilters) {
      onClearFilters();
    } else {
      onAction?.();
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
        {description}
      </p>
      {onAction && (
        <Button
          variant={isSecondary ? 'outline' : 'default'}
          size="sm"
          onClick={handleAction}
        >
          <ActionIcon className="h-4 w-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
