import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SaasFeatureDefinition {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  available_starter: boolean | null;
  available_professional: boolean | null;
  available_enterprise: boolean | null;
  requires_addon: string | null;
  display_order: number | null;
  icon_name: string | null;
  created_at: string | null;
}

export function useSaasFeatureDefinitions() {
  const query = useQuery({
    queryKey: ["saas-feature-definitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saas_feature_definitions")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as SaasFeatureDefinition[];
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
