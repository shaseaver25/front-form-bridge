import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ExternalLink, Repeat, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface GivebutterConstituentSectionProps {
  constituentId: string;
}

export function GivebutterConstituentSection({ constituentId }: GivebutterConstituentSectionProps) {
  // Fetch Givebutter contact linked to this constituent
  const { data: contact, isLoading: contactLoading } = useQuery({
    queryKey: ["givebutter", "constituent-contact", constituentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("givebutter_contacts")
        .select("*")
        .eq("constituent_id", constituentId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch active recurring plans
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["givebutter", "constituent-plans", constituentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("givebutter_plans")
        .select("*")
        .eq("constituent_id", constituentId)
        .order("plan_created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!contact,
  });

  // Fetch recent transactions
  const { data: transactions } = useQuery({
    queryKey: ["givebutter", "constituent-transactions", constituentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("givebutter_transactions")
        .select("*")
        .eq("constituent_id", constituentId)
        .order("transacted_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!contact,
  });

  const isLoading = contactLoading || plansLoading;

  // Don't show section if no Givebutter connection
  if (!isLoading && !contact) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  const activePlans = plans?.filter(p => p.status === "active") || [];
  const totalContributions = contact?.total_contributions || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case "paused":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Paused</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "monthly": return "/mo";
      case "weekly": return "/wk";
      case "yearly": return "/yr";
      case "quarterly": return "/qtr";
      default: return "";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Givebutter
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            ID: {contact?.givebutter_id}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Total Contributions
            </div>
            <div className="text-xl font-semibold">
              ${totalContributions.toLocaleString()}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Repeat className="h-4 w-4" />
              Active Plans
            </div>
            <div className="text-xl font-semibold">{activePlans.length}</div>
          </div>
        </div>

        {/* Active Recurring Plans */}
        {activePlans.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recurring Plans</h4>
            <div className="space-y-2">
              {activePlans.map((plan) => (
                <div 
                  key={plan.id} 
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium">
                        ${Number(plan.amount).toLocaleString()}
                        <span className="text-muted-foreground text-sm">
                          {getFrequencyLabel(plan.frequency)}
                        </span>
                      </span>
                      {plan.next_billing_date && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Next: {format(new Date(plan.next_billing_date), "MMM d, yyyy")}
                        </div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(plan.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {transactions && transactions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent via Givebutter</h4>
            <div className="space-y-1">
              {transactions.slice(0, 3).map((tx) => (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between text-sm py-1"
                >
                  <span className="text-muted-foreground">
                    {format(new Date(tx.transacted_at), "MMM d, yyyy")}
                  </span>
                  <span className="font-medium">
                    ${Number(tx.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View in Givebutter Link */}
        {contact?.givebutter_id && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(`https://givebutter.com/dashboard/contacts/${contact.givebutter_id}`, "_blank")}
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            View in Givebutter
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
