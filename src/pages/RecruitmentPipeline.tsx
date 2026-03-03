import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Star, Calendar } from "lucide-react";

const PIPELINE_STAGES = ["new", "screening", "submitted", "interview", "offer", "placed", "rejected", "withdrawn"];

const stageColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  screening: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  submitted: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  interview: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  offer: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  placed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  withdrawn: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function RecruitmentPipeline() {
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: jobs } = useQuery({
    queryKey: ["pipeline-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_jobs")
        .select("id, name, status, company_id, crm_companies:crm_companies(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: pipelineItems, isLoading } = useQuery({
    queryKey: ["pipeline-items", selectedJobId],
    queryFn: async () => {
      let query = supabase
        .from("crm_pipeline_items")
        .select(`
          *,
          contact:crm_contacts(id, first_name, last_name, job_title),
          job:crm_jobs(id, name, crm_companies:crm_companies(name))
        `)
        .order("last_stage_change", { ascending: false });

      if (selectedJobId !== "all") {
        query = query.eq("job_id", selectedJobId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("crm_pipeline_items")
        .update({ status, last_stage_change: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-items"] });
      toast.success("Stage updated");
    },
  });

  // Group by stage
  const grouped = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage] = (pipelineItems || []).filter((item: any) => item.status === stage);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Recruitment Pipeline</h1>
            <p className="text-muted-foreground">Track candidates through hiring stages</p>
          </div>
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Filter by job" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobs?.map((job: any) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.name} {job.crm_companies?.name ? `(${job.crm_companies.name})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {PIPELINE_STAGES.map((stage) => (
              <Card key={stage}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium capitalize">{stage}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{grouped[stage]?.length || 0}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                  {grouped[stage]?.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-4 text-center">No candidates</p>
                  ) : (
                    grouped[stage]?.map((item: any) => (
                      <div key={item.id} className="rounded-lg border p-3 space-y-2 bg-card">
                        <p className="text-sm font-medium">
                          {item.contact?.first_name} {item.contact?.last_name}
                        </p>
                        {item.contact?.job_title && (
                          <p className="text-xs text-muted-foreground">{item.contact.job_title}</p>
                        )}
                        {selectedJobId === "all" && item.job && (
                          <p className="text-xs text-muted-foreground">
                            {item.job.name}{item.job.crm_companies?.name ? ` • ${item.job.crm_companies.name}` : ""}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.average_rating != null && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Star className="h-3 w-3" />{Number(item.average_rating).toFixed(1)}
                            </Badge>
                          )}
                          {item.last_stage_change && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.last_stage_change).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <Select
                          value={item.status}
                          onValueChange={(val) => updateStatus.mutate({ id: item.id, status: val })}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PIPELINE_STAGES.map((s) => (
                              <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
