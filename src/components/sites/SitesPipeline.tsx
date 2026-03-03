import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const pipelineStages = [
  { key: "prospect", label: "Prospects", color: "bg-gray-500" },
  { key: "active", label: "Active", color: "bg-green-500" },
  { key: "inactive", label: "Inactive", color: "bg-yellow-500" },
  { key: "former", label: "Former", color: "bg-red-500" },
];

interface SitesPipelineProps {
  sites: any[];
  isLoading: boolean;
  onAddSite: (status?: string) => void;
}

export function SitesPipeline({ sites, isLoading, onAddSite }: SitesPipelineProps) {
  const navigate = useNavigate();

  const getSitesByStage = (stage: string) =>
    sites.filter((s) => (s.status || "prospect") === stage);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {pipelineStages.map((stage) => (
          <div key={stage.key} className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {pipelineStages.map((stage) => {
        const stageSites = getSitesByStage(stage.key);
        return (
          <div key={stage.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <h3 className="font-medium text-sm">{stage.label}</h3>
              </div>
              <Badge variant="secondary" className="text-xs">
                {stageSites.length}
              </Badge>
            </div>

            <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-lg p-2">
              {stageSites.map((company: any) => (
                <Card
                  key={company.id}
                  className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                  onClick={() => navigate(`/sites/${company.id}`)}
                >
                  <CardContent className="p-3 space-y-2">
                    <h4 className="font-medium text-sm line-clamp-1">{company.name}</h4>
                    
                    {company.domain && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3 w-3 shrink-0" />
                        {company.domain}
                      </p>
                    )}
                    
                    {company.company_type && (
                      <Badge variant="secondary" className="text-xs">
                        {company.company_type.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}

              {stageSites.length === 0 && (
                <div
                  className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  onClick={() => onAddSite(stage.key)}
                >
                  + Add Company
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
