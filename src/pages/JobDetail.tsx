import { useState } from "react";
import DOMPurify from "dompurify";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  DollarSign,
  Briefcase,
  Calendar,
  Activity,
  Globe,
} from "lucide-react";

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  filled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function JobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job-detail", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_jobs")
        .select("*, company:crm_companies(id, name, domain)")
        .eq("id", jobId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });

  const { data: candidates } = useQuery({
    queryKey: ["job-candidates", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_pipeline_items")
        .select("*, contact:crm_contacts(id, first_name, last_name, job_title)")
        .eq("job_id", jobId!);
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });

  const { data: placements } = useQuery({
    queryKey: ["job-placements", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_placements")
        .select("*, contact:crm_contacts(id, first_name, last_name)")
        .eq("job_id", jobId!);
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });

  const { data: activities } = useQuery({
    queryKey: ["job-activities", jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_activities")
        .select("*")
        .eq("job_id", jobId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!jobId,
  });

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    return `Up to $${max!.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Job not found</h2>
          <Button variant="link" onClick={() => navigate("/grants")}>
            Back to Jobs
          </Button>
        </div>
      </Layout>
    );
  }

  const salary = formatSalary(job.salary_min, job.salary_max);
  const hourlyRate = formatSalary(job.hourly_rate_min, job.hourly_rate_max);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/grants")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{job.name}</h1>
                {job.job_title && (
                  <p className="text-lg text-muted-foreground mt-1">{job.job_title}</p>
                )}
              </div>
              <Badge className={statusColors[job.status] || "bg-muted text-muted-foreground"}>
                {job.status.replace(/_/g, " ")}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              {job.company?.name && (
                <span
                  className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/sites/${job.company.id}`);
                  }}
                >
                  <Building2 className="h-4 w-4" />
                  {job.company.name}
                </span>
              )}
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
              )}
              {job.job_type && (
                <Badge variant="outline" className="capitalize">
                  {job.job_type.replace(/_/g, " ")}
                </Badge>
              )}
              {job.remote_type && (
                <Badge variant="outline" className="capitalize">
                  {job.remote_type.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                Candidates
              </div>
              <p className="text-2xl font-bold">{candidates?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Briefcase className="h-4 w-4" />
                Openings
              </div>
              <p className="text-2xl font-bold">
                {job.number_of_placements}/{job.number_of_openings}
              </p>
            </CardContent>
          </Card>
          {salary && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  Salary
                </div>
                <p className="text-lg font-bold">{salary}</p>
              </CardContent>
            </Card>
          )}
          {hourlyRate && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  Hourly Rate
                </div>
                <p className="text-lg font-bold">{hourlyRate}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="candidates">
          <TabsList>
            <TabsTrigger value="candidates">
              <Users className="h-4 w-4 mr-1" />
              Candidates ({candidates?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="placements">
              <Briefcase className="h-4 w-4 mr-1" />
              Placements ({placements?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="h-4 w-4 mr-1" />
              Activity ({activities?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="candidates" className="mt-4">
            {candidates && candidates.length > 0 ? (
              <div className="space-y-2">
                {candidates.map((item: any) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => item.contact?.id && navigate(`/contacts/${item.contact.id}`)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-primary hover:underline">
                          {item.contact?.first_name} {item.contact?.last_name}
                        </p>
                        {item.contact?.job_title && (
                          <p className="text-sm text-muted-foreground">{item.contact.job_title}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No candidates in pipeline</p>
            )}
          </TabsContent>

          <TabsContent value="placements" className="mt-4">
            {placements && placements.length > 0 ? (
              <div className="space-y-2">
                {placements.map((p: any) => (
                  <Card
                    key={p.id}
                    className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => p.contact?.id && navigate(`/contacts/${p.contact.id}`)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-primary hover:underline">
                          {p.contact?.first_name} {p.contact?.last_name}
                        </p>
                        {p.placement_date && (
                          <p className="text-sm text-muted-foreground">
                            Placed: {new Date(p.placement_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {p.salary && (
                        <span className="text-sm font-medium">${p.salary.toLocaleString()}</span>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No placements yet</p>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            {activities && activities.length > 0 ? (
              <div className="space-y-2">
                {activities.map((act: any) => (
                  <Card key={act.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm capitalize">
                            {act.activity_type.replace(/_/g, " ")}
                          </p>
                          {act.subject && (
                            <p className="text-sm text-muted-foreground">{act.subject}</p>
                          )}
                        </div>
                        {act.created_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(act.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No activity recorded</p>
            )}
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.description && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                    <div
                      className="text-sm prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description) }}
                    />
                  </div>
                )}
                {job.compensation_details && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Compensation Details</h4>
                    <p className="text-sm whitespace-pre-wrap">{job.compensation_details}</p>
                  </div>
                )}
                {job.start_date && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Start Date</h4>
                    <p className="text-sm">{new Date(job.start_date).toLocaleDateString()}</p>
                  </div>
                )}
                {job.estimated_close_date && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Est. Close Date</h4>
                    <p className="text-sm">{new Date(job.estimated_close_date).toLocaleDateString()}</p>
                  </div>
                )}
                {job.priority && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Priority</h4>
                    <Badge variant="outline" className="capitalize">{job.priority}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
