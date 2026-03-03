import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  Copy, 
  Check, 
  Loader2,
  Settings,
  Users,
  CreditCard,
  BarChart3,
  Link2,
  ExternalLink,
  Building2,
  Shield,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { 
  useGivebutterConfig, 
  useSaveGivebutterConfig, 
  useGivebutterSync,
  useGivebutterStats,
  useCheckGivebutterConnection,
} from "@/hooks/useGivebutter";
import { GivebutterCampaignMapping } from "./GivebutterCampaignMapping";
import { GivebutterContactMatching } from "./GivebutterContactMatching";
import { GivebutterTransactionLog } from "./GivebutterTransactionLog";
import { GivebutterPlansView } from "./GivebutterPlansView";
import { IntegrationSetupGuide } from "./IntegrationSetupGuide";
import { format } from "date-fns";

export function GivebutterSettings() {
  const { data: config, isLoading: configLoading } = useGivebutterConfig();
  const { mutate: saveConfig, isPending: saving } = useSaveGivebutterConfig();
  const { sync, syncing } = useGivebutterSync();
  const { data: stats } = useGivebutterStats();
  const { mutate: checkConnection, isPending: checking } = useCheckGivebutterConnection();
  
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/givebutter-webhook`;

  const handleSave = () => {
    saveConfig({
      sync_enabled: syncEnabled,
    });
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("Webhook URL copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSync = async (type: "full" | "incremental") => {
    await sync(type);
  };

  const handleTestConnection = () => {
    checkConnection();
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isConnected = config?.api_key_configured === true;

  const setupSteps = [
    {
      title: "Get your Givebutter API key",
      description: "Log into Givebutter and navigate to Settings → API to find your API key.",
      helpUrl: "https://givebutter.com/",
      isCompleted: isConnected,
    },
    {
      title: "Add the API key to your backend",
      description: "Add GIVEBUTTER_API_KEY as a secret in your Lovable Cloud backend settings.",
      isCompleted: isConnected,
    },
    {
      title: "Configure webhook (optional)",
      description: "Set up the webhook URL below in your Givebutter dashboard for real-time updates.",
      isCompleted: !!config?.webhook_secret,
    },
  ];

  return (
    <IntegrationSetupGuide
      integrationName="Givebutter"
      integrationLogo={<CreditCard className="h-6 w-6" />}
      credentialType="org-level"
      isConnected={isConnected}
      setupSteps={!isConnected ? setupSteps : []}
    >
      <div className="space-y-6">
        {/* Stats Overview - only show when connected */}
        {isConnected && stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTransactions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Matches</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingContacts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activePlans}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Recurring</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.mrr.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2" disabled={!isConnected}>
              <Link2 className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-2" disabled={!isConnected}>
              <Users className="h-4 w-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2" disabled={!isConnected}>
              <CreditCard className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2" disabled={!isConnected}>
              <RefreshCw className="h-4 w-4" />
              Recurring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            {/* Connection Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <CardTitle>Connection Status</CardTitle>
                </div>
                <CardDescription>
                  Givebutter uses an organization-wide API key configured as an environment variable.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isConnected ? (
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-600">Connected</p>
                      <p className="text-sm text-muted-foreground">
                        API key is configured in your backend environment
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-600">Not Connected</p>
                      <p className="text-sm text-muted-foreground">
                        Add <code className="bg-muted px-1 py-0.5 rounded text-xs">GIVEBUTTER_API_KEY</code> to your backend secrets
                      </p>
                    </div>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  onClick={handleTestConnection}
                  disabled={checking}
                >
                  {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Connection
                </Button>
              </CardContent>
            </Card>

            {/* Sync Settings */}
            {isConnected && (
              <Card>
                <CardHeader>
                  <CardTitle>Sync Settings</CardTitle>
                  <CardDescription>
                    Configure how data syncs between Givebutter and your CRM.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sync-enabled"
                      checked={syncEnabled}
                      onCheckedChange={setSyncEnabled}
                    />
                    <Label htmlFor="sync-enabled">Enable automatic sync</Label>
                  </div>

                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Settings
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Webhook Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
                <CardDescription>
                  Configure this webhook URL in your Givebutter dashboard to receive real-time updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                    <Button variant="outline" size="icon" onClick={handleCopyWebhook}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {config?.webhook_secret && (
                  <div className="space-y-2">
                    <Label>Webhook Secret</Label>
                    <Input 
                      value={config.webhook_secret} 
                      readOnly 
                      type="password"
                      className="font-mono text-sm" 
                    />
                    <p className="text-xs text-muted-foreground">
                      Use this secret to verify webhook signatures.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sync Controls */}
            {isConnected && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Sync</CardTitle>
                  <CardDescription>
                    Manually trigger a sync to import data from Givebutter.
                    {config?.last_sync_at && (
                      <span className="block mt-1">
                        Last synced: {format(new Date(config.last_sync_at), "PPp")}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button 
                    onClick={() => handleSync("full")} 
                    disabled={syncing}
                  >
                    {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Full Sync
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleSync("incremental")} 
                    disabled={syncing}
                  >
                    Incremental Sync
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link to="/donations/campaigns">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage Donation Campaigns
                </Link>
              </Button>
            </div>
            <GivebutterCampaignMapping />
          </TabsContent>

          <TabsContent value="contacts">
            <GivebutterContactMatching />
          </TabsContent>

          <TabsContent value="transactions">
            <GivebutterTransactionLog />
          </TabsContent>

          <TabsContent value="plans">
            <GivebutterPlansView />
          </TabsContent>
        </Tabs>
      </div>
    </IntegrationSetupGuide>
  );
}
