import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, RefreshCw, CheckCircle2, XCircle, Clock,
  Database, Users, Building2, Briefcase, Award, MessageSquare, MapPin, Loader2,
} from "lucide-react";
import { useCrelateSync } from "@/hooks/useCrelateSync";
import { format } from "date-fns";

const ENTITY_TYPES = [
  { key: "contacts", label: "Contacts", icon: Users, description: "Contacts, emails, phones, URLs, tags" },
  { key: "companies", label: "Companies", icon: Building2, description: "Company records" },
  { key: "jobs", label: "Jobs", icon: Briefcase, description: "Job postings" },
  { key: "placements", label: "Placements", icon: Award, description: "Placement records" },
  { key: "activities", label: "Activities", icon: MessageSquare, description: "Notes, calls, meetings" },
];

export default function CrelateSettings() {
  const navigate = useNavigate();
  const { testConnection, runSync, syncLogs, logsLoading } = useCrelateSync();
  const [syncingEntity, setSyncingEntity] = useState<string | null>(null);

  const handleSync = async (entityType: string) => {
    setSyncingEntity(entityType);
    try {
      await runSync.mutateAsync(entityType);
    } finally {
      setSyncingEntity(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Success</Badge>;
      case "partial":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Partial</Badge>;
      case "running":
        return <Badge variant="outline" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" />Running</Badge>;
      default:
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate("/integrations")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Integrations
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Database className="h-8 w-8" /> Crelate Integration
              </h1>
              <p className="text-muted-foreground mt-1">Sync your CRM data from Crelate</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => testConnection.mutate()}
                disabled={testConnection.isPending}
              >
                {testConnection.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Test Connection
              </Button>
              <Button onClick={() => handleSync("all")} disabled={!!syncingEntity || runSync.isPending}>
                {syncingEntity === "all" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Full Sync
              </Button>
            </div>
          </div>
        </div>

        {/* Entity Sync Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ENTITY_TYPES.map((entity) => {
            const Icon = entity.icon;
            const isSyncing = syncingEntity === entity.key;
            return (
              <Card key={entity.key}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="h-4 w-4" /> {entity.label}
                  </CardTitle>
                  <CardDescription>{entity.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(entity.key)}
                    disabled={!!syncingEntity}
                    className="w-full"
                  >
                    {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Sync {entity.label}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sync History */}
        <Card>
          <CardHeader>
            <CardTitle>Sync History</CardTitle>
            <CardDescription>Recent synchronization runs</CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : syncLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No sync history yet. Run a sync to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {syncLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium capitalize">{log.entity_type}</TableCell>
                      <TableCell>{statusBadge(log.status)}</TableCell>
                      <TableCell>{log.records_created || 0}</TableCell>
                      <TableCell>{log.records_updated || 0}</TableCell>
                      <TableCell>{log.records_failed || 0}</TableCell>
                      <TableCell>{log.started_at ? format(new Date(log.started_at), "MMM d, h:mm a") : "-"}</TableCell>
                      <TableCell>
                        {log.started_at && log.completed_at
                          ? `${Math.round((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000)}s`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
