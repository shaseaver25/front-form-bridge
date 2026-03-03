import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Mail, 
  CheckCircle2, 
  RefreshCw, 
  Inbox,
  Sparkles,
  Clock,
  AlertTriangle
} from "lucide-react";
import { invokeMicrosoftUserOAuthStart } from '@/lib/supabaseClientHelpers';
import { N8nEmailSettingsCard } from "@/components/settings/N8nEmailSettingsCard";



interface UserEmailConnection {
  id: string;
  microsoft_email: string;
  is_active: boolean;
  last_sync_at: string | null;
  auto_sync_enabled: boolean;
  minimum_confidence_threshold: number;
  token_expires_at: string | null;
}

export default function EmailSettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [userConnection, setUserConnection] = useState<UserEmailConnection | null>(null);
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);

  useEffect(() => {
    loadData();
    
    // Handle OAuth callback results
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    
    if (success) {
      toast.success(decodeURIComponent(success));
      navigate("/settings/email", { replace: true });
      loadData();
    } else if (error) {
      toast.error(`Connection failed: ${decodeURIComponent(error)}`);
      navigate("/settings/email", { replace: true });
    }
  }, [searchParams]);

  async function loadData() {
    setLoading(true);
    await Promise.all([loadUserConnection(), loadPendingSuggestionsCount()]);
    setLoading(false);
  }

  async function loadUserConnection() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_microsoft_connections")
        .select("id, microsoft_email, is_active, last_sync_at, auto_sync_enabled, minimum_confidence_threshold, token_expires_at")
        .eq("user_id", user.id)
        .single();

      if (data && !error) {
        setUserConnection(data);
      }
    } catch (error) {
      console.error("No user email connection");
    }
  }

  async function loadPendingSuggestionsCount() {
    try {
      const { count } = await supabase
        .from("email_task_suggestions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      
      setPendingSuggestionsCount(count || 0);
    } catch (error) {
      console.error("Error loading suggestions count");
    }
  }

  async function connectMicrosoftHandler() {
    try {
      const data = await invokeMicrosoftUserOAuthStart(supabase, {}) as { url?: string; configured?: boolean; message?: string } | null;
      
      // Handle not configured case gracefully
      if (data?.configured === false) {
        toast.error(data.message || "Microsoft 365 integration is not configured for this instance.");
        return;
      }
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.warn('Microsoft OAuth started:', data);
        toast.error("Failed to start Microsoft connection. Please try again.");
      }
    } catch (err: any) {
      if (err?.message === 'auth_required' || err?.code === 'AUTH_REQUIRED') {
        toast.error("Please sign in first to connect your email.");
        return;
      }
      console.error('Connection failed:', err);
      toast.error("Failed to connect. Please try again later.");
    }
  }

  async function disconnectUserEmail() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("user_microsoft_connections")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setUserConnection(null);
      toast.success("Email disconnected");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to disconnect");
    }
  }

  async function syncInbox() {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-user-inbox", {});
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(`Found ${data.tasks_found} task suggestions from ${data.fetched} new emails`);
        loadUserConnection();
        loadPendingSuggestionsCount();
      } else {
        toast.error(data?.error || "Sync failed");
      }
    } catch (error: unknown) {
      console.error("Sync error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to sync inbox");
    } finally {
      setSyncing(false);
    }
  }

  async function updateAutoSync(enabled: boolean) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("user_microsoft_connections")
        .update({ auto_sync_enabled: enabled })
        .eq("user_id", user.id);

      if (error) throw error;

      setUserConnection(prev => prev ? { ...prev, auto_sync_enabled: enabled } : null);
      toast.success(enabled ? "Auto-sync enabled" : "Auto-sync disabled");
    } catch (error: unknown) {
      toast.error("Failed to update setting");
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Email Settings</h1>
          <p className="text-muted-foreground">
            Configure email sending and AI-powered task extraction
          </p>
        </div>

        {/* Personal Email Integration - AI Task Extraction */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Email Task Extraction
            </CardTitle>
            <CardDescription>
              Connect your personal Microsoft 365 account to automatically extract tasks from emails using AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userConnection?.is_active ? (
              <>
                {/* Token expiry warning */}
                {userConnection.token_expires_at && (() => {
                  const expiresAt = new Date(userConnection.token_expires_at);
                  const now = new Date();
                  const isExpired = expiresAt < now;
                  const isExpiringSoon = !isExpired && (expiresAt.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000;
                  
                  if (isExpired) {
                    return (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Your Microsoft connection token has expired. Click "Connect My Email" below to re-authenticate.
                        </AlertDescription>
                      </Alert>
                    );
                  }
                  if (isExpiringSoon) {
                    return (
                      <Alert className="mb-4 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                          Your Microsoft token expires {expiresAt.toLocaleDateString()}. Consider reconnecting soon to avoid disruption.
                        </AlertDescription>
                      </Alert>
                    );
                  }
                  return null;
                })()}

                <div className="flex items-center gap-3">
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {userConnection.microsoft_email}
                  </span>
                </div>

                {userConnection.last_sync_at && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Last synced: {new Date(userConnection.last_sync_at).toLocaleString()}
                  </div>
                )}

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="auto-sync" className="font-medium">Auto-sync every hour</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically check for new emails and extract tasks
                    </p>
                  </div>
                  <Switch
                    id="auto-sync"
                    checked={userConnection.auto_sync_enabled}
                    onCheckedChange={updateAutoSync}
                  />
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <Button onClick={syncInbox} disabled={syncing}>
                    {syncing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Inbox className="h-4 w-4 mr-2" />
                    )}
                    Sync Inbox Now
                  </Button>
                  
                  {pendingSuggestionsCount > 0 && (
                    <Button variant="secondary" onClick={() => navigate("/tasks/email-suggestions")}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {pendingSuggestionsCount} Suggestions
                    </Button>
                  )}

                  <Button variant="outline" onClick={disconnectUserEmail}>
                    Disconnect
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    Connect your email to let AI scan for actionable tasks. The AI will suggest tasks from grant deadlines, meeting requests, follow-ups, and more.
                  </AlertDescription>
                </Alert>
                <Button onClick={connectMicrosoftHandler}>
                  <Mail className="h-4 w-4 mr-2" />
                  Connect My Email
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* n8n Email Integration */}
        <N8nEmailSettingsCard />

        {/* Quick Links */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate("/tasks/email-suggestions")}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Task Suggestions
            {pendingSuggestionsCount > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingSuggestionsCount}</Badge>
            )}
          </Button>
          <Button variant="outline" onClick={() => navigate("/settings/email-templates")}>
            Manage Email Templates
          </Button>
          <Button variant="outline" onClick={() => navigate("/communications/email-log")}>
            View Email History
          </Button>
        </div>
      </div>
    </Layout>
  );
}
