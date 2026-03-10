import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Star, GripVertical } from "lucide-react";

const PIPELINE_STAGES = ["new", "screening", "submitted", "interview", "offer", "placed", "rejected", "withdrawn"];

const stageColors: Record<string, string> = {
  new: "border-t-blue-500",
  screening: "border-t-yellow-500",
  submitted: "border-t-purple-500",
  interview: "border-t-indigo-500",
  offer: "border-t-green-500",
  placed: "border-t-emerald-500",
  rejected: "border-t-red-500",
  withdrawn: "border-t-gray-500",
};

export function RecruitmentBoard() {
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const navigate = useNavigate();
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
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

  const grouped = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage] = (pipelineItems || []).filter((item: any) => item.status === stage);
    return acc;
  }, {} as Record<string, any[]>);

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    if (draggedItemId) {
      updateStatus.mutate({ id: draggedItemId, status: stage });
      setDraggedItemId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
          {PIPELINE_STAGES.map((stage) => (
            <Card
              key={stage}
              className={`border-t-4 ${stageColors[stage]} transition-colors ${
                dragOverStage === stage ? "ring-2 ring-primary bg-accent/30" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
            >
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
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      className={`rounded-lg border p-3 space-y-2 bg-card cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow ${
                        draggedItemId === item.id ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); navigate(`/contacts/${item.contact?.id}`); }}
                            className="text-sm font-medium truncate text-primary hover:underline text-left"
                          >
                            {item.contact?.first_name} {item.contact?.last_name}
                          </button>
                          {item.contact?.job_title && (
                            <p className="text-xs text-muted-foreground truncate">{item.contact.job_title}</p>
                          )}
                        </div>
                      </div>
                      {selectedJobId === "all" && item.job && (
                        <p className="text-xs text-muted-foreground truncate">
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
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
