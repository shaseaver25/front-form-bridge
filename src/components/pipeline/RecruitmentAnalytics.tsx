import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle, TrendingUp, Briefcase, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const PIPELINE_STAGES = ["new", "screening", "submitted", "interview", "offer", "placed", "rejected", "withdrawn"];
const FUNNEL_STAGES = ["new", "screening", "submitted", "interview", "offer", "placed"];

export function RecruitmentAnalytics() {
  const { data: pipelineItems, isLoading: loadingPipeline } = useQuery({
    queryKey: ["analytics-pipeline-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_pipeline_items")
        .select("id, status, last_stage_change, job_id, contact_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: placements, isLoading: loadingPlacements } = useQuery({
    queryKey: ["analytics-placements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_placements")
        .select("id, placement_date, fee_amount, salary, job_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: recentActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ["analytics-recent-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_pipeline_items")
        .select(`
          id, status, last_stage_change,
          contact:crm_contacts(first_name, last_name),
          job:crm_jobs(name)
        `)
        .not("last_stage_change", "is", null)
        .order("last_stage_change", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingPipeline || loadingPlacements || loadingActivity;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const items = pipelineItems || [];
  const placed = placements || [];

  // Summary metrics
  const totalCandidates = items.length;
  const now = new Date();
  const thisMonth = placed.filter((p) => {
    if (!p.placement_date) return false;
    const d = new Date(p.placement_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const placementsThisMonth = thisMonth.length;

  const submittedCount = items.filter((i) => ["submitted", "interview", "offer", "placed"].includes(i.status)).length;
  const placedCount = items.filter((i) => i.status === "placed").length;
  const conversionRate = submittedCount > 0 ? ((placedCount / submittedCount) * 100).toFixed(1) : "0";

  const activeJobIds = new Set(items.map((i) => i.job_id));
  const activeJobs = activeJobIds.size;

  // Stage distribution
  const stageCounts = PIPELINE_STAGES.map((stage) => ({
    stage,
    count: items.filter((i) => i.status === stage).length,
  }));
  const maxCount = Math.max(...stageCounts.map((s) => s.count), 1);

  // Funnel
  const funnelCounts = FUNNEL_STAGES.map((stage) => {
    if (stage === "placed") {
      return { stage, count: items.filter((i) => i.status === "placed").length };
    }
    // Count items that reached this stage or beyond
    const stageIndex = FUNNEL_STAGES.indexOf(stage);
    return {
      stage,
      count: items.filter((i) => {
        const itemIndex = FUNNEL_STAGES.indexOf(i.status);
        // Include if currently at or past this stage (excluding rejected/withdrawn)
        return itemIndex >= stageIndex || i.status === stage;
      }).length,
    };
  });

  // Simple funnel: just count items currently at each stage
  const simpleFunnel = FUNNEL_STAGES.map((stage) => ({
    stage,
    count: items.filter((i) => i.status === stage).length,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total in Pipeline</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCandidates}</div>
            <p className="text-xs text-muted-foreground">Active candidates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Placements This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{placementsThisMonth}</div>
            <p className="text-xs text-muted-foreground">Successful placements</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Submitted → Placed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs}</div>
            <p className="text-xs text-muted-foreground">Jobs with candidates</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Stage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stage Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stageCounts.map(({ stage, count }) => (
              <div key={stage} className="flex items-center gap-3">
                <span className="text-sm capitalize w-24 shrink-0">{stage}</span>
                <Progress value={(count / maxCount) * 100} className="flex-1 h-2" />
                <span className="text-sm font-medium w-8 text-right">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {simpleFunnel.map(({ stage, count }, i) => {
              const prev = i > 0 ? simpleFunnel[i - 1].count : null;
              const dropOff = prev && prev > 0 ? (((prev - count) / prev) * 100).toFixed(0) : null;
              return (
                <div key={stage} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm capitalize font-medium">{stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{count}</span>
                      {dropOff && Number(dropOff) > 0 && (
                        <Badge variant="outline" className="text-xs text-destructive">
                          -{dropOff}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  {i < simpleFunnel.length - 1 && (
                    <div className="flex justify-center">
                      <ArrowRight className="h-3 w-3 text-muted-foreground rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Stage Changes</CardTitle>
        </CardHeader>
        <CardContent>
          {(recentActivity?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground italic">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">
                      {item.contact?.first_name} {item.contact?.last_name}
                    </span>
                    {item.job?.name && (
                      <span className="text-muted-foreground"> • {item.job.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="capitalize text-xs">{item.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.last_stage_change).toLocaleDateString()}
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
