import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrganizationSettings {
  id: string;
  name: string;
  fiscal_year_start_month: number;
}

export function useOrganizationSettings(orgId: string | null) {
  return useQuery({
    queryKey: ["organization-settings", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, fiscal_year_start_month")
        .eq("id", orgId)
        .single();
      
      if (error) throw error;
      return data as OrganizationSettings;
    },
    enabled: !!orgId,
  });
}

export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orgId, 
      fiscal_year_start_month 
    }: { 
      orgId: string; 
      fiscal_year_start_month: number;
    }) => {
      const { data, error } = await supabase
        .from("organizations")
        .update({ fiscal_year_start_month })
        .eq("id", orgId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organization-settings", variables.orgId] });
      toast.success("Fiscal year settings saved");
    },
    onError: (error) => {
      console.error("Failed to update organization settings:", error);
      toast.error("Failed to save settings");
    },
  });
}
