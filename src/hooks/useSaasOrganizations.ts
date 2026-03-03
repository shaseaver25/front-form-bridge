import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SaasOrganization {
  id: string;
  name: string;
  slug: string;
  organization_type: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  supabase_project_ref: string | null;
  supabase_url: string | null;
  supabase_anon_key: string | null;
  supabase_service_role_key: string | null;
  deployment_url: string | null;
  custom_domain: string | null;
  subscription_tier: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  addon_events: boolean | null;
  addon_mailchimp: boolean | null;
  addon_quickbooks: boolean | null;
  addon_extra_users: number | null;
  addon_extra_emails: number | null;
  current_user_count: number | null;
  current_constituent_count: number | null;
  emails_sent_this_period: number | null;
  status: string | null;
  provisioned_at: string | null;
  last_config_sync_at: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  logo_url: string | null;
  internal_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useSaasOrganizations() {
  const query = useQuery({
    queryKey: ["saas-organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saas_organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SaasOrganization[];
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
