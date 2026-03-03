import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface SiteOpportunitiesSectionProps {
  siteId: string;
}

export function SiteOpportunitiesSection({ siteId }: SiteOpportunitiesSectionProps) {
  const navigate = useNavigate();

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ["site-opportunities", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_opportunities")
        .select(`
          *,
          opportunity:major_gift_opportunities(
            id,
            stage,
            expected_amount,
            expected_date,
            probability_percent,
            donor_interest,
            constituent:constituents(id, full_legal_name)
          )
        `)
        .eq("site_id", siteId);

      if (error) throw error;
      return data;
    },
  });

  const stageColors: Record<string, string> = {
    identification: "bg-gray-100 text-gray-800",
    qualification: "bg-blue-100 text-blue-800",
    cultivation: "bg-yellow-100 text-yellow-800",
    solicitation: "bg-purple-100 text-purple-800",
    negotiation: "bg-orange-100 text-orange-800",
    closed_won: "bg-green-100 text-green-800",
    closed_lost: "bg-red-100 text-red-800",
    stewardship: "bg-teal-100 text-teal-800",
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading opportunities...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Opportunities ({opportunities?.length || 0})</h3>
        <Button size="sm" onClick={() => navigate("/major-gifts")}>
          <Plus className="h-4 w-4 mr-1" />
          View All Opportunities
        </Button>
      </div>

      {opportunities && opportunities.length > 0 ? (
        <div className="space-y-3">
          {opportunities.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/major-gifts`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">
                      {item.opportunity?.constituent?.full_legal_name || "Opportunity"}
                    </h4>
                    {item.opportunity?.donor_interest && (
                      <p className="text-sm text-muted-foreground">
                        {item.opportunity.donor_interest}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {item.opportunity?.expected_amount && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {item.opportunity.expected_amount.toLocaleString()}
                        </span>
                      )}
                      {item.opportunity?.expected_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(item.opportunity.expected_date), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {item.opportunity?.stage && (
                      <Badge className={stageColors[item.opportunity.stage] || "bg-gray-100"}>
                        {item.opportunity.stage.replace(/_/g, " ")}
                      </Badge>
                    )}
                    {item.opportunity?.probability_percent && (
                      <span className="text-xs text-muted-foreground">
                        {item.opportunity.probability_percent}% probability
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No opportunities linked to this site yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
