import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function QuickBooksSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);

  // Fetch QuickBooks connection
  const { data: connection, isLoading } = useQuery({
    queryKey: ["quickbooks-connection"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("quickbooks_connections")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Connect to QuickBooks mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      setIsConnecting(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("quickbooks-oauth", {
        method: "POST",
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Redirect to QuickBooks OAuth
      window.location.href = data.authUrl;
    },
    onError: (error: Error) => {
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Refresh token mutation
  const refreshTokenMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("quickbooks-refresh-token", {
        method: "POST",
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quickbooks-connection"] });
      toast({
        title: "Token Refreshed",
        description: "QuickBooks access token has been refreshed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Refresh Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("quickbooks_connections")
        .update({ is_active: false })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quickbooks-connection"] });
      toast({
        title: "Disconnected",
        description: "QuickBooks has been disconnected successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Disconnect Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isConnected = connection && connection.is_active;

  // Check token expiration
  const getTokenStatus = () => {
    if (!connection) return null;

    const expiresAt = new Date(connection.token_expires_at);
    const now = new Date();
    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilExpiry <= 0) {
      return { status: "expired", message: "Access token expired", variant: "destructive" as const };
    } else if (hoursUntilExpiry < 0.5) {
      return { status: "expiring", message: "Token expires in less than 30 minutes", variant: "destructive" as const };
    }
    
    return { status: "valid", message: `Token valid`, variant: "default" as const };
  };

  const tokenStatus = getTokenStatus();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/integrations")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Integrations
        </Button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/10">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">QuickBooks Online</h1>
              <p className="text-muted-foreground">
                Sync financial data and donor transactions
              </p>
            </div>
          </div>
          {isConnected && (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </Badge>
          )}
        </div>

        {/* Connection Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>
              Manage your QuickBooks Online integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConnected ? (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Connect your QuickBooks Online account to sync donation data, create invoices, and track financial transactions directly from TailoredU CRM.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="rounded-lg border p-4 space-y-2">
                    <h3 className="font-semibold">What you'll get:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Automatic donation sync to QuickBooks</li>
                      <li>Create invoices for donors</li>
                      <li>Track gift acknowledgments</li>
                      <li>Financial reporting integration</li>
                      <li>Real-time transaction updates</li>
                    </ul>
                  </div>

                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Before connecting:</strong> Make sure you have admin access to your QuickBooks Online account. You'll be redirected to QuickBooks to authorize the connection.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={() => connectMutation.mutate()}
                    disabled={isConnecting}
                    className="w-full"
                    size="lg"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect to QuickBooks
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  {connection.company_name && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Company</span>
                      <span className="font-medium">{connection.company_name}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Company ID</span>
                    <span className="font-mono text-sm">{connection.realm_id}</span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Connected</span>
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(connection.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(connection.updated_at), { addSuffix: true })}
                    </span>
                  </div>

                  {tokenStatus && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-muted-foreground">Token Status</span>
                      <Badge variant={tokenStatus.variant} className="flex items-center gap-1">
                        {tokenStatus.status === "valid" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {tokenStatus.message}
                      </Badge>
                    </div>
                  )}
                </div>

                {tokenStatus?.status !== "valid" && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {tokenStatus?.status === "expired" 
                        ? "Your access token has expired. Click refresh to get a new token."
                        : "Your access token will expire soon. Refresh it to maintain connection."
                      }
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => refreshTokenMutation.mutate()}
                    disabled={refreshTokenMutation.isPending}
                    className="flex-1"
                  >
                    {refreshTokenMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Token
                      </>
                    )}
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to disconnect QuickBooks? You can reconnect at any time.")) {
                        disconnectMutation.mutate();
                      }
                    }}
                    disabled={disconnectMutation.isPending}
                    className="flex-1"
                  >
                    {disconnectMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      "Disconnect"
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Tokens expire after 1 hour and are automatically refreshed
            </p>
            <p>
              • Refresh tokens expire after 100 days - you'll need to reconnect after that
            </p>
            <p>
              • Only QuickBooks Online is supported (not QuickBooks Desktop)
            </p>
            <p>
              • Contact support if you encounter connection issues
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}