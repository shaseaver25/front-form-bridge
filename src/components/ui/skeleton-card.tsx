import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {
  type: "constituent" | "grant" | "major-gift";
  count?: number;
}

function SkeletonCardItem({ type }: { type: SkeletonCardProps["type"] }) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="pt-2"><Skeleton className="h-px w-full" /></div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-24" /></div>
            <div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-20" /></div>
          </div>
          {type === "grant" && <div className="pt-2"><Skeleton className="h-8 w-full" /></div>}
        </div>
      </div>
    </div>
  );
}

export function SkeletonCard({ type, count = 6 }: SkeletonCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (<SkeletonCardItem key={i} type={type} />))}
    </div>
  );
}