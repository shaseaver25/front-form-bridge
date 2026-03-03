import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";

export default function NotionSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [databases, setDatabases] = useState<any[]>([]);

  const { data: config, isLoading } = useQuery({
    queryKey: ['notion-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notion_sync_config')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: syncLogs } = useQuery({
    queryKey: ['notion-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notion_sync_log')
        .select('*')
        .order('synced_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
    enabled: !!config,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notion-oauth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'get_auth_url' }),
      });

      const { authUrl } = await response.json();
      window.location.href = authUrl;
    },
    onError: (error: Error) => {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const syncNowMutation = useMutation({
    mutationFn: async () => {
      if (!config) return;

      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('sync_to_notion', true)
        .is('related_grant_opportunity_id', null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notion-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'push_tasks',
          configId: config.id,
          accessToken: config.access_token,
          databaseId: config.notion_database_id,
          tasks: tasks || [],
        }),
      });

      await response.json();
      
      await supabase
        .from('notion_sync_config')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', config.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notion-config'] });
      queryClient.invalidateQueries({ queryKey: ['notion-sync-logs'] });
      toast({
        title: "Sync completed",
        description: "Tasks have been synchronized with Notion",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!config) return;
      
      const { error } = await supabase
        .from('notion_sync_config')
        .delete()
        .eq('id', config.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notion-config'] });
      toast({
        title: "Disconnected",
        description: "Notion integration has been removed",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notion Integration</h1>
        <p className="text-muted-foreground">Sync tasks between TailoredU CRM and Notion</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>
            Manage your Notion workspace connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!config ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Notion workspace to automatically sync tasks and activities
              </p>
              <Button 
                onClick={() => connectMutation.mutate()}
                disabled={connecting}
              >
                {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect to Notion
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  Connected
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {config.notion_workspace_name || 'Workspace'}
                </span>
              </div>

              <div className="grid gap-2">
                <div className="text-sm">
                  <span className="font-medium">Database:</span> {config.notion_database_name || config.notion_database_id}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Last sync:</span>{' '}
                  {config.last_sync_at 
                    ? formatDistanceToNow(new Date(config.last_sync_at), { addSuffix: true })
                    : 'Never'}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => syncNowMutation.mutate()}
                  disabled={syncNowMutation.isPending}
                  variant="outline"
                >
                  {syncNowMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </Button>
                <Button 
                  onClick={() => disconnectMutation.mutate()}
                  variant="destructive"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {config && syncLogs && syncLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sync History</CardTitle>
            <CardDescription>Recent synchronization events</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(log.synced_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="capitalize">{log.action}</TableCell>
                    <TableCell className="capitalize">{log.sync_direction}</TableCell>
                    <TableCell>
                      {log.status === 'success' ? (
                        <Badge variant="default" className="gap-1">
                          <Check className="h-3 w-3" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <X className="h-3 w-3" />
                          Error
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.error_message || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
