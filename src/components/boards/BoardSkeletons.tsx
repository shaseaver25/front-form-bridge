import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function BoardHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

export function BoardColumnSkeleton() {
  return (
    <div className="flex flex-col bg-muted/50 rounded-lg w-72 min-w-72 max-h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <Skeleton className="h-7 w-7" />
      </div>
      
      {/* Cards */}
      <div className="flex-1 p-2 space-y-2">
        <BoardCardSkeleton />
        <BoardCardSkeleton />
        <BoardCardSkeleton hasDescription={false} />
      </div>
      
      {/* Add Card */}
      <div className="p-2 border-t border-border/50">
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}

interface BoardCardSkeletonProps {
  hasDescription?: boolean;
  className?: string;
}

export function BoardCardSkeleton({ hasDescription = true, className }: BoardCardSkeletonProps) {
  return (
    <div className={cn('bg-card rounded-lg border border-l-4 border-l-muted p-3', className)}>
      {/* Headline */}
      <Skeleton className="h-4 w-full mb-2" />
      
      {/* Description */}
      {hasDescription && (
        <>
          <Skeleton className="h-3 w-full mb-1" />
          <Skeleton className="h-3 w-3/4 mb-3" />
        </>
      )}
      
      {/* Meta row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <BoardHeaderSkeleton />
      <div className="flex-1 flex gap-4 p-4 overflow-x-auto bg-muted/30">
        <BoardColumnSkeleton />
        <BoardColumnSkeleton />
        <BoardColumnSkeleton />
        <div className="w-72 min-w-72">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function BoardListSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="p-4 rounded-lg border bg-card">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded" />
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-7 w-7 rounded-full" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
