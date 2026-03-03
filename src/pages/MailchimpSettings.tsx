import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw, Loader2, Mail, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const MailchimpSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  // Handle OAuth callback parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');

    if (success) {
      toast({
        title: "Connected Successfully",
        description: "Your Mailchimp account has been connected.",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/mailchimp-settings');
      // Refresh the config
      queryClient.invalidateQueries({ queryKey: ["mailchimp-config"] });
    } else if (error) {
      toast({
        title: "Connection Failed",
        description: decodeURIComponent(error),
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/mailchimp-settings');
    }
  }, [toast, queryClient]);

  const { data: config, isLoading } = useQuery({
    queryKey: ["mailchimp-config"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("mailchimp_sync_config")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: syncLogs } = useQuery({
    queryKey: ["mailchimp-sync-logs"],
    queryFn: async () => {
      if (!config?.id) return [];

      const { data, error } = await supabase
        .from("mailchimp_sync_log")
        .select("*")
        .eq("config_id", config.id)
        .order("started_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!config?.id,
  });

  const handleConnect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Not Authenticated",
          description: "Please log in to connect Mailchimp",
          variant: "destructive",
        });
        return;
      }

      // Start the OAuth flow by calling the backend function.
      // It returns the Mailchimp authorization URL, which we then
      // use to redirect the browser.
      const { data, error } = await supabase.functions.invoke("mailchimp-oauth", {
        body: {
          redirectOrigin: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }

      const authUrl = (data as { authUrl?: string } | null)?.authUrl;
      if (!authUrl) {
        throw new Error("Failed to get Mailchimp authorization URL");
      }

      window.location.href = authUrl;
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to initiate OAuth flow",
        variant: "destructive",
      });
    }
  };
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

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("mailchimp_sync_config")
        .update({ is_active: false })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mailchimp-config"] });
      toast({
        title: "Disconnected",
        description: "Mailchimp integration has been disconnected.",
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/integrations")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Mailchimp Integration</h1>
            <p className="text-muted-foreground">Email marketing and engagement tracking</p>
          </div>
        </div>
      </div>

      {!config || !config.is_active ? (
        <Card>
          <CardHeader>
            <CardTitle>Connect Mailchimp</CardTitle>
            <CardDescription>
              Sync your email subscribers, campaign performance, and engagement data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">What you'll get:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ Automatic subscriber sync</li>
                <li>✓ Campaign performance tracking</li>
                <li>✓ Email engagement in donor profiles</li>
                <li>✓ Segmented list management</li>
                <li>✓ Unsubscribe tracking</li>
              </ul>
            </div>
            <Button onClick={handleConnect}>
              Connect Mailchimp
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Connection Status</CardTitle>
                  <CardDescription>
                    Connected to: {config.account_name}
                  </CardDescription>
                </div>
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Last sync</p>
                  <p className="font-medium">
                    {config.last_sync_at 
                      ? new Date(config.last_sync_at).toLocaleString()
                      : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Server</p>
                  <p className="font-medium">{config.server_prefix}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => syncMutation.mutate()} 
                  disabled={isSyncing}
                >
                  {isSyncing ? (
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
                <Button 
                  variant="outline" 
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                >
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>

          {syncLogs && syncLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sync History</CardTitle>
                <CardDescription>Recent sync activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {log.status === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="font-medium capitalize">{log.status.replace('_', ' ')}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.started_at).toLocaleString()}
                        </p>
                        <p className="text-sm">
                          {log.records_processed} records processed
                          {log.records_created > 0 && ` • ${log.records_created} created`}
                          {log.records_failed > 0 && ` • ${log.records_failed} errors`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Configure field mapping and sync settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full">
                <Link to="/mailchimp-settings/setup">
                  Configure Field Mapping
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Marketing Dashboard</CardTitle>
              <CardDescription>
                View comprehensive analytics, subscriber insights, and campaign performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/email-marketing">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Email Marketing Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MailchimpSettings;
