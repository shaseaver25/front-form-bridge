import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { SiteCard } from "./SiteCard";
import type { Site } from "@/types/sites";

interface SitesListProps {
  sites: any[];
  isLoading: boolean;
  onAddSite: () => void;
}

export function SitesList({ sites, isLoading, onAddSite }: SitesListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (!sites || sites.length === 0) {
    return (
      <EmptyState
        type="no-data"
        entityName="Site"
        onAction={onAddSite}
        actionLabel="Add Site"
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sites.map((site) => (
        <SiteCard key={site.id} site={site} />
      ))}
    </div>
  );
}
