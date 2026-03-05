import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import { DensityToggle } from "@/components/ui/density-toggle";
import { ListCard } from "@/components/ui/list-card";
import {
  MapPin,
  Building2,
  DollarSign,
  Users,
} from "lucide-react";

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  filled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function JobsList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["crm-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_jobs")
        .select("*, company:crm_companies(id, name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch pipeline candidate counts per job
  const { data: pipelineData } = useQuery({
    queryKey: ["jobs-candidate-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_pipeline_items")
        .select("job_id, contact_id");
      if (error) throw error;
      return data;
    },
  });

  // Fetch placement counts per job
  const { data: placementData } = useQuery({
    queryKey: ["jobs-placement-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_placements")
        .select("job_id");
      if (error) throw error;
      return data;
    },
  });

  const enrichedJobs = useMemo(() => {
    if (!jobs) return [];

    const candidateCountMap: Record<string, number> = {};
    (pipelineData || []).forEach((p: any) => {
      candidateCountMap[p.job_id] = (candidateCountMap[p.job_id] || 0) + 1;
    });

    const placementCountMap: Record<string, number> = {};
    (placementData || []).forEach((p: any) => {
      placementCountMap[p.job_id] = (placementCountMap[p.job_id] || 0) + 1;
    });

    return jobs.map((job) => ({
      ...job,
      candidateCount: candidateCountMap[job.id] || 0,
      placementCount: placementCountMap[job.id] || 0,
    }));
  }, [jobs, pipelineData, placementData]);

  const filtered = enrichedJobs.filter((j) => {
    const term = searchTerm.toLowerCase();
    return (
      j.name.toLowerCase().includes(term) ||
      (j.job_title?.toLowerCase().includes(term)) ||
      (j.company?.name?.toLowerCase().includes(term)) ||
      (j.location?.toLowerCase().includes(term))
    );
  });

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    return `Up to $${max!.toLocaleString()}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-2xl">Jobs</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track open positions and placements
            </p>
          </div>
          <DensityToggle value={density} onChange={setDensity} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <SearchFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            totalCount={enrichedJobs.length}
            filteredCount={filtered.length}
            placeholder="Search by title, company, or location..."
          />
        </div>

        {isLoading ? (
          <SkeletonCard type="grant" count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            type={searchTerm ? "no-results" : "no-data"}
            searchTerm={searchTerm}
            entityName="Job"
          />
        ) : (
          <div
            className={
              density === "comfortable"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in"
                : "space-y-3 animate-fade-in"
            }
          >
            {filtered.map((job) => {
              const salary = formatSalary(job.salary_min, job.salary_max);
              return (
                <ListCard
                  key={job.id}
                  className={`cursor-pointer ${density === "compact" ? "p-4" : ""}`}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`font-semibold text-foreground truncate ${density === "compact" ? "text-base" : "text-lg"}`}
                        >
                          {job.name}
                        </h3>
                        <Badge className={statusColors[job.status] || "bg-muted text-muted-foreground"}>
                          {job.status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      {job.job_title && (
                        <p className="text-sm text-muted-foreground truncate">{job.job_title}</p>
                      )}

                      {density === "comfortable" && (
                        <>
                          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                            {job.company?.name && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {job.company.name}
                              </span>
                            )}
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {job.location}
                              </span>
                            )}
                          </div>

                          <div className="h-px bg-border my-3" />

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Salary</p>
                              <p className="font-medium">{salary || "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pipeline</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  <Users className="h-3 w-3 mr-1" />
                                  {job.candidateCount} candidates
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {job.job_type && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {job.job_type.replace(/_/g, " ")}
                              </Badge>
                            )}
                            {job.remote_type && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {job.remote_type.replace(/_/g, " ")}
                              </Badge>
                            )}
                            {job.placementCount > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {job.placementCount} placed
                              </Badge>
                            )}
                          </div>
                        </>
                      )}

                      {density === "compact" && (
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {job.company?.name && <span>{job.company.name}</span>}
                          {job.location && <span>{job.location}</span>}
                          {job.candidateCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {job.candidateCount}
                            </Badge>
                          )}
                          {salary && <span>{salary}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </ListCard>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
