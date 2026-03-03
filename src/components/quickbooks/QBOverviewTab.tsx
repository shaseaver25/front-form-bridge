import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQBSyncLog, useQBEntityMappings, useUnsyncedGifts, useUnsyncedConstituents } from '@/hooks/useQuickBooks';
import { format } from 'date-fns';
import { FileText, CheckCircle2, XCircle, Clock, AlertTriangle, Users, DollarSign, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function QBOverviewTab() {
  const { data: syncLogs, isLoading: logsLoading } = useQBSyncLog();
  const { data: mappings, isLoading: mappingsLoading } = useQBEntityMappings();
  const { data: unsyncedGifts } = useUnsyncedGifts();
  const { data: unsyncedConstituents } = useUnsyncedConstituents();

  const totalSynced = mappings?.filter(m => m.sync_status === 'synced').length ?? 0;
  const pendingSync = (unsyncedGifts?.length ?? 0) + (unsyncedConstituents?.length ?? 0);
  const syncErrors = mappings?.filter(m => m.sync_status === 'error').length ?? 0;
  const lastSync = syncLogs?.[0];
  const recentLogs = syncLogs?.slice(0, 10) ?? [];

  const giftMappings = mappings?.filter(m => m.entity_type === 'gift') ?? [];
  const constituentMappings = mappings?.filter(m => m.entity_type === 'constituent') ?? [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
      case 'started':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />In Progress</Badge>;
      case 'partial':
        return <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600"><AlertTriangle className="h-3 w-3" />Partial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'to_qb':
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
      case 'from_qb':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (logsLoading || mappingsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Synced Records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSynced}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {giftMappings.length} gifts, {constituentMappings.length} constituents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Sync</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingSync}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {unsyncedGifts?.length ?? 0} gifts, {unsyncedConstituents?.length ?? 0} constituents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last Sync Status</CardDescription>
          </CardHeader>
          <CardContent>
            {lastSync ? (
              <>
                {getStatusBadge(lastSync.status)}
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(lastSync.started_at), 'MMM d, h:mm a')}
                </p>
              </>
            ) : (
              <span className="text-muted-foreground">No syncs yet</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sync Errors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${syncErrors > 0 ? 'text-destructive' : ''}`}>
              {syncErrors}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {syncErrors > 0 ? 'Requires attention' : 'All clear'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <CardDescription>Gifts Synced</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{giftMappings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardDescription>Constituents in QB</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{constituentMappings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <CardDescription>Total Sync Operations</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold">{syncLogs?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 10 sync operations</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sync operations yet</p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getDirectionIcon(log.direction)}
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {log.sync_type.replace('_', ' ')} Sync
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.records_processed} processed, {log.records_created} created, {log.records_updated} updated
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(log.status)}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.started_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
