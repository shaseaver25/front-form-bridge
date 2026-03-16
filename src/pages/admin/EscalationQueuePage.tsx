import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Escalation {
  id: string;
  support_ticket_id: string | null;
  issue_summary: string;
  affected_area: string | null;
  page_url: string | null;
  details: Record<string, unknown>;
  severity: "low" | "medium" | "high" | "critical";
  proposed_fix: string | null;
  status: string;
  customer_user_id: string | null;
  assigned_to: string | null;
  admin_response: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  applied_at: string | null;
  webhook_sent: boolean;
  created_at: string;
  updated_at: string;
}

type FilterStatus = "pending_approval" | "approved" | "rejected" | "all";

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const STATUS_COLORS: Record<string, string> = {
  pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  applied: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  auto_fixed: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
};

export default function EscalationQueuePage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterStatus>("pending_approval");
  const [selected, setSelected] = useState<Escalation | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const { data: escalations = [], isLoading } = useQuery<Escalation[]>({
    queryKey: ["escalation-queue", filter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("escalation_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Escalation[];
    },
  });

  const handleAction = async (action: "approve" | "reject") => {
    if (!selected) return;
    if (action === "reject" && !adminNotes.trim()) {
      toast.error("Please add notes explaining why this was rejected.");
      return;
    }

    setProcessing(true);
    try {
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = {
        status: action === "approve" ? "approved" : "rejected",
        admin_response: adminNotes.trim() || null,
        ...(action === "approve" ? { approved_at: now } : { rejected_at: now }),
      };

      const { error } = await (supabase as any)
        .from("escalation_queue")
        .update(patch)
        .eq("id", selected.id);

      if (error) throw error;

      // Also update the linked support ticket status
      if (selected.support_ticket_id) {
        await supabase
          .from("support_tickets")
          .update({
            status: action === "approve" ? "in_progress" : "resolved",
            admin_notes: adminNotes.trim() || null,
          })
          .eq("id", selected.support_ticket_id);
      }

      // Log admin action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await (supabase as any).from("admin_activity_log").insert({
          admin_user_id: user.id,
          action_type: action === "approve" ? "escalation_approved" : "escalation_rejected",
          details: {
            escalation_id: selected.id,
            issue_summary: selected.issue_summary,
            severity: selected.severity,
            admin_notes: adminNotes.trim() || null,
          },
        });
      }

      toast.success(
        action === "approve"
          ? "Escalation approved — the fix can proceed."
          : "Escalation rejected — notes saved."
      );

      setSelected(null);
      setAdminNotes("");
      qc.invalidateQueries({ queryKey: ["escalation-queue"] });
      qc.invalidateQueries({ queryKey: ["pending-escalation-count"] });
    } catch (err) {
      console.error("Escalation action failed:", err);
      toast.error("Failed to update escalation. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const openDetail = (escalation: Escalation) => {
    setSelected(escalation);
    setAdminNotes(escalation.admin_response ?? "");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Escalation Queue</h1>
          <p className="text-muted-foreground">
            Review issues flagged by Chip for your approval.
          </p>
        </div>

        {/* Filter tabs */}
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as FilterStatus)}
        >
          <TabsList>
            <TabsTrigger value="pending_approval" className="gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1.5">
              <XCircle className="h-3.5 w-3.5" />
              Rejected
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Escalations
              {!isLoading && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {escalations.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : escalations.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                {filter === "pending_approval"
                  ? "No pending escalations. All clear!"
                  : "No escalations match this filter."}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Issue Summary</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escalations.map((esc) => (
                    <TableRow key={esc.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDistanceToNow(new Date(esc.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] ${
                            SEVERITY_COLORS[esc.severity] ?? SEVERITY_COLORS.low
                          }`}
                        >
                          {esc.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[280px] truncate text-sm">
                        {esc.issue_summary}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {esc.affected_area ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] ${
                            STATUS_COLORS[esc.status] ?? ""
                          }`}
                        >
                          {esc.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDetail(esc)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Escalation Detail
                </SheetTitle>
                <SheetDescription>
                  Review the issue details and take action.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {/* Severity + Status */}
                <div className="flex items-center gap-2">
                  <Badge className={SEVERITY_COLORS[selected.severity]}>
                    {selected.severity}
                  </Badge>
                  <Badge className={STATUS_COLORS[selected.status] ?? ""}>
                    {selected.status.replace(/_/g, " ")}
                  </Badge>
                </div>

                {/* Issue summary */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Issue Summary
                  </h4>
                  <p className="text-sm text-foreground">{selected.issue_summary}</p>
                </div>

                {/* Proposed fix */}
                {selected.proposed_fix && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Proposed Fix
                    </h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {selected.proposed_fix}
                    </p>
                  </div>
                )}

                {/* Affected area */}
                {selected.affected_area && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Affected Area
                    </h4>
                    <p className="text-sm text-foreground">{selected.affected_area}</p>
                  </div>
                )}

                {/* Page URL */}
                {selected.page_url && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Page URL
                    </h4>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selected.page_url}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Created</span>
                    <p>{format(new Date(selected.created_at), "MMM d, yyyy h:mm a")}</p>
                  </div>
                  {selected.approved_at && (
                    <div>
                      <span className="text-muted-foreground text-xs">Approved</span>
                      <p>{format(new Date(selected.approved_at), "MMM d, yyyy h:mm a")}</p>
                    </div>
                  )}
                  {selected.rejected_at && (
                    <div>
                      <span className="text-muted-foreground text-xs">Rejected</span>
                      <p>{format(new Date(selected.rejected_at), "MMM d, yyyy h:mm a")}</p>
                    </div>
                  )}
                </div>

                {/* Webhook status */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    Webhook
                  </h4>
                  <p className="text-sm">
                    {selected.webhook_sent ? (
                      <span className="text-green-600 dark:text-green-400">Sent</span>
                    ) : (
                      <span className="text-muted-foreground">Not sent</span>
                    )}
                  </p>
                </div>

                {/* Admin notes / response */}
                {selected.status === "pending_approval" ? (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Admin Notes
                    </h4>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes (required for rejection)..."
                      className="text-sm min-h-[80px] resize-none"
                    />
                  </div>
                ) : selected.admin_response ? (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Admin Response
                    </h4>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {selected.admin_response}
                    </p>
                  </div>
                ) : null}

                {/* Action buttons */}
                {selected.status === "pending_approval" && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={() => handleAction("approve")}
                      disabled={processing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleAction("reject")}
                      disabled={processing}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
