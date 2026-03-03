import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Mail, CheckCircle2, Loader2, 
  RefreshCw, Unlink, Settings, ExternalLink, Shield
} from "lucide-react";
import { toast } from "sonner";

interface GmailConnection {
  id: string;
  user_id: string;
  email: string;
  is_active: boolean;
  last_sync_at: string | null;
  auto_sync_enabled: boolean;
  created_at: string;
}

export default function GmailSettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch Gmail connection status
  const { data: connection, isLoading } = useQuery({
    queryKey: ["gmail-connection"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("gmail_connections")
        .select("id, user_id, email, is_active, last_sync_at, auto_sync_enabled, created_at")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as GmailConnection | null;
    },
  });

  // Connect Gmail (initiates OAuth flow)
  const connectGmail = async () => {
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to connect Gmail");
        return;
      }

      // Call edge function to initiate OAuth
      const { data, error } = await supabase.functions.invoke("gmail-oauth", {
        body: { action: "initiate" },
      });

      if (error) throw error;

      // Handle not configured case gracefully
      if (data?.configured === false) {
        toast.error(data.message || "Gmail integration is not configured for this instance.");
        return;
      }

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        console.warn("Gmail OAuth response:", data);
        toast.error("Failed to start Gmail connection. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Error connecting Gmail:", error);
      toast.error("Failed to initiate Gmail connection. Please try again later.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Gmail
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("gmail_connections")
        .update({ is_active: false })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gmail-connection"] });
      toast.success("Gmail disconnected successfully");
    },
    onError: (error) => {
      console.error("Error disconnecting Gmail:", error);
      toast.error("Failed to disconnect Gmail");
    },
  });

  // Toggle auto-sync
  const toggleAutoSync = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!connection) throw new Error("No connection");

      const { error } = await supabase
        .from("gmail_connections")
        .update({ auto_sync_enabled: enabled })
        .eq("id", connection.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gmail-connection"] });
      toast.success("Auto-sync setting updated");
    },
    onError: (error) => {
      console.error("Error updating auto-sync:", error);
      toast.error("Failed to update setting");
    },
  });

  // Sync inbox manually
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("gmail-sync", {
        body: { action: "sync" },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["gmail-connection"] });
      toast.success(`Synced ${data?.processed || 0} emails`);
    },
    onError: (error) => {
      console.error("Error syncing Gmail:", error);
      toast.error("Failed to sync inbox");
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/integrations")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Integrations
          </Button>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Mail className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gmail Integration</h1>
              <p className="text-muted-foreground">
                Connect Gmail for email sending and AI-powered task extraction
              </p>
            </div>
          </div>
        </div>

        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Connection Status
            </CardTitle>
            <CardDescription>
              {connection 
                ? "Your Gmail account is connected" 
                : "Connect your Gmail account to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {connection ? (
              <>
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{connection.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Connected on {new Date(connection.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    Connected
                  </Badge>
                </div>

                <Separator />

                {/* Sync Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-sync emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically extract tasks from new emails
                      </p>
                    </div>
                    <Switch
                      checked={connection.auto_sync_enabled}
                      onCheckedChange={(checked) => toggleAutoSync.mutate(checked)}
                      disabled={toggleAutoSync.isPending}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Last synced</Label>
                      <p className="text-sm text-muted-foreground">
                        {connection.last_sync_at 
                          ? new Date(connection.last_sync_at).toLocaleString()
                          : "Never synced"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncMutation.mutate()}
                      disabled={syncMutation.isPending}
                    >
                      {syncMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Sync Now
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Disconnect */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-destructive">Disconnect Gmail</Label>
                    <p className="text-sm text-muted-foreground">
                      Remove Gmail connection from your account
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending}
                  >
                    {disconnectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Unlink className="h-4 w-4 mr-2" />
                    )}
                    Disconnect
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    We only request read access to extract tasks. Your emails remain private and secure.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h4 className="font-medium">What you can do with Gmail integration:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Send emails directly from the CRM
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      AI-powered task extraction from your inbox
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Track email history with constituents
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Use email templates for outreach
                    </li>
                  </ul>
                </div>

                <Button 
                  onClick={connectGmail} 
                  disabled={isConnecting}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Connect Gmail Account
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Need help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Learn more about setting up Gmail integration and configuring OAuth credentials.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://developers.google.com/gmail/api/quickstart/js" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Gmail API Documentation
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
