import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Activity,
  UserPlus,
  GraduationCap,
  AlertTriangle,
  Briefcase,
  FileText,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { useEscalationCount } from "@/hooks/useEscalationCount";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  totalUsers: number;
  pendingInvites: number;
}

interface CrmStats {
  activeSearches: number;
  totalClients: number;
  candidatesPresented: number;
  feedbackRate: number;
}

interface PipelineStage {
  stage: string;
  count: number;
}

interface RecentCrmActivity {
  id: string;
  activity_type: string;
  notes: string | null;
  created_at: string;
  contact_name: string;
}

const PIPELINE_ORDER = [
  "Identified",
  "Screening",
  "Presented to Client",
  "Interview",
  "Offer Extended",
  "Placed",
];

const ACTIVITY_COLORS: Record<string, string> = {
  note: "bg-muted text-muted-foreground",
  call: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  email: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  meeting: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
};

export default function Admin() {
  const navigate = useNavigate();
  const { data: pendingEscalations = 0 } = useEscalationCount();
  const [stats, setStats] = useState<DashboardStats>({ totalUsers: 0, pendingInvites: 0 });
  const [crmStats, setCrmStats] = useState<CrmStats | null>(null);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentCrmActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [crmLoading, setCrmLoading] = useState(true);
  const [crmError, setCrmError] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Load internal admin stats
  useEffect(() => {
    (async () => {
      try {
        const [usersRes, invitesRes] = await Promise.all([
          supabase.from("user_profiles").select("*", { count: "exact", head: true }),
          supabase
            .from("user_invitations")
            .select("*", { count: "exact", head: true })
            .is("accepted_at", null)
            .gt("expires_at", new Date().toISOString()),
        ]);
        setStats({
          totalUsers: usersRes.count || 0,
          pendingInvites: invitesRes.count || 0,
        });
      } catch (e) {
        console.error("Error loading admin stats:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load CRM data
  const loadCrmData = useCallback(async () => {
    setCrmLoading(true);
    setCrmError(false);
    try {
      const [searchesRes, clientsRes, presentedRes, feedbackRes, pipelineRes, activitiesRes] =
        await Promise.all([
          // Active searches
          supabase
            .from("crm_jobs")
            .select("*", { count: "exact", head: true })
            .eq("status", "open"),
          // Total active clients
          supabase
            .from("briefing_room_clients")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
          // Candidates presented
          supabase
            .from("portal_presentations")
            .select("*", { count: "exact", head: true })
            .eq("status", "published"),
          // Feedback count
          supabase
            .from("candidate_feedback")
            .select("*", { count: "exact", head: true }),
          // Pipeline items
          supabase.from("crm_pipeline_items").select("status"),
          // Recent activity with contact names
          supabase
            .from("crm_activities")
            .select("id, activity_type, body, created_at, contact_id")
            .order("created_at", { ascending: false })
            .limit(8),
        ]);

      const presented = presentedRes.count || 0;
      const feedback = feedbackRes.count || 0;

      setCrmStats({
        activeSearches: searchesRes.count || 0,
        totalClients: clientsRes.count || 0,
        candidatesPresented: presented,
        feedbackRate: presented > 0 ? Math.round((feedback / presented) * 100) : 0,
      });

      // Pipeline distribution
      const stageCounts: Record<string, number> = {};
      (pipelineRes.data ?? []).forEach((item: { status: string }) => {
        const stage = item.status || "Unknown";
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      });
      const pipelineData = PIPELINE_ORDER.map((stage) => ({
        stage,
        count: stageCounts[stage] || 0,
      }));
      // Add any stages not in the predefined order
      Object.entries(stageCounts).forEach(([stage, count]) => {
        if (!PIPELINE_ORDER.includes(stage)) {
          pipelineData.push({ stage, count });
        }
      });
      setPipeline(pipelineData);

      // Resolve contact names for recent activity
      const activities = activitiesRes.data ?? [];
      const contactIds = [...new Set(activities.map((a) => a.contact_id).filter(Boolean))];
      let contactMap: Record<string, string> = {};
      if (contactIds.length > 0) {
        const { data: contacts } = await supabase
          .from("crm_contacts")
          .select("id, first_name, last_name")
          .in("id", contactIds);
        contactMap = Object.fromEntries(
          (contacts ?? []).map((c) => [c.id, `${c.first_name || ""} ${c.last_name}`.trim()])
        );
      }
      setRecentActivity(
        activities.map((a) => ({
          id: a.id,
          activity_type: a.activity_type?.toLowerCase() || "note",
          notes: a.body,
          created_at: a.created_at,
          contact_name: a.contact_id ? contactMap[a.contact_id] || "Unknown" : "Unknown",
        }))
      );

      setLastRefreshed(new Date());
    } catch (e) {
      console.error("CRM data load failed:", e);
      setCrmError(true);
    } finally {
      setCrmLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCrmData();
  }, [loadCrmData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCrmData();
  };

  const maxPipelineCount = Math.max(...pipeline.map((p) => p.count), 1);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Command Center</h1>
            <p className="text-muted-foreground">Executive search operations at a glance</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Searches */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Searches</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {crmLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : crmError ? (
                <span className="text-sm text-destructive">—</span>
              ) : (
                <div className="text-2xl font-bold">{crmStats?.activeSearches}</div>
              )}
            </CardContent>
          </Card>

          {/* Total Clients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {crmLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : crmError ? (
                <span className="text-sm text-destructive">—</span>
              ) : (
                <div className="text-2xl font-bold">{crmStats?.totalClients}</div>
              )}
            </CardContent>
          </Card>

          {/* Candidates Presented */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Candidates Presented</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {crmLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : crmError ? (
                <span className="text-sm text-destructive">—</span>
              ) : (
                <div className="text-2xl font-bold">{crmStats?.candidatesPresented}</div>
              )}
            </CardContent>
          </Card>

          {/* Feedback Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feedback Rate</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {crmLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : crmError ? (
                <span className="text-sm text-destructive">—</span>
              ) : (
                <>
                  <div className="text-2xl font-bold">{crmStats?.feedbackRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    of presented candidates have client reactions
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pipeline + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pipeline Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {crmLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))}
                </div>
              ) : crmError ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <p className="text-sm text-muted-foreground">Unable to reach CRM</p>
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pipeline.map((stage) => (
                    <div key={stage.stage} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{stage.stage}</span>
                        <span className="font-medium text-foreground">{stage.count}</span>
                      </div>
                      <div className="h-5 bg-muted rounded-sm overflow-hidden">
                        <div
                          className="h-full rounded-sm transition-all duration-500"
                          style={{
                            width: `${(stage.count / maxPipelineCount) * 100}%`,
                            backgroundColor: "#C9A84C",
                            minWidth: stage.count > 0 ? "8px" : "0",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {crmLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                      <Skeleton className="h-3 w-16 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : crmError ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <p className="text-sm text-muted-foreground">Unable to reach CRM</p>
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    Retry
                  </Button>
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 py-1">
                      <span className="font-medium text-sm text-foreground min-w-0 truncate flex-1">
                        {a.contact_name}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-2 py-0.5 shrink-0 ${ACTIVITY_COLORS[a.activity_type] || ACTIVITY_COLORS.note}`}
                      >
                        {a.activity_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("/admin/users/new")}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add New User
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/users")}>
              <Users className="mr-2 h-4 w-4" />
              View All Users
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/companies")}>
              <Briefcase className="mr-2 h-4 w-4" />
              Company Profiles
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/coaching")}>
              <GraduationCap className="mr-2 h-4 w-4" />
              Coaching Clients
            </Button>
            <Button
              variant={pendingEscalations > 0 ? "default" : "outline"}
              onClick={() => navigate("/admin/escalations")}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Review Escalations
              {pendingEscalations > 0 && (
                <span className="ml-1.5 bg-white/20 rounded-full px-1.5 text-xs">
                  {pendingEscalations}
                </span>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Last Refreshed footer */}
        <div className="flex items-center justify-end gap-2">
          <span
            className="text-[11px] text-muted-foreground"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Last refreshed: {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-full border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>
    </Layout>
  );
}
