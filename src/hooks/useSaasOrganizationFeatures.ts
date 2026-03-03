import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SaasOrganizationFeature {
  id: string;
  organization_id: string;
  feature_key: string;
  is_enabled: boolean;
  changed_by: string | null;
  changed_at: string | null;
}

export function useSaasOrganizationFeatures(orgId: string | undefined) {
  const query = useQuery({
    queryKey: ["saas-organization-features", orgId],
    queryFn: async () => {
      if (!orgId) throw new Error("Organization ID is required");
      
      const { data, error } = await supabase
        .from("saas_organization_features")
        .select("*")
        .eq("organization_id", orgId);

      if (error) throw error;
      return data as SaasOrganizationFeature[];
    },
    enabled: !!orgId,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useToggleSaasFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      featureKey,
      isEnabled,
    }: {
      organizationId: string;
      featureKey: string;
      isEnabled: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("saas_organization_features")
        .upsert(
          {
            organization_id: organizationId,
            feature_key: featureKey,
            is_enabled: isEnabled,
            changed_by: user?.id,
            changed_at: new Date().toISOString(),
          },
          {
            onConflict: "organization_id,feature_key",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["saas-organization-features", variables.organizationId],
      });
    },
  });
}
