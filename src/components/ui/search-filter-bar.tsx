import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterChip {
  id: string;
  label: string;
}

interface SearchFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters?: FilterChip[];
  onFilterRemove?: (filterId: string) => void;
  onClearAll?: () => void;
  totalCount: number;
  filteredCount: number;
  placeholder?: string;
  className?: string;
}

export function SearchFilterBar({ searchTerm, onSearchChange, filters = [], onFilterRemove, onClearAll, totalCount, filteredCount, placeholder = "Search...", className }: SearchFilterBarProps) {
  const hasActiveFilters = filters.length > 0 || searchTerm.length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type="text" placeholder={placeholder} value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        {searchTerm && (
          <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => onSearchChange("")}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {hasActiveFilters && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((filter) => (
              <span key={filter.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {filter.label}
                <button onClick={() => onFilterRemove?.(filter.id)} className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"><X className="h-3 w-3" /></button>
              </span>
            ))}
            {(filters.length > 0 || searchTerm) && onClearAll && (
              <Button variant="ghost" size="sm" onClick={onClearAll} className="h-7 text-xs">Clear all</Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredCount}</span> of <span className="font-semibold text-foreground">{totalCount}</span>
          </p>
        </div>
      )}
    </div>
  );
}