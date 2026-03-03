import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import { useConstituentGrants, useUnlinkGrant } from "@/hooks/constituents";

interface LinkedGrantsSectionProps {
  constituentId: string;
  onLinkGrant: () => void;
}

export function LinkedGrantsSection({ constituentId, onLinkGrant }: LinkedGrantsSectionProps) {
  const { data: linkedGrants = [], isLoading } = useConstituentGrants(constituentId);
  const unlinkMutation = useUnlinkGrant();

  const handleUnlink = (linkId: string) => {
    unlinkMutation.mutate({ linkId, constituentId });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Linked Grant Opportunities
          </CardTitle>
          <Button size="sm" onClick={onLinkGrant}>
            <Plus className="w-4 h-4 mr-1" />
            Link Grant
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-start justify-between p-3 rounded-lg border bg-card"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        ) : linkedGrants.length > 0 ? (
          <div className="space-y-3">
            {linkedGrants.map((link) => (
              <div
                key={link.id}
                className="flex items-start justify-between p-3 rounded-lg border bg-card"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{link.grant_opportunities.title}</p>
                    <Badge variant="outline" className="text-xs capitalize">
                      {link.grant_opportunities.status_stage?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {link.grant_opportunities.organizations?.name}
                  </p>
                  {link.role && (
                    <p className="text-xs text-muted-foreground">Role: {link.role}</p>
                  )}
                  {link.grant_opportunities.requested_amount && (
                    <p className="text-xs font-medium">
                      Requested: ${Number(link.grant_opportunities.requested_amount).toLocaleString()}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlink(link.id)}
                  className="text-destructive hover:text-destructive"
                  disabled={unlinkMutation.isPending}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No linked grants yet</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={onLinkGrant}>
              <Plus className="w-4 h-4 mr-1" />
              Link First Grant
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
