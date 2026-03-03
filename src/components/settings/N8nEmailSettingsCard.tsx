import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Webhook, Shield, CheckCircle2, XCircle } from "lucide-react";
import { useN8nEmailConfig } from "@/hooks/useN8nEmailConfig";
import { supabase } from "@/integrations/supabase/client";

interface EmailConnection {
  provider: "microsoft" | "gmail";
  email: string;
  connected: boolean;
}

export function N8nEmailSettingsCard() {
  const { config, loading, saveConfig } = useN8nEmailConfig();
  const [saving, setSaving] = useState(false);
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);

  // Form state
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [inboundEnabled, setInboundEnabled] = useState(false);
  const [preferredProvider, setPreferredProvider] = useState<"microsoft" | "gmail">("microsoft");

  // Load email connections
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const conns: EmailConnection[] = [];

        // Check Microsoft connection
        const { data: msConn } = await supabase
          .from("user_microsoft_connections")
          .select("microsoft_email")
          .eq("user_id", user.id)
          .maybeSingle();

        if (msConn?.microsoft_email) {
          conns.push({
            provider: "microsoft",
            email: msConn.microsoft_email,
            connected: true,
          });
        }

        // Check Gmail connection
        const { data: gmailConn } = await supabase
          .from("gmail_connections")
          .select("email")
          .eq("user_id", user.id)
          .maybeSingle();

        if (gmailConn?.email) {
          conns.push({
            provider: "gmail",
            email: gmailConn.email,
            connected: true,
          });
        }

        setConnections(conns);
      } catch (error) {
        console.error("Error loading connections:", error);
      } finally {
        setLoadingConnections(false);
      }
    };

    loadConnections();
  }, []);

  // Populate form from config
  useEffect(() => {
    if (config) {
      setWebhookUrl(config.outbound_webhook_url || "");
      setWebhookSecret(config.inbound_webhook_secret || "");
      setInboundEnabled(config.inbound_enabled || false);
      setPreferredProvider(config.preferred_provider || "microsoft");
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveConfig({
        outbound_webhook_url: webhookUrl || null,
        inbound_webhook_secret: webhookSecret || null,
        inbound_enabled: inboundEnabled,
        preferred_provider: preferredProvider,
      });
    } finally {
      setSaving(false);
    }
  };

  const generateSecret = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const secret = Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
    setWebhookSecret(secret);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Webhook className="h-5 w-5 text-primary" />
          <CardTitle>n8n Email Integration</CardTitle>
        </div>
        <CardDescription>
          Configure n8n to send and receive emails using your connected email accounts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connected Accounts */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Connected Email Accounts</Label>
          {loadingConnections ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading connections...
            </div>
          ) : connections.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4" />
              No email accounts connected. Connect an account in Email Settings.
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map((conn) => (
                <div key={conn.provider} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{conn.email}</span>
                  <Badge variant="outline" className="capitalize">
                    {conn.provider}
                  </Badge>
                  <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preferred Provider */}
        {connections.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="preferred-provider">Preferred Email Provider</Label>
            <Select value={preferredProvider} onValueChange={(v) => setPreferredProvider(v as "microsoft" | "gmail")}>
              <SelectTrigger id="preferred-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="microsoft" disabled={!connections.some(c => c.provider === "microsoft")}>
                  Microsoft 365
                </SelectItem>
                <SelectItem value="gmail" disabled={!connections.some(c => c.provider === "gmail")}>
                  Gmail
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This account will be used when sending emails through n8n.
            </p>
          </div>
        )}

        {/* Outbound Webhook URL */}
        <div className="space-y-2">
          <Label htmlFor="webhook-url">n8n Outbound Webhook URL</Label>
          <Input
            id="webhook-url"
            type="url"
            placeholder="https://your-n8n-instance.com/webhook/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            The n8n webhook URL that will receive email sending requests.
          </p>
        </div>

        {/* Inbound Settings */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Inbound Emails</Label>
              <p className="text-xs text-muted-foreground">
                Allow n8n to send received emails to this CRM.
              </p>
            </div>
            <Switch
              checked={inboundEnabled}
              onCheckedChange={setInboundEnabled}
            />
          </div>

          {inboundEnabled && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="webhook-secret">Webhook Secret</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  id="webhook-secret"
                  type="text"
                  placeholder="Generate or enter a secret..."
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button variant="outline" onClick={generateSecret}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                n8n must include this secret in the webhook_secret field when sending inbound emails.
              </p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>

        {/* Webhook Info */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
          <p className="text-sm font-medium">n8n Webhook Endpoints</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Callback URL:</strong>{" "}
              <code className="bg-background px-1 rounded">
                {import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-email-callback
              </code>
            </p>
            <p>
              <strong>Inbound Email URL:</strong>{" "}
              <code className="bg-background px-1 rounded">
                {import.meta.env.VITE_SUPABASE_URL}/functions/v1/receive-n8n-email
              </code>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
