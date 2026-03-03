import { FileQuestion, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  type: "no-results" | "no-data";
  searchTerm?: string;
  entityName: string;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export function EmptyState({ type, searchTerm, entityName, onAction, actionLabel, className }: EmptyStateProps) {
  const isNoResults = type === "no-results";
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="mb-4 rounded-full bg-muted p-6">
        {isNoResults ? <Search className="h-12 w-12 text-muted-foreground" /> : <FileQuestion className="h-12 w-12 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {isNoResults ? `No results found${searchTerm ? ` for "${searchTerm}"` : ""}` : `No ${entityName.toLowerCase()} yet`}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {isNoResults ? "Try adjusting your search or filters to find what you're looking for." : `Get started by adding your first ${entityName.toLowerCase()}.`}
      </p>
      {onAction && !isNoResults && (
        <Button onClick={onAction} size="lg"><Plus className="mr-2 h-4 w-4" />{actionLabel || `Add ${entityName}`}</Button>
      )}
    </div>
  );
}