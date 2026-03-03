import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Mail, Phone, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const pipelineStages = [
  { key: "prospect", label: "Prospects", color: "bg-gray-500" },
  { key: "contacted", label: "Contacted", color: "bg-blue-500" },
  { key: "in_conversation", label: "In Conversation", color: "bg-yellow-500" },
  { key: "pilot", label: "Pilot", color: "bg-purple-500" },
  { key: "active_partner", label: "Active Partners", color: "bg-green-500" },
];

interface Site {
  id: string;
  name: string;
  relationship_status: string;
  organization_type?: string;
  address_city?: string;
  city?: string;
  primary_contact?: { first_name: string; last_name: string; primary_email: string } | null;
  enrollment?: number;
  budget_tier?: string;
}

interface SitesPipelineProps {
  sites: Site[];
  isLoading: boolean;
  onAddSite: (status?: string) => void;
}

export function SitesPipeline({ sites, isLoading, onAddSite }: SitesPipelineProps) {
  const navigate = useNavigate();

  const getSitesByStage = (stage: string) =>
    sites.filter((s) => (s.relationship_status || "prospect") === stage);

  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
        {pipelineStages.map((stage) => (
          <div key={stage.key} className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-5">
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
              {stageSites.map((site) => (
                <Card
                  key={site.id}
                  className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
                  onClick={() => navigate(`/sites/${site.id}`)}
                >
                  <CardContent className="p-3 space-y-2">
                    <h4 className="font-medium text-sm line-clamp-1">{site.name}</h4>
                    
                    {(site.address_city || site.city) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {site.address_city || site.city}
                      </p>
                    )}
                    
                    {site.primary_contact && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3 shrink-0" />
                        {site.primary_contact.first_name} {site.primary_contact.last_name}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      {site.budget_tier && (
                        <Badge variant="outline" className="text-xs">
                          {site.budget_tier}
                        </Badge>
                      )}
                      {site.organization_type && (
                        <Badge variant="secondary" className="text-xs">
                          {site.organization_type.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {stageSites.length === 0 && (
                <div
                  className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-sm text-muted-foreground cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  onClick={() => onAddSite(stage.key)}
                >
                  + Add {stage.label.slice(0, -1)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
