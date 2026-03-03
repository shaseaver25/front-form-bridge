import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Mail, 
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface EmailLogEntry {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body_preview: string | null;
  body_html: string | null;
  category: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  constituent_id: string | null;
  related_record_type: string | null;
  related_record_id: string | null;
}

interface EmailStats {
  total_sent: number;
  failed_last_7_days: number;
  queue_size: number;
}

export default function EmailLogPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [stats, setStats] = useState<EmailStats>({ total_sent: 0, failed_last_7_days: 0, queue_size: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [categoryFilter, statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      // Build query
      let query = supabase
        .from("email_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);

      // Get stats
      const { count: sentCount } = await supabase
        .from("email_log")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent");

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: failedCount } = await supabase
        .from("email_log")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed")
        .gte("created_at", sevenDaysAgo.toISOString());

      const { count: queueCount } = await supabase
        .from("email_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      setStats({
        total_sent: sentCount || 0,
        failed_last_7_days: failedCount || 0,
        queue_size: queueCount || 0,
      });

    } catch (error) {
      console.error("Error loading email logs:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "sent":
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Sent</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "queued":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Queued</Badge>;
      case "bounced":
        return <Badge variant="outline" className="text-orange-600"><AlertCircle className="h-3 w-3 mr-1" />Bounced</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  function getCategoryLabel(category: string | null) {
    if (!category) return "—";
    const labels: Record<string, string> = {
      acknowledgment: "Acknowledgment",
      receipt: "Receipt",
      stewardship: "Stewardship",
      grant_reminder: "Grant Reminder",
      system_notification: "System",
    };
    return labels[category] || category;
  }

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.recipient_email.toLowerCase().includes(query) ||
      log.subject.toLowerCase().includes(query) ||
      (log.recipient_name?.toLowerCase().includes(query))
    );
  });

  function exportToCsv() {
    const headers = ["Date", "Recipient", "Email", "Subject", "Category", "Status"];
    const rows = filteredLogs.map(log => [
      log.sent_at || log.created_at,
      log.recipient_name || "",
      log.recipient_email,
      log.subject,
      log.category || "",
      log.status,
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Email History</h1>
            <p className="text-muted-foreground">View all emails sent from the CRM</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/settings/email")}>
            <Mail className="h-4 w-4 mr-2" />
            Email Settings
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Emails Sent Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_sent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Failed (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.failed_last_7_days}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.queue_size}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by recipient or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="acknowledgment">Acknowledgment</SelectItem>
                  <SelectItem value="receipt">Receipt</SelectItem>
                  <SelectItem value="stewardship">Stewardship</SelectItem>
                  <SelectItem value="grant_reminder">Grant Reminder</SelectItem>
                  <SelectItem value="system_notification">System</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="bounced">Bounced</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportToCsv}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Log Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No emails found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Related To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <>
                      <TableRow 
                        key={log.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                      >
                        <TableCell>
                          {expandedRow === log.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-sm">
                            {format(new Date(log.sent_at || log.created_at), "MMM d, yyyy")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(log.sent_at || log.created_at), "h:mm a")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.recipient_name || "—"}</div>
                          <div className="text-sm text-muted-foreground">{log.recipient_email}</div>
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate" title={log.subject}>
                          {log.subject}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getCategoryLabel(log.category)}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>
                          {log.related_record_type && log.related_record_id ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Navigate based on record type
                                if (log.related_record_type === "gift") {
                                  navigate(`/donations?id=${log.related_record_id}`);
                                } else if (log.related_record_type === "grant_opportunity") {
                                  navigate(`/grants?id=${log.related_record_id}`);
                                }
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {log.related_record_type}
                            </Button>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedRow === log.id && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30">
                            <div className="p-4 space-y-3">
                              {log.error_message && (
                                <div className="text-sm text-destructive">
                                  <strong>Error:</strong> {log.error_message}
                                </div>
                              )}
                              <div className="text-sm">
                                <strong>Preview:</strong>
                                <div className="mt-2 p-3 bg-background rounded border text-muted-foreground">
                                  {log.body_preview || "No preview available"}
                                </div>
                              </div>
                              {log.constituent_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/constituents/${log.constituent_id}`)}
                                >
                                  View Constituent Profile
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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
