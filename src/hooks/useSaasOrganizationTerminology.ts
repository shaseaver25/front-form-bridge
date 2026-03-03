import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SaasOrganizationTerminology {
  id: string;
  organization_id: string;
  term_key: string;
  term_value: string;
}

export function useSaasOrganizationTerminology(orgId: string | undefined) {
  const query = useQuery({
    queryKey: ["saas-organization-terminology", orgId],
    queryFn: async () => {
      if (!orgId) throw new Error("Organization ID is required");

      const { data, error } = await supabase
        .from("saas_organization_terminology")
        .select("*")
        .eq("organization_id", orgId);

      if (error) throw error;
      return data as SaasOrganizationTerminology[];
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

export function useSaveTerminology() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      terminology,
    }: {
      organizationId: string;
      terminology: Record<string, string>;
    }) => {
      // Delete existing terminology for this org
      await supabase
        .from("saas_organization_terminology")
        .delete()
        .eq("organization_id", organizationId);

      // Insert new terminology
      const entries = Object.entries(terminology).map(([term_key, term_value]) => ({
        organization_id: organizationId,
        term_key,
        term_value,
      }));

      if (entries.length > 0) {
        const { error } = await supabase
          .from("saas_organization_terminology")
          .insert(entries);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["saas-organization-terminology", variables.organizationId],
      });
    },
  });
}
