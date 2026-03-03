import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "card" | "list" | "table" | "form" | "dashboard";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ variant = "card", count = 3, className }: LoadingSkeletonProps) {
  switch (variant) {
    case "card":
      return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-20 w-full" />
              <div className="flex gap-2"><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-20" /></div>
            </div>
          ))}
        </div>
      );
    case "list":
      return (
        <div className={cn("space-y-3", className)}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/2" /></div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      );
    case "table":
      return (
        <div className={cn("border rounded-lg overflow-hidden", className)}>
          <div className="flex gap-4 p-4 border-b bg-muted/50">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-1/5" />)}</div>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border-b last:border-b-0">{Array.from({ length: 5 }).map((_, j) => <Skeleton key={j} className="h-4 w-1/5" />)}</div>
          ))}
        </div>
      );
    case "form":
      return (
        <div className={cn("space-y-6 max-w-md", className)}>
          {Array.from({ length: count }).map((_, i) => (<div key={i} className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>))}
          <Skeleton className="h-10 w-32" />
        </div>
      );
    case "dashboard":
      return (
        <div className={cn("space-y-6", className)}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="p-4 border rounded-lg space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-8 w-3/4" /></div>))}
          </div>
        </div>
      );
    default:
      return null;
  }
}