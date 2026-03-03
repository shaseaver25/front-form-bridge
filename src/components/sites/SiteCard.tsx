import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Building2 } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  prospect: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  former: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
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
              {site.company_type && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {site.company_type}
                </Badge>
              )}
            </div>
            {site.domain && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {site.domain}
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
            {site.domain && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Globe className="h-3 w-3 shrink-0" />
                {site.domain}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1 items-end shrink-0">
            <Badge className={statusColors[site.status || "prospect"]}>
              {(site.status || "prospect").replace(/_/g, " ")}
            </Badge>
            {site.company_type && (
              <Badge variant="outline" className="text-xs">
                {site.company_type}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {site.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{site.description}</p>
        )}
        {site.revenue && (
          <p className="text-sm text-muted-foreground">
            <Building2 className="h-3 w-3 inline mr-1" />
            Revenue: ${site.revenue.toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
