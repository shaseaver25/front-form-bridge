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
import CompanyAvatar from "@/components/companies/CompanyAvatar";
import {
  ArrowLeft,
  Globe,
  Users,
  Activity,
  Briefcase,
  Save,
  X,
  Pencil,
  DollarSign,
  MapPin,
  Link2,
  Paperclip,
  Award,
  Building2,
  Calendar,
  Clock,
  Sparkles,
  Mail,
  Phone,
  Loader2,
  User,
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
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

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

  // Fetch main contact email & phone
  const mainContact = contacts?.[0];
  const { data: mainContactDetails } = useQuery({
    queryKey: ["main-contact-details", mainContact?.id],
    queryFn: async () => {
      const [emailRes, phoneRes] = await Promise.all([
        supabase.from("crm_contact_emails").select("value").eq("contact_id", mainContact!.id).eq("is_primary", true).limit(1),
        supabase.from("crm_contact_phones").select("value").eq("contact_id", mainContact!.id).eq("is_primary", true).limit(1),
      ]);
      return {
        email: emailRes.data?.[0]?.value || null,
        phone: phoneRes.data?.[0]?.value || null,
      };
    },
    enabled: !!mainContact?.id,
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

  // Fetch URLs linked to this company
  const { data: urls } = useQuery({
    queryKey: ["company-urls", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_contact_urls")
        .select("*")
        .eq("company_id", siteId);
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  // Fetch attachments linked to this company
  const { data: attachments } = useQuery({
    queryKey: ["company-attachments", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_attachments")
        .select("*")
        .eq("company_id", siteId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  // Fetch placements for this company's jobs
  const { data: placements } = useQuery({
    queryKey: ["company-placements", siteId],
    queryFn: async () => {
      const { data: companyJobs } = await supabase
        .from("crm_jobs")
        .select("id")
        .eq("company_id", siteId);
      if (!companyJobs?.length) return [];
      const jobIds = companyJobs.map((j) => j.id);
      const { data, error } = await supabase
        .from("crm_placements")
        .select("*, contact:crm_contacts(id, first_name, last_name), job:crm_jobs(id, name)")
        .in("job_id", jobIds)
        .order("placement_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  // Fetch parent company name
  const { data: parentCompany } = useQuery({
    queryKey: ["parent-company", company?.parent_company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_companies")
        .select("id, name")
        .eq("id", company!.parent_company_id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!company?.parent_company_id,
  });

  // Fetch source name
  const { data: source } = useQuery({
    queryKey: ["company-source", company?.source_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_contact_sources")
        .select("id, name")
        .eq("id", company!.source_id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!company?.source_id,
  });

  // Fetch primary owner name
  const { data: owner } = useQuery({
    queryKey: ["company-owner", company?.primary_owner_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, email")
        .eq("id", company!.primary_owner_id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!company?.primary_owner_id,
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

  const generateSummary = async () => {
    if (!company) return;
    setIsGeneratingSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke("company-summary", {
        body: {
          companyName: company.name,
          domain: company.domain,
          description: company.description,
          contactCount: contacts?.length ?? 0,
          jobCount: jobs?.length ?? 0,
          placementCount: placements?.length ?? 0,
          revenue: company.revenue,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        setAiSummary(data.summary);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate summary");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-32" />
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

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

  const primaryAddress = addresses?.find((a: any) => a.is_primary) || addresses?.[0];
  const hqAddressStr = primaryAddress
    ? [primaryAddress.line1, primaryAddress.city, primaryAddress.state, primaryAddress.zip_code].filter(Boolean).join(", ")
    : null;

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
          <div className="flex items-start gap-4">
            <CompanyAvatar
              companyId={company.id}
              iconUrl={company.icon_attachment_url}
              name={company.name}
              size="lg"
              onUpdate={() => queryClient.invalidateQueries({ queryKey: ["company", siteId] })}
            />
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

              {/* Inline metadata row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {company.domain && (
                  <a href={`https://${company.domain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                    <Globe className="h-4 w-4" />
                    {company.domain}
                  </a>
                )}
                {hqAddressStr && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {hqAddressStr}
                  </span>
                )}
                {company.revenue && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    ${Number(company.revenue).toLocaleString()}
                  </span>
                )}
                {parentCompany && (
                  <span className="flex items-center gap-1 cursor-pointer hover:text-primary" onClick={() => navigate(`/sites/${parentCompany.id}`)}>
                    <Building2 className="h-4 w-4" />
                    Parent: {parentCompany.name}
                  </span>
                )}
                {owner && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Owner: {owner.first_name} {owner.last_name}
                  </span>
                )}
              </div>

              {/* Main contact inline */}
              {mainContact && (
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span
                    className="flex items-center gap-1 font-medium text-primary cursor-pointer hover:underline"
                    onClick={() => navigate(`/contacts/${mainContact.id}`)}
                  >
                    <User className="h-4 w-4" />
                    {mainContact.first_name} {mainContact.last_name}
                    {mainContact.job_title && <span className="font-normal text-muted-foreground ml-1">— {mainContact.job_title}</span>}
                  </span>
                  {mainContactDetails?.email && (
                    <a href={`mailto:${mainContactDetails.email}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                      <Mail className="h-3.5 w-3.5" />
                      {mainContactDetails.email}
                    </a>
                  )}
                  {mainContactDetails?.phone && (
                    <a href={`tel:${mainContactDetails.phone}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                      <Phone className="h-3.5 w-3.5" />
                      {mainContactDetails.phone}
                    </a>
                  )}
                </div>
              )}

              {/* Date metadata */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                {company.last_activity_date && (
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Last Activity: {formatDate(company.last_activity_date)}
                  </span>
                )}
                {company.last_engagement_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Last Engagement: {formatDate(company.last_engagement_date)}
                  </span>
                )}
                {company.created_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created: {formatDate(company.created_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Company Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Company Summary
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={generateSummary}
              disabled={isGeneratingSummary}
            >
              {isGeneratingSummary ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Generating…
                </>
              ) : aiSummary ? (
                <>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Generate with AI
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {aiSummary ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{aiSummary}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Click "Generate with AI" to create an overview of this company using public information and your CRM data.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="contacts" className="space-y-4">
          <TabsList className="flex-wrap">
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
            <TabsTrigger value="placements" className="gap-2">
              <Award className="h-4 w-4" />
              Placements ({placements?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="addresses" className="gap-2">
              <MapPin className="h-4 w-4" />
              Addresses ({addresses?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="urls" className="gap-2">
              <Link2 className="h-4 w-4" />
              URLs ({urls?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="attachments" className="gap-2">
              <Paperclip className="h-4 w-4" />
              Files ({attachments?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          {/* Contacts Tab */}
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

          {/* Jobs Tab */}
          <TabsContent value="jobs">
            <Card>
              <CardContent className="p-4">
                {jobs && jobs.length > 0 ? (
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <div>
                          <p className="font-medium text-primary hover:underline">{job.name}</p>
                          {job.job_title && <p className="text-sm text-muted-foreground">{job.job_title}</p>}
                          {job.location && <p className="text-sm text-muted-foreground">{job.location}</p>}
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

          {/* Activities Tab */}
          <TabsContent value="activities">
            <Card>
              <CardContent className="p-4">
                {activities && activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="p-3 rounded-lg border space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{activity.subject || activity.activity_type}</p>
                          <Badge variant={activity.completed ? "secondary" : "outline"} className="text-xs">
                            {activity.completed ? "Done" : "Pending"}
                          </Badge>
                        </div>
                        {activity.body && <p className="text-sm text-muted-foreground line-clamp-2">{activity.body}</p>}
                        <p className="text-xs text-muted-foreground">{new Date(activity.created_at!).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No activities recorded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Placements Tab */}
          <TabsContent value="placements">
            <Card>
              <CardContent className="p-4">
                {placements && placements.length > 0 ? (
                  <div className="space-y-3">
                    {placements.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium text-sm">
                            {p.contact?.first_name} {p.contact?.last_name}
                            {p.job?.name ? ` → ${p.job.name}` : ""}
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                            {p.placement_date && <span>Placed: {formatDate(p.placement_date)}</span>}
                            {p.start_date && <span>Start: {formatDate(p.start_date)}</span>}
                            {p.salary && <span>Salary: ${Number(p.salary).toLocaleString()}</span>}
                            {p.fee_amount && <span>Fee: ${Number(p.fee_amount).toLocaleString()}</span>}
                            {p.fee_percent && <span>Fee%: {p.fee_percent}%</span>}
                          </div>
                          {p.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No placements recorded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
              <CardContent className="p-4">
                {addresses && addresses.length > 0 ? (
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
                ) : (
                  <p className="text-sm text-muted-foreground italic">No addresses on file</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* URLs Tab */}
          <TabsContent value="urls">
            <Card>
              <CardContent className="p-4">
                {urls && urls.length > 0 ? (
                  <div className="space-y-3">
                    {urls.map((url: any) => (
                      <div key={url.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <a
                            href={url.value.startsWith("http") ? url.value : `https://${url.value}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            {url.value}
                          </a>
                          <p className="text-xs text-muted-foreground capitalize">
                            {url.category}{url.is_primary ? " • Primary" : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No URLs on file</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attachments Tab */}
          <TabsContent value="attachments">
            <Card>
              <CardContent className="p-4">
                {attachments && attachments.length > 0 ? (
                  <div className="space-y-3">
                    {attachments.map((att: any) => (
                      <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{att.file_name}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            {att.content_type && <span>{att.content_type}</span>}
                            {att.content_length && <span>{(att.content_length / 1024).toFixed(0)} KB</span>}
                            {att.created_at && <span>{formatDate(att.created_at)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No files attached</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Description */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Description</CardTitle>
            {isEditingDesc ? (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditingDesc(false)}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={() => updateDescription.mutate(editedDesc)} disabled={updateDescription.isPending}>
                  <Save className="h-4 w-4 mr-1" /> {updateDescription.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => { setEditedDesc(company.description || ""); setIsEditingDesc(true); }}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditingDesc ? (
              <Textarea value={editedDesc} onChange={(e) => setEditedDesc(e.target.value)} placeholder="Add a description..." rows={4} />
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
