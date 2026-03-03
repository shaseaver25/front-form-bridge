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
  Heart,
  Phone,
  MapPin,
  Users,
  Calendar,
  Target,
  FileText,
  Activity,
  Briefcase,
  Save,
  X,
  Pencil,
  Kanban,
} from "lucide-react";
import { SiteContactsSection } from "@/components/sites/SiteContactsSection";
import { SiteActivitiesSection } from "@/components/sites/SiteActivitiesSection";
import { SiteOpportunitiesSection } from "@/components/sites/SiteOpportunitiesSection";
import { SiteProgramsSection } from "@/components/sites/SiteProgramsSection";
import { SiteBoardsSection } from "@/components/sites/SiteBoardsSection";
import { SiteVolunteersSection } from "@/components/sites/SiteVolunteersSection";
import { AddActivityDialog } from "@/components/sites/AddActivityDialog";

const statusColors: Record<string, string> = {
  prospect: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  contacted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_conversation: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  pilot: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  active_partner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function SiteDetail() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [editedConnectionNotes, setEditedConnectionNotes] = useState("");

  const { data: site, isLoading } = useQuery({
    queryKey: ["site", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select(`
          *,
          primary_contact:constituents!sites_primary_contact_id_fkey(id, first_name, last_name, primary_email)
        `)
        .eq("id", siteId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  const updateNotes = useMutation({
    mutationFn: async ({ notes, connection_notes }: { notes: string; connection_notes: string }) => {
      const { error } = await supabase
        .from("sites")
        .update({ notes, connection_notes })
        .eq("id", siteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site", siteId] });
      toast.success("Notes updated");
      setIsEditingNotes(false);
    },
    onError: () => {
      toast.error("Failed to update notes");
    },
  });

  const handleEditNotes = () => {
    setEditedNotes(site?.notes || "");
    setEditedConnectionNotes(site?.connection_notes || "");
    setIsEditingNotes(true);
  };

  const handleSaveNotes = () => {
    updateNotes.mutate({
      notes: editedNotes,
      connection_notes: editedConnectionNotes,
    });
  };

  const handleCancelEdit = () => {
    setIsEditingNotes(false);
    setEditedNotes("");
    setEditedConnectionNotes("");
  };

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

  if (!site) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4">Site not found</p>
          <Button onClick={() => navigate("/sites")}>Back to Sites</Button>
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
              <h1 className="text-3xl font-bold tracking-tight">{site.name}</h1>
              <Badge className={statusColors[site.relationship_status || "prospect"]}>
                {(site.relationship_status || "prospect").replace(/_/g, " ")}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {site.organization_type && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {site.organization_type.replace(/_/g, " ")}
                </span>
              )}
              {(site.address_city || site.city) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {site.address_city || site.city}, {site.address_state || site.state}
                </span>
              )}
              {site.enrollment && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {site.enrollment.toLocaleString()} students
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAddActivity(true)}>
              <Activity className="mr-2 h-4 w-4" />
              Log Activity
            </Button>
            <Button variant="outline" onClick={() => navigate(`/sites/${siteId}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Instructor</p>
              <p className="text-lg font-semibold">{site.instructor_name || "Not assigned"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Volunteers Needed</p>
              <p className="text-lg font-semibold">{site.volunteers_needed ? "Yes" : "No"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Meeting Time</p>
              <p className="text-lg font-semibold">{site.meeting_time || "Not set"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Meeting Days</p>
              <p className="text-lg font-semibold">
                {site.meeting_days?.length ? site.meeting_days.join(", ") : "Not set"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Budget Tier</p>
              <p className="text-lg font-semibold capitalize">{site.budget_tier || "Unknown"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Tech Readiness</p>
              <p className="text-lg font-semibold capitalize">{site.tech_readiness || "Unknown"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Decision Timeline</p>
              <p className="text-lg font-semibold">{site.decision_timeline || "Not set"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Connection</p>
              <p className="text-lg font-semibold capitalize">
                {site.connection_source?.replace(/_/g, " ") || "Unknown"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        {(site.website || site.phone || site.address_street) && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-6">
                {site.website && (
                  <a
                    href={site.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-primary"
                  >
                    <Globe className="h-4 w-4" />
                    {site.website}
                  </a>
                )}
                {site.phone && (
                  <span className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    {site.phone}
                  </span>
                )}
                {site.address_street && (
                  <span className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    {site.address_street}, {site.address_city}, {site.address_state} {site.address_zip}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="activities" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activities" className="gap-2">
              <Activity className="h-4 w-4" />
              Activities
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-2">
              <Users className="h-4 w-4" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Opportunities
            </TabsTrigger>
            <TabsTrigger value="programs" className="gap-2">
              <Target className="h-4 w-4" />
              Programs
            </TabsTrigger>
            <TabsTrigger value="boards" className="gap-2">
              <Kanban className="h-4 w-4" />
              Boards
            </TabsTrigger>
            <TabsTrigger value="volunteers" className="gap-2">
              <Heart className="h-4 w-4" />
              Volunteers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activities">
            <SiteActivitiesSection siteId={siteId!} />
          </TabsContent>

          <TabsContent value="contacts">
            <SiteContactsSection siteId={siteId!} />
          </TabsContent>

          <TabsContent value="opportunities">
            <SiteOpportunitiesSection siteId={siteId!} />
          </TabsContent>

          <TabsContent value="programs">
            <SiteProgramsSection siteId={siteId!} />
          </TabsContent>

          <TabsContent value="boards">
            <SiteBoardsSection siteId={siteId!} siteName={site.name} />
          </TabsContent>

          <TabsContent value="volunteers">
            <SiteVolunteersSection siteId={siteId!} siteName={site.name} />
          </TabsContent>
        </Tabs>

        {/* Notes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Notes</CardTitle>
            {isEditingNotes ? (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveNotes} disabled={updateNotes.isPending}>
                  <Save className="h-4 w-4 mr-1" />
                  {updateNotes.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleEditNotes}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingNotes ? (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Connection Notes
                  </p>
                  <Textarea
                    value={editedConnectionNotes}
                    onChange={(e) => setEditedConnectionNotes(e.target.value)}
                    placeholder="Add connection notes..."
                    rows={3}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    General Notes
                  </p>
                  <Textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add general notes..."
                    rows={4}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Connection Notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {site.connection_notes || <span className="text-muted-foreground italic">No connection notes</span>}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    General Notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {site.notes || <span className="text-muted-foreground italic">No general notes</span>}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <AddActivityDialog
          siteId={siteId!}
          open={showAddActivity}
          onOpenChange={setShowAddActivity}
        />
      </div>
    </Layout>
  );
}
