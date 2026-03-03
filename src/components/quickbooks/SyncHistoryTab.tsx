import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useQBSyncLog } from '@/hooks/useQuickBooks';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Eye, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SyncDetailDialog } from './SyncDetailDialog';

type SyncLog = {
  id: string;
  sync_type: string;
  direction: string;
  entity_type: string | null;
  entity_id: string | null;
  status: string;
  records_processed: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_details: any;
  started_at: string;
  completed_at: string | null;
};

export function SyncHistoryTab() {
  const [filters, setFilters] = useState({
    syncType: 'all',
    direction: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
  });
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: logs, isLoading } = useQBSyncLog(filters);

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

  const getDirectionBadge = (direction: string) => {
    switch (direction) {
      case 'to_qb':
        return <Badge variant="outline" className="gap-1"><ArrowUpRight className="h-3 w-3" />To QB</Badge>;
      case 'from_qb':
        return <Badge variant="outline" className="gap-1"><ArrowDownLeft className="h-3 w-3" />From QB</Badge>;
      case 'bidirectional':
        return <Badge variant="outline" className="gap-1"><ArrowLeftRight className="h-3 w-3" />Bidirectional</Badge>;
      default:
        return <Badge variant="outline">{direction}</Badge>;
    }
  };

  const handleViewDetails = (log: SyncLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>View past synchronization operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Type:</label>
              <Select
                value={filters.syncType}
                onValueChange={(value) => setFilters(f => ({ ...f, syncType: value }))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="incremental">Incremental</SelectItem>
                  <SelectItem value="single_entity">Single Entity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Direction:</label>
              <Select
                value={filters.direction}
                onValueChange={(value) => setFilters(f => ({ ...f, direction: value }))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="to_qb">To QB</SelectItem>
                  <SelectItem value="from_qb">From QB</SelectItem>
                  <SelectItem value="bidirectional">Bidirectional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Status:</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(f => ({ ...f, status: value }))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="started">In Progress</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">From:</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                className="w-[150px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">To:</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                className="w-[150px]"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({
                syncType: 'all',
                direction: 'all',
                status: 'all',
                startDate: '',
                endDate: '',
              })}
            >
              Clear Filters
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sync history found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead className="text-right">Processed</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.started_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell className="capitalize">{log.sync_type.replace('_', ' ')}</TableCell>
                    <TableCell>{getDirectionBadge(log.direction)}</TableCell>
                    <TableCell className="text-right font-mono">{log.records_processed}</TableCell>
                    <TableCell className="text-right font-mono text-green-600">{log.records_created}</TableCell>
                    <TableCell className="text-right font-mono text-blue-600">{log.records_updated}</TableCell>
                    <TableCell className="text-right font-mono text-destructive">{log.records_failed}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(log as SyncLog)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SyncDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        log={selectedLog}
      />
    </>
  );
}
