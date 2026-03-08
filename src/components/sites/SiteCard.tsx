import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Users, MapPin, ExternalLink } from "lucide-react";

const statusColors: Record<string, string> = {
  identified: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  screening: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  presented: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  interview: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  offer: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  placed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

interface SiteCardProps {
  site: any;
  compact?: boolean;
}

export function SiteCard({ site, compact = false }: SiteCardProps) {
  const navigate = useNavigate();

  if (compact) {
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
        onClick={() => navigate(`/sites/${site.id}`)}
      >
        <CardContent className="p-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm line-clamp-1">{site.name}</h4>
              {site.contactCount > 0 && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  <Users className="h-3 w-3 mr-1" />
                  {site.contactCount}
                </Badge>
              )}
            </div>
            {site.websiteUrl && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span className="truncate">{site.websiteUrl}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
      onClick={() => navigate(`/sites/${site.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{site.name}</CardTitle>
            {site.websiteUrl && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Globe className="h-3 w-3 shrink-0" />
                <span className="truncate">{site.websiteUrl}</span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
              </p>
            )}
          </div>
          <Badge className={statusColors[site.status || "prospect"]}>
            {(site.status || "prospect").replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          {site.contactCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              {site.contactCount} {site.contactCount === 1 ? "contact" : "contacts"}
            </Badge>
          )}
          {site.location && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {site.location}
            </span>
          )}
        </div>
        {site.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{site.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
