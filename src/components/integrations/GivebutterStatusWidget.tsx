import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Heart, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  ArrowRight,
  DollarSign 
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useGivebutterStats, useGivebutterConfig } from "@/hooks/useGivebutter";

export function GivebutterStatusWidget() {
  const navigate = useNavigate();
  const { data: config, isLoading: configLoading } = useGivebutterConfig();
  const { data: stats, isLoading: statsLoading } = useGivebutterStats();

  // Fetch recent transactions count
  const { data: recentTransactions } = useQuery({
    queryKey: ["givebutter", "recent-transactions"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count, error } = await supabase
        .from("givebutter_transactions")
        .select("*", { count: "exact", head: true })
        .gte("transacted_at", thirtyDaysAgo.toISOString());
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!config,
  });

  const isLoading = configLoading || statsLoading;
  const isConnected = !!config?.api_key;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            Givebutter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect Givebutter to sync donations and recurring plans.
          </p>
          <Button 
            size="sm" 
            onClick={() => navigate("/settings/givebutter")}
          >
            Connect
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            Givebutter
          </CardTitle>
          <Badge 
            variant="outline" 
            className="bg-green-500/10 text-green-600 border-green-500/20"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-semibold">{recentTransactions || 0}</div>
            <div className="text-xs text-muted-foreground">Last 30 Days</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">{stats?.activePlans || 0}</div>
            <div className="text-xs text-muted-foreground">Active Plans</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-amber-600">
              {stats?.pendingContacts || 0}
            </div>
            <div className="text-xs text-muted-foreground">Need Match</div>
          </div>
        </div>

        {/* Last Sync */}
        {config?.last_sync_at && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            <span>
              Synced {formatDistanceToNow(new Date(config.last_sync_at), { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Pending Matches Alert */}
        {stats?.pendingContacts && stats.pendingContacts > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-amber-500/10 text-amber-700 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{stats.pendingContacts} contacts need matching</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => navigate("/settings/givebutter")}
          >
            Settings
          </Button>
          {stats?.pendingContacts && stats.pendingContacts > 0 && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => navigate("/settings/givebutter?tab=contacts")}
            >
              <Users className="h-3 w-3 mr-1" />
              Match
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
