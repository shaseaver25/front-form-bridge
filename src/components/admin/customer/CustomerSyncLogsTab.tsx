import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useSaasConfigSyncLog } from "@/hooks/useSaasConfigSyncLog";
import { format } from "date-fns";
import { Loader2, CheckCircle, XCircle, ChevronDown, FileJson, Clock } from "lucide-react";
import { useState } from "react";

interface CustomerSyncLogsTabProps {
  organizationId: string;
}

export function CustomerSyncLogsTab({ organizationId }: CustomerSyncLogsTabProps) {
  const { data: logs, isLoading } = useSaasConfigSyncLog(organizationId);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No sync history</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Configuration syncs will be logged here once you start syncing.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Sync Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const isExpanded = expandedRows.has(log.id);
            const hasConfig = log.config_pushed && Object.keys(log.config_pushed).length > 0;

            return (
              <Collapsible key={log.id} open={isExpanded} onOpenChange={() => toggleRow(log.id)} asChild>
                <>
                  <TableRow>
                    <TableCell>
                      {hasConfig && (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{log.sync_type}</TableCell>
                    <TableCell>
                      {log.status === "success" ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>Success</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          <span>Failed</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.created_at
                        ? format(new Date(log.created_at), "PPp")
                        : "Unknown"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {log.error_message || (hasConfig ? "View config" : "No config data")}
                    </TableCell>
                  </TableRow>
                  {hasConfig && (
                    <CollapsibleContent asChild>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={5} className="p-4">
                          <div className="flex items-start gap-2">
                            <FileJson className="w-4 h-4 mt-1 text-muted-foreground" />
                            <pre className="text-xs overflow-auto max-h-64 flex-1 bg-background p-3 rounded border">
                              {JSON.stringify(log.config_pushed, null, 2)}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  )}
                </>
              </Collapsible>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
