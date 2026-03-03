import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, RefreshCw, ExternalLink } from 'lucide-react';
import { useFirefliesConnection } from '@/hooks/useFirefliesConnection';
import { format } from 'date-fns';

export function FirefliesConnectionCard() {
  const {
    settings,
    isLoading,
    isConnected,
    saveApiKey,
    testConnection,
    syncNow,
    updateSyncFrequency,
    disconnect,
    isSaving,
    isTesting,
    isSyncing,
  } = useFirefliesConnection();

  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    await saveApiKey(apiKey);
    setApiKey('');
    setShowApiKeyInput(false);
  };

  const handleTestConnection = async () => {
    await testConnection();
  };

  const handleSyncNow = async () => {
    await syncNow();
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Fireflies.ai Connection
              {isConnected ? (
                <Badge variant="default" className="bg-green-500">
                  <Check className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <X className="h-3 w-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Automatically sync meeting transcripts from Fireflies.ai
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Sync Frequency</Label>
                <Select
                  value={settings?.sync_frequency || 'manual'}
                  onValueChange={(value: 'manual' | 'daily' | 'hourly') => updateSyncFrequency(value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Only</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Last Sync</Label>
                <p className="text-sm mt-2">
                  {settings?.last_sync_at
                    ? format(new Date(settings.last_sync_at), 'MMM d, yyyy h:mm a')
                    : 'Never'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSyncNow} disabled={isSyncing}>
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync Now
              </Button>
              <Button variant="outline" onClick={handleTestConnection} disabled={isTesting}>
                {isTesting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Test Connection
              </Button>
              <Button variant="destructive" onClick={handleDisconnect}>
                Disconnect
              </Button>
            </div>
          </>
        ) : showApiKeyInput ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">Fireflies API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Fireflies API key"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveApiKey} disabled={!apiKey.trim() || isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save & Connect
              </Button>
              <Button variant="outline" onClick={() => setShowApiKeyInput(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Fireflies.ai account to automatically sync meeting transcripts.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setShowApiKeyInput(true)}>
                Connect Fireflies
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="https://app.fireflies.ai/settings/api-integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Get API Key
                </a>
              </Button>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Get your API key from Fireflies.ai → Settings → API & Integrations
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
