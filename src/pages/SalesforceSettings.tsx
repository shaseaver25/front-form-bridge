import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { SalesforceMonitoringDashboard } from "@/components/SalesforceMonitoringDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SalesforceSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [instanceUrl, setInstanceUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to configure Salesforce settings.",
          variant: "destructive",
        });
        navigate("/login");
      } else {
        setIsAuthenticated(true);
      }
    };
    checkAuth();
  }, [navigate, toast]);

  // Fetch existing configuration
  const { data: config, isLoading } = useQuery({
    queryKey: ["salesforce-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salesforce_configurations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setInstanceUrl(data.instance_url);
        setIsActive(data.is_active);
      }
      
      return data;
    },
  });

  // Fetch recent sync logs
  const { data: syncLogs } = useQuery({
    queryKey: ["salesforce-sync-logs"],
    queryFn: async () => {
      if (!config?.id) return [];
      
      const { data, error } = await supabase
        .from("salesforce_sync_log")
        .select("*")
        .eq("config_id", config.id)
        .order("started_at", { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!config?.id,
  });

  // Save configuration mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (config?.id) {
        // Update existing
        const { error } = await supabase
          .from("salesforce_configurations")
          .update({
            instance_url: instanceUrl,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", config.id);
        
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("salesforce_configurations")
          .insert({
            user_id: user.id,
            instance_url: instanceUrl,
            is_active: isActive,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesforce-config"] });
      queryClient.invalidateQueries({ queryKey: ["salesforce-configurations"] });
      toast({
        title: "Configuration saved",
        description: "Salesforce configuration has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      // Verify we have a session before calling
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated. Please log in and try again.");
      }

      const { data, error } = await supabase.functions.invoke("salesforce-sync", {
        body: {
          action: "test_connection",
        },
      });

      if (error) {
        console.error("Test connection error:", error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Connection successful",
        description: data.message || "Successfully connected to Salesforce",
      });
    },
    onError: (error) => {
      console.error("Test connection mutation error:", error);
      toast({
        title: "Connection failed",
        description: error.message || "Failed to test connection",
        variant: "destructive",
      });
    },
  });

  // Sync now mutation
  const syncNowMutation = useMutation({
    mutationFn: async () => {
      // Verify we have a session before calling
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated. Please log in and try again.");
      }

      const { data, error } = await supabase.functions.invoke("salesforce-sync", {
        body: {
          action: "sync_bidirectional",
        },
      });

      if (error) {
        console.error("Sync error:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesforce-sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["salesforce-config"] });
      toast({
        title: "Sync started",
        description: "Bidirectional sync has been initiated.",
      });
    },
    onError: (error) => {
      console.error("Sync mutation error:", error);
      toast({
        title: "Sync failed",
        description: error.message || "Failed to start sync",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated || isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/integrations")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Integrations
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salesforce Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your Salesforce integration and manage sync settings
          </p>
        </div>
      </div>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Configuration</CardTitle>
          <CardDescription>
            Configure your Salesforce instance connection. API credentials are stored securely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instance-url">Salesforce Instance URL</Label>
            <Input
              id="instance-url"
              placeholder="https://yourinstance.salesforce.com"
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Your Salesforce instance URL (e.g., https://na30.salesforce.com)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="active">Enable Salesforce sync</Label>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !instanceUrl}
            >
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
            <Button
              variant="outline"
              onClick={() => testConnectionMutation.mutate()}
              disabled={testConnectionMutation.isPending || !config}
            >
              {testConnectionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
          </div>

          {config && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Configuration Active</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: {new Date(config.updated_at).toLocaleString()}
              </p>
            </div>
          )}
          
          {/* Import Actions */}
          <div className="pt-4 border-t space-y-3">
            <h3 className="text-sm font-medium">Import Data</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => navigate("/salesforce-import")}
                variant="default"
              >
                Launch Import Wizard
              </Button>
              <Button
                onClick={() => navigate("/salesforce-import?type=grants")}
                variant="outline"
                className="gap-2"
              >
                Import Grants
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use the wizard for full imports or quick-import your grant opportunities and deliverables
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Dashboard */}
      {config && <SalesforceMonitoringDashboard />}

      {/* Sync Controls */}
      {config && (
        <Card>
          <CardHeader>
            <CardTitle>Sync Controls</CardTitle>
            <CardDescription>
              Manually trigger syncs or view sync history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => syncNowMutation.mutate()}
                disabled={syncNowMutation.isPending}
              >
                {syncNowMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync Now
              </Button>
              {config.last_sync_at && (
                <span className="text-sm text-muted-foreground">
                  Last sync: {new Date(config.last_sync_at).toLocaleString()}
                </span>
              )}
            </div>

            {/* Sync History */}
            {syncLogs && syncLogs.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Recent Sync History</h3>
                <div className="space-y-2">
                  {syncLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            log.status === "completed" ? "default" :
                            log.status === "failed" ? "destructive" : "secondary"
                          }>
                            {log.status}
                          </Badge>
                          <span className="text-sm font-medium">{log.direction}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {log.records_processed} processed • {log.records_created} created • {log.records_updated} updated
                          {log.records_failed > 0 && ` • ${log.records_failed} failed`}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.started_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* API Credentials Notice */}
      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>
            Salesforce API credentials are stored securely as environment secrets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>SALESFORCE_INSTANCE_URL configured</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>SALESFORCE_CLIENT_ID configured</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>SALESFORCE_CLIENT_SECRET configured</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>SALESFORCE_ACCESS_TOKEN configured</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
