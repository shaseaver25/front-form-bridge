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
        .select("*")
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
