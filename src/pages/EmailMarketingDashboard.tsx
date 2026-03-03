import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, RefreshCw, Loader2, Mail, TrendingUp, AlertCircle, CheckCircle2, XCircle, Settings, Clock, Send, Eye, MousePointerClick, Plus, ArrowRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

const STUCK_SYNC_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

const EmailMarketingDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  // Get Mailchimp configuration
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["mailchimp-config"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("mailchimp_sync_config")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Get selected audiences
  const { data: audiences } = useQuery({
    queryKey: ["mailchimp-audiences", config?.id],
    queryFn: async () => {
      if (!config?.id) return [];

      const { data, error } = await supabase
        .from("mailchimp_audiences")
        .select("*")
        .eq("config_id", config.id)
        .eq("is_selected", true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!config?.id,
  });

  // Get sync logs (last 30 days) - with auto-refresh
  const { data: syncLogs, refetch: refetchSyncLogs } = useQuery({
    queryKey: ["mailchimp-sync-logs", config?.id],
    queryFn: async () => {
      if (!config?.id) return [];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("mailchimp_sync_log")
        .select("*")
        .eq("config_id", config.id)
        .gte("started_at", thirtyDaysAgo.toISOString())
        .order("started_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!config?.id,
    refetchInterval: isSyncing ? 5000 : 30000, // Refresh every 5s when syncing, 30s otherwise
  });

  // Get constituent count with Mailchimp data
  const { data: constituentStats } = useQuery({
    queryKey: ["mailchimp-constituent-stats"],
    queryFn: async () => {
      const { count: totalWithMailchimp, error: totalError } = await supabase
        .from("constituents")
        .select("*", { count: "exact", head: true })
        .not("mailchimp_subscriber_id", "is", null);

      const { count: subscribed, error: subscribedError } = await supabase
        .from("constituents")
        .select("*", { count: "exact", head: true })
        .eq("mailchimp_status", "subscribed");

      if (totalError || subscribedError) throw totalError || subscribedError;

      return {
        total: totalWithMailchimp || 0,
        subscribed: subscribed || 0,
      };
    },
  });

  // Get recent email campaigns
  const { data: recentCampaigns } = useQuery({
    queryKey: ["recent-email-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*, email_campaign_stats(*)")
        .eq("status", "sent")
        .order("sent_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  // Get campaign stats for this month
  const { data: campaignStats } = useQuery({
    queryKey: ["campaign-stats-month"],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*, email_campaign_stats(*)")
        .eq("status", "sent")
        .gte("sent_at", startOfMonth.toISOString());

      if (error) throw error;

      const totalSent = data?.reduce((sum, c) => sum + (c.email_campaign_stats?.[0]?.emails_sent || 0), 0) || 0;
      const totalOpens = data?.reduce((sum, c) => sum + (c.email_campaign_stats?.[0]?.unique_opens || 0), 0) || 0;
      const totalClicks = data?.reduce((sum, c) => sum + (c.email_campaign_stats?.[0]?.unique_clicks || 0), 0) || 0;
      
      return {
        campaignCount: data?.length || 0,
        totalSent,
        avgOpenRate: totalSent > 0 ? (totalOpens / totalSent * 100).toFixed(1) : 0,
        avgClickRate: totalSent > 0 ? (totalClicks / totalSent * 100).toFixed(1) : 0,
      };
    },
  });

  const stuckSyncs = syncLogs?.filter(log => {
    if (log.status !== 'in_progress') return false;
    const startedAt = new Date(log.started_at).getTime();
    return Date.now() - startedAt > STUCK_SYNC_THRESHOLD_MS;
  }) || [];

  const activeSyncs = syncLogs?.filter(log => {
    if (log.status !== 'in_progress') return false;
    const startedAt = new Date(log.started_at).getTime();
    return Date.now() - startedAt <= STUCK_SYNC_THRESHOLD_MS;
  }) || [];

  // Update isSyncing based on active syncs
  useEffect(() => {
    setIsSyncing(activeSyncs.length > 0);
  }, [activeSyncs.length]);

  // Manual sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("mailchimp-sync", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      setIsSyncing(false);
      queryClient.invalidateQueries({ queryKey: ["mailchimp-config"] });
      queryClient.invalidateQueries({ queryKey: ["mailchimp-sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["mailchimp-constituent-stats"] });
      
      toast({
        title: "Sync Complete",
        description: `Synced ${data.results.subscribers_synced} subscribers and ${data.results.campaigns_synced} campaigns.`,
      });
    },
    onError: (error: Error) => {
      setIsSyncing(false);
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel stuck sync mutation
  const cancelSyncMutation = useMutation({
    mutationFn: async (syncLogId: string) => {
      const { error } = await supabase
        .from("mailchimp_sync_log")
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_details: { error: 'Sync cancelled by user - was stuck' },
        })
        .eq("id", syncLogId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mailchimp-sync-logs"] });
      toast({
        title: "Sync Cancelled",
        description: "The stuck sync has been marked as failed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate sync statistics
  const syncStats = syncLogs?.reduce(
    (acc, log) => ({
      totalSyncs: acc.totalSyncs + 1,
      totalCreated: acc.totalCreated + (log.records_created || 0),
      totalUpdated: acc.totalUpdated + (log.records_updated || 0),
      totalFailed: acc.totalFailed + (log.records_failed || 0),
      totalProcessed: acc.totalProcessed + (log.records_processed || 0),
    }),
    { totalSyncs: 0, totalCreated: 0, totalUpdated: 0, totalFailed: 0, totalProcessed: 0 }
  );

  const lastCompletedSync = syncLogs?.find(log => log.status !== 'in_progress');
  const recentErrors = syncLogs?.filter(log => log.status === 'completed_with_errors' || log.status === 'failed').slice(0, 5);

  // Helper to get status display
  const getSyncStatus = (log: any) => {
    if (log.status === 'in_progress') {
      const startedAt = new Date(log.started_at).getTime();
      const isStuck = Date.now() - startedAt > STUCK_SYNC_THRESHOLD_MS;
      return isStuck ? 'stuck' : 'in_progress';
    }
    return log.status;
  };

  if (configLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config || !config.is_active) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Mailchimp is not connected. <Link to="/mailchimp-settings" className="underline">Connect your account</Link> to view the dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/integrations")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Email Marketing Dashboard</h1>
              <p className="text-muted-foreground">Mailchimp engagement and sync analytics</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/mailchimp-settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button 
            onClick={() => syncMutation.mutate()} 
            disabled={isSyncing || activeSyncs.length > 0}
          >
            {isSyncing || activeSyncs.length > 0 ? (
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
      </div>

      {/* Stuck Sync Warning */}
      {stuckSyncs.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {stuckSyncs.length} sync(s) appear to be stuck (running for more than 10 minutes).
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => stuckSyncs.forEach(s => cancelSyncMutation.mutate(s.id))}
            >
              Cancel Stuck Syncs
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Campaign Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Send className="h-3.5 w-3.5" />
              Campaigns This Month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats?.campaignCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              Emails Sent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(campaignStats?.totalSent || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              Avg Open Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats?.avgOpenRate || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <MousePointerClick className="h-3.5 w-3.5" />
              Avg Click Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats?.avgClickRate || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>Your latest sent email campaigns</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/email-marketing/campaigns")}>
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="sm" onClick={() => navigate("/email-marketing/campaigns/new")}>
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentCampaigns && recentCampaigns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead className="text-right">Open Rate</TableHead>
                  <TableHead className="text-right">Click Rate</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCampaigns.map((campaign: any) => {
                  const stats = campaign.email_campaign_stats?.[0];
                  const openRate = stats?.open_rate ? (stats.open_rate * 100).toFixed(1) : '-';
                  const clickRate = stats?.click_rate ? (stats.click_rate * 100).toFixed(1) : '-';
                  
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {campaign.subject_line}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {campaign.sent_at ? format(new Date(campaign.sent_at), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-right">{openRate}%</TableCell>
                      <TableCell className="text-right">{clickRate}%</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/email-marketing/campaigns/${campaign.id}/report`)}
                        >
                          View Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No campaigns sent yet</p>
              <Button 
                variant="link" 
                className="mt-2"
                onClick={() => navigate("/email-marketing/campaigns/new")}
              >
                Create your first campaign
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Mailchimp Connection
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              </CardTitle>
              <CardDescription>
                Connected to: {config.account_name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Selected Audiences</p>
              <p className="text-2xl font-bold">{audiences?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Contacts Synced</p>
              <p className="text-2xl font-bold">{constituentStats?.total || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Subscribers</p>
              <p className="text-2xl font-bold">{constituentStats?.subscribed || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Sync</p>
              <p className="text-sm font-medium">
                {config.last_sync_at 
                  ? new Date(config.last_sync_at).toLocaleString()
                  : "Never"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Sync Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sync Statistics (Last 30 Days)
            </CardTitle>
            <CardDescription>Performance metrics from recent syncs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Syncs</span>
                <span className="font-medium">{syncStats?.totalSyncs || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Records Processed</span>
                <span className="font-medium">{syncStats?.totalProcessed || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600">New Contacts</span>
                <span className="font-medium text-green-600">{syncStats?.totalCreated || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-600">Updated Contacts</span>
                <span className="font-medium text-blue-600">{syncStats?.totalUpdated || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-600">Failed Records</span>
                <span className="font-medium text-red-600">{syncStats?.totalFailed || 0}</span>
              </div>
            </div>

            {lastCompletedSync && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Last Sync Performance</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-medium">
                      {lastCompletedSync.records_processed > 0
                        ? Math.round(((lastCompletedSync.records_processed - lastCompletedSync.records_failed) / lastCompletedSync.records_processed) * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={lastCompletedSync.records_processed > 0
                      ? ((lastCompletedSync.records_processed - lastCompletedSync.records_failed) / lastCompletedSync.records_processed) * 100
                      : 0
                    } 
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Issues
            </CardTitle>
            <CardDescription>Sync errors and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            {recentErrors && recentErrors.length > 0 ? (
              <div className="space-y-3">
                {recentErrors.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-red-600">{log.status === 'failed' ? 'Sync Failed' : 'Completed with errors'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.started_at).toLocaleString()} • {log.records_failed} failed records
                      </p>
                      {log.error_details && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {typeof log.error_details === 'object' 
                            ? JSON.stringify(log.error_details).substring(0, 100) 
                            : log.error_details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-sm font-medium">No Recent Errors</p>
                <p className="text-xs text-muted-foreground">All syncs completed successfully</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Recent sync executions and results</CardDescription>
        </CardHeader>
        <CardContent>
          {syncLogs && syncLogs.length > 0 ? (
            <div className="space-y-3">
              {syncLogs.slice(0, 10).map((log) => {
                const status = getSyncStatus(log);
                return (
                  <div key={log.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-3">
                      {status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : status === 'completed_with_errors' ? (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      ) : status === 'in_progress' ? (
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      ) : status === 'stuck' ? (
                        <Clock className="h-5 w-5 text-orange-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium capitalize flex items-center gap-2">
                          {status === 'stuck' ? (
                            <>
                              Stuck
                              <Badge variant="destructive" className="text-xs">Needs attention</Badge>
                            </>
                          ) : (
                            status.replace('_', ' ')
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.started_at).toLocaleString()}
                          {log.completed_at && ` • Duration: ${Math.round((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000)}s`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm">
                          <span className="text-green-600">{log.records_created} created</span>
                          {" • "}
                          <span className="text-blue-600">{log.records_updated} updated</span>
                          {log.records_failed > 0 && (
                            <>
                              {" • "}
                              <span className="text-red-600">{log.records_failed} failed</span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.records_processed} total processed
                        </p>
                      </div>
                      {status === 'stuck' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => cancelSyncMutation.mutate(log.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No sync history yet</p>
              <Button variant="link" onClick={() => syncMutation.mutate()} disabled={isSyncing}>
                Run your first sync
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailMarketingDashboard;
