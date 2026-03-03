import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, AlertTriangle, ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

interface SyncDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: SyncLog | null;
}

export function SyncDetailDialog({ open, onOpenChange, log }: SyncDetailDialogProps) {
  if (!log) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'started':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'partial':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'to_qb':
        return <ArrowUpRight className="h-5 w-5 text-blue-500" />;
      case 'from_qb':
        return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
      case 'bidirectional':
        return <ArrowLeftRight className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  const duration = log.completed_at
    ? Math.round((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(log.status)}
            Sync Operation Details
          </DialogTitle>
          <DialogDescription>
            {format(new Date(log.started_at), 'MMMM d, yyyy h:mm:ss a')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Sync Type</p>
              <p className="font-medium capitalize">{log.sync_type.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Direction</p>
              <div className="flex items-center gap-2">
                {getDirectionIcon(log.direction)}
                <span className="font-medium capitalize">{log.direction.replace('_', ' ')}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Started</p>
              <p className="font-medium">{format(new Date(log.started_at), 'h:mm:ss a')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="font-medium">
                {log.completed_at ? format(new Date(log.completed_at), 'h:mm:ss a') : 'In Progress'}
              </p>
            </div>
            {duration !== null && (
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">{duration}s</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                {log.status}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Summary Stats */}
          <div>
            <h4 className="font-medium mb-3">Summary</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-2xl font-bold">{log.records_processed}</p>
                <p className="text-xs text-muted-foreground">Processed</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{log.records_created}</p>
                <p className="text-xs text-muted-foreground">Created</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{log.records_updated}</p>
                <p className="text-xs text-muted-foreground">Updated</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{log.records_failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </div>

          {/* Error Details */}
          {log.error_details && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Error Details</h4>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Sync Errors</AlertTitle>
                  <AlertDescription>
                    <pre className="mt-2 text-xs overflow-auto max-h-40">
                      {JSON.stringify(log.error_details, null, 2)}
                    </pre>
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}

          {/* Entity Info */}
          {log.entity_type && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Entity Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Entity Type</p>
                    <p className="font-medium capitalize">{log.entity_type}</p>
                  </div>
                  {log.entity_id && (
                    <div>
                      <p className="text-sm text-muted-foreground">Entity ID</p>
                      <p className="font-mono text-sm">{log.entity_id}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
