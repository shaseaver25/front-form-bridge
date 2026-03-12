import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import {
  ArrowLeft,
  Edit,
  Building2,
  Globe,
  Users,
  Activity,
  Briefcase,
  Save,
  X,
  Pencil,
  DollarSign,
  MapPin,
} from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  prospect: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  former: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function SiteDetail() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState("");

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_companies")
        .select("*")
        .eq("id", siteId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  // Fetch contacts linked to this company
  const { data: contacts } = useQuery({
    queryKey: ["company-contacts", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_career_history")
        .select("job_title, contact:crm_contacts!inner(id, first_name, last_name, job_title, status)")
        .eq("company_id", siteId)
        .eq("is_current", true);
      if (error) throw error;
      // Flatten the joined data
      return (data || []).map((row: any) => ({
        id: row.contact.id,
        first_name: row.contact.first_name,
        last_name: row.contact.last_name,
        job_title: row.job_title || row.contact.job_title,
        status: row.contact.status,
      }));
    },
    enabled: !!siteId,
  });

  // Fetch jobs linked to this company
  const { data: jobs } = useQuery({
    queryKey: ["company-jobs", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_jobs")
        .select("id, name, job_title, status, location, created_at")
        .eq("company_id", siteId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  // Fetch activities linked to this company
  const { data: activities } = useQuery({
    queryKey: ["company-activities", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_activities")
        .select("id, activity_type, subject, body, created_at, completed")
        .eq("company_id", siteId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  // Fetch addresses linked to this company
  const { data: addresses } = useQuery({
    queryKey: ["company-addresses", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_addresses")
        .select("*")
        .eq("company_id", siteId)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  const updateDescription = useMutation({
    mutationFn: async (description: string) => {
      const { error } = await supabase
        .from("crm_companies")
        .update({ description })
        .eq("id", siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", siteId] });
      toast.success("Description updated");
      setIsEditingDesc(false);
    },
    onError: () => {
      toast.error("Failed to update description");
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 grid-cols-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </Layout>
    );
  }

  if (!company) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4">Company not found</p>
          <Button onClick={() => navigate("/sites")}>Back to Companies</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sites")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
              <Badge className={statusColors[company.status || "prospect"]}>
                {(company.status || "prospect").replace(/_/g, " ")}
              </Badge>
              {company.company_type && (
                <Badge variant="outline">
                  {company.company_type.replace(/_/g, " ")}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {company.domain && (
                <a
                  href={`https://${company.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Globe className="h-4 w-4" />
                  {company.domain}
                </a>
              )}
              {company.revenue && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Revenue: ${Number(company.revenue).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="text-lg font-semibold capitalize">{company.company_type || "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold capitalize">{company.status || "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Contacts</p>
              <p className="text-lg font-semibold">{contacts?.length ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Jobs</p>
              <p className="text-lg font-semibold">{jobs?.length ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="contacts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contacts" className="gap-2">
              <Users className="h-4 w-4" />
              Contacts ({contacts?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="jobs" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Jobs ({jobs?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="activities" className="gap-2">
              <Activity className="h-4 w-4" />
              Activities ({activities?.length ?? 0})
            </TabsTrigger>
            {addresses && addresses.length > 0 && (
              <TabsTrigger value="addresses" className="gap-2">
                <MapPin className="h-4 w-4" />
                Addresses ({addresses.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="contacts">
            <Card>
              <CardContent className="p-4">
                {contacts && contacts.length > 0 ? (
                  <div className="space-y-3">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                      >
                        <div>
                          <p className="font-medium text-primary hover:underline">
                            {contact.first_name} {contact.last_name}
                          </p>
                          {contact.job_title && (
                            <p className="text-sm text-muted-foreground">{contact.job_title}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="capitalize">{contact.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No contacts linked to this company</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardContent className="p-4">
                {jobs && jobs.length > 0 ? (
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{job.name}</p>
                          {job.job_title && (
                            <p className="text-sm text-muted-foreground">{job.job_title}</p>
                          )}
                          {job.location && (
                            <p className="text-sm text-muted-foreground">{job.location}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="capitalize">{job.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No jobs linked to this company</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities">
            <Card>
              <CardContent className="p-4">
                {activities && activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-3 rounded-lg border space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">
                            {activity.subject || activity.activity_type}
                          </p>
                          <Badge variant={activity.completed ? "secondary" : "outline"} className="text-xs">
                            {activity.completed ? "Done" : "Pending"}
                          </Badge>
                        </div>
                        {activity.body && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{activity.body}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at!).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No activities recorded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {addresses && addresses.length > 0 && (
            <TabsContent value="addresses">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {addresses.map((addr: any) => (
                      <div key={addr.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm">
                            {[addr.line1, addr.line2, addr.city, addr.state, addr.zip_code, addr.country].filter(Boolean).join(", ")}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {addr.category}{addr.is_primary ? " • Primary" : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Description */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Description</CardTitle>
            {isEditingDesc ? (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditingDesc(false)}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={() => updateDescription.mutate(editedDesc)} disabled={updateDescription.isPending}>
                  <Save className="h-4 w-4 mr-1" />
                  {updateDescription.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => { setEditedDesc(company.description || ""); setIsEditingDesc(true); }}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditingDesc ? (
              <Textarea
                value={editedDesc}
                onChange={(e) => setEditedDesc(e.target.value)}
                placeholder="Add a description..."
                rows={4}
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">
                {company.description || <span className="text-muted-foreground italic">No description</span>}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
