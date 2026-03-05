import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SaasOrganization } from "./useSaasOrganizations";

export function useSaasOrganization(id: string | undefined) {
  const query = useQuery({
    queryKey: ["saas-organization", id],
    queryFn: async () => {
      if (!id) throw new Error("Organization ID is required");
      
      const { data, error } = await supabase
        .from("saas_organizations")
        .select("id, name, slug, organization_type, contact_name, contact_email, contact_phone, address_line1, address_line2, city, state, zip, country, supabase_project_ref, supabase_url, supabase_anon_key, deployment_url, custom_domain, subscription_tier, stripe_customer_id, stripe_subscription_id, subscription_status, trial_ends_at, current_period_start, current_period_end, addon_events, addon_mailchimp, addon_quickbooks, addon_extra_users, addon_extra_emails, current_user_count, current_constituent_count, emails_sent_this_period, status, provisioned_at, last_config_sync_at, primary_color, secondary_color, accent_color, logo_url, internal_notes, created_at, updated_at")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as SaasOrganization;
    },
    enabled: !!id,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUpdateSaasOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SaasOrganization> }) => {
      const { data, error } = await supabase
        .from("saas_organizations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["saas-organization", data.id] });
      queryClient.invalidateQueries({ queryKey: ["saas-organizations"] });
    },
  });
}
