import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SaasOrganizationTemplate {
  id: string;
  name: string;
  organization_type: string;
  description: string | null;
  default_features: Record<string, boolean>;
  default_terminology: Record<string, string>;
  default_pipeline_stages: Array<{ name: string; color: string; order: number }> | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

export function useSaasTemplates(organizationType?: string) {
  const query = useQuery({
    queryKey: ["saas-templates", organizationType],
    queryFn: async () => {
      let queryBuilder = supabase
        .from("saas_organization_templates")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (organizationType) {
        queryBuilder = queryBuilder.eq("organization_type", organizationType);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;
      return data as SaasOrganizationTemplate[];
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
