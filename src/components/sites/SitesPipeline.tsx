import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const pipelineStages = [
  { key: "identified", label: "Identified", color: "bg-gray-500" },
  { key: "screening", label: "Screening", color: "bg-blue-500" },
  { key: "presented", label: "Presented to Client", color: "bg-yellow-500" },
  { key: "interview", label: "Interview", color: "bg-orange-500" },
  { key: "offer", label: "Offer Extended", color: "bg-purple-500" },
  { key: "placed", label: "Placed", color: "bg-green-500" },
];

interface SitesPipelineProps {
  sites: any[];
  isLoading: boolean;
  onAddSite: (status?: string) => void;
}

export function SitesPipeline({ sites, isLoading, onAddSite }: SitesPipelineProps) {
  const navigate = useNavigate();

  const getSitesByStage = (stage: string) =>
    sites.filter((s) => (s.status || "identified") === stage);

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
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm line-clamp-1">{company.name}</h4>
                      {company.contactCount > 0 && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          <Users className="h-3 w-3 mr-1" />
                          {company.contactCount}
                        </Badge>
                      )}
                    </div>
                    
                    {company.websiteUrl && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3 w-3 shrink-0" />
                        <span className="truncate">{company.websiteUrl}</span>
                      </p>
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
