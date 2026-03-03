import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, AlertCircle, RefreshCw, Clock, 
  TrendingUp, XCircle, Loader2, Download
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function SalesforceMonitoringDashboard() {
  const queryClient = useQueryClient();

  // Fetch latest config and sync status
  const { data: sfConfig } = useQuery({
    queryKey: ["salesforce-config"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("salesforce_configurations")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch recent sync history
  const { data: syncHistory } = useQuery({
    queryKey: ["salesforce-sync-history", sfConfig?.id],
    queryFn: async () => {
      if (!sfConfig?.id) return [];

      const { data, error } = await supabase
        .from("salesforce_sync_log")
        .select("*")
        .eq("config_id", sfConfig.id)
        .order("started_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!sfConfig?.id,
  });

  // Fetch today's stats
  const { data: todayStats } = useQuery({
    queryKey: ["salesforce-today-stats", sfConfig?.id],
    queryFn: async () => {
      if (!sfConfig?.id) return null;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("salesforce_sync_log")
        .select("*")
        .eq("config_id", sfConfig.id)
        .gte("started_at", todayStart.toISOString());

      if (error) throw error;

      const totalSynced = data.reduce((sum, log) => sum + log.records_processed, 0);
      const totalCreated = data.reduce((sum, log) => sum + log.records_created, 0);
      const totalUpdated = data.reduce((sum, log) => sum + log.records_updated, 0);
      const totalErrors = data.reduce((sum, log) => sum + log.records_failed, 0);

      return {
        totalSynced,
        totalCreated,
        totalUpdated,
        totalErrors,
        syncCount: data.length,
      };
    },
    enabled: !!sfConfig?.id,
  });

  // Manual sync mutation
  const syncNowMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("salesforce-sync", {
        body: { action: "sync_now" }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Sync started successfully");
      queryClient.invalidateQueries({ queryKey: ["salesforce-sync-history"] });
      queryClient.invalidateQueries({ queryKey: ["salesforce-today-stats"] });
    },
    onError: (error) => {
      toast.error("Failed to start sync: " + error.message);
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "in_progress":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-600">Success</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "in_progress":
        return <Badge variant="secondary">In Progress</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const lastSync = syncHistory?.[0];
  const nextSyncTime = sfConfig?.last_sync_at 
    ? new Date(new Date(sfConfig.last_sync_at).getTime() + 15 * 60 * 1000) 
    : null;
  const minutesUntilNextSync = nextSyncTime 
    ? Math.max(0, Math.round((nextSyncTime.getTime() - Date.now()) / 60000))
    : null;

  const successRate = todayStats?.totalSynced > 0
    ? ((todayStats.totalSynced - todayStats.totalErrors) / todayStats.totalSynced * 100).toFixed(1)
    : "100";

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Salesforce Sync Status</CardTitle>
              <CardDescription>Real-time synchronization monitoring</CardDescription>
            </div>
            <Button
              onClick={() => syncNowMutation.mutate()}
              disabled={syncNowMutation.isPending}
              size="sm"
            >
              {syncNowMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="font-semibold">Active & Healthy</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Last Sync</p>
              <p className="font-medium">
                {lastSync ? format(new Date(lastSync.started_at), "MMM d, h:mm a") : "Never"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Next Sync</p>
              <p className="font-medium">
                {minutesUntilNextSync !== null 
                  ? `in ${minutesUntilNextSync} minutes`
                  : "Not scheduled"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold">{todayStats?.totalSynced || 0}</p>
              <p className="text-sm text-muted-foreground">Records Synced</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{todayStats?.totalCreated || 0}</p>
              <p className="text-sm text-muted-foreground">Created</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{todayStats?.totalUpdated || 0}</p>
              <p className="text-sm text-muted-foreground">Updated</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{todayStats?.totalErrors || 0}</p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Success Rate</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-semibold">{successRate}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sync History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Sync History</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Log
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncHistory?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.started_at), "MMM d, h:mm a")}
                  </TableCell>
                  <TableCell className="capitalize">{log.sync_type}</TableCell>
                  <TableCell>{log.records_processed}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      {getStatusBadge(log.status)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!syncHistory || syncHistory.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No sync history yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}