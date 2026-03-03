import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { syncSiteContact } from "@/utils/siteContactSync";
import { syncSiteVolunteerEvent } from "@/utils/siteVolunteerSync";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import { ArrowLeft } from "lucide-react";
import { SiteForm } from "@/components/sites/SiteForm";

export default function SiteEdit() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: site, isLoading } = useQuery({
    queryKey: ["site", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .eq("id", siteId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });

  const updateSite = useMutation({
    mutationFn: async (formData: any) => {
      // Sanitize empty strings to null for date/uuid fields
      const clean = (val: any): any => (val === '' || val === undefined ? null : val);
      const sanitized = {
        ...formData,
        start_date: clean(formData.start_date),
        end_date: clean(formData.end_date),
        relationship_started_at: clean(formData.relationship_started_at),
        district_id: clean(formData.district_id),
        website: clean(formData.website),
        contact_email: clean(formData.contact_email),
        description: clean(formData.description),
      };
      const { error } = await supabase
        .from("sites")
        .update(sanitized)
        .eq("id", siteId);
      if (error) throw error;

      // Auto-create/link constituent from contact fields
      await syncSiteContact(siteId!, sanitized.contact_name || null, sanitized.contact_email || null, sanitized.contact_phone || null);

      // Auto-create/sync volunteer event if volunteers needed
      await syncSiteVolunteerEvent(siteId!, {
        name: sanitized.name,
        volunteers_needed: sanitized.volunteers_needed ?? false,
        meeting_time: sanitized.meeting_time || null,
        meeting_days: sanitized.meeting_days || null,
        address_street: sanitized.address_street || null,
        address_city: sanitized.address_city || null,
        address_state: sanitized.address_state || null,
        instructor_name: sanitized.instructor_name || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site", siteId] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Site updated successfully");
      navigate(`/sites/${siteId}`);
    },
    onError: () => {
      toast.error("Failed to update site");
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }

  if (!site) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-muted-foreground mb-4">Site not found</p>
          <Button onClick={() => navigate("/sites")}>Back to Organizations</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/sites/${siteId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit {site.name}</h1>
        </div>

        <SiteForm
          site={site as unknown as import("@/types/sites").Site}
          onSubmit={async (data) => {
            await updateSite.mutateAsync(data);
          }}
          isSubmitting={updateSite.isPending}
        />
      </div>
    </Layout>
  );
}
