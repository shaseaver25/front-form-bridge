import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, RefreshCw, Link2, Unlink } from 'lucide-react';
import { useQBConnection, useQBSettings } from '@/hooks/useQuickBooks';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function QBConnectionCard() {
  const { data: connection, isLoading: connectionLoading } = useQBConnection();
  const { data: settings, isLoading: settingsLoading } = useQBSettings();
  const queryClient = useQueryClient();

  const isConnected = connection?.is_active || settings?.is_connected;
  const companyName = connection?.company_name || settings?.company_name;
  const lastSync = settings?.last_sync_at;

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('quickbooks-oauth', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.error) throw response.error;
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to connect: ' + error.message);
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (connection?.id) {
        await supabase
          .from('quickbooks_connections')
          .update({ is_active: false })
          .eq('id', connection.id);
      }
      if (settings?.id) {
        await supabase
          .from('quickbooks_settings')
          .update({ is_connected: false })
          .eq('id', settings.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qb-connection'] });
      queryClient.invalidateQueries({ queryKey: ['qb-settings'] });
      toast.success('Disconnected from QuickBooks');
    },
    onError: (error: Error) => {
      toast.error('Failed to disconnect: ' + error.message);
    }
  });

  const isLoading = connectionLoading || settingsLoading;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Connection Status</CardTitle>
            <CardDescription>QuickBooks Online integration</CardDescription>
          </div>
          <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-1">
            {isConnected ? (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3" />
                Disconnected
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        ) : (
          <>
            {isConnected && companyName && (
              <div className="text-sm">
                <span className="text-muted-foreground">Company:</span>{' '}
                <span className="font-medium">{companyName}</span>
              </div>
            )}
            <div className="text-sm">
              <span className="text-muted-foreground">Last sync:</span>{' '}
              <span className="font-medium">
                {lastSync ? format(new Date(lastSync), 'MMM d, yyyy h:mm a') : 'Never'}
              </span>
            </div>
            <div className="flex gap-2">
              {isConnected ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => connectMutation.mutate()}
                    disabled={connectMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reconnect
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending}
                >
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect to QuickBooks
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
