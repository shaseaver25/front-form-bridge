import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { OrganizationType } from "@/types/priority-types";

interface OrganizationWithType {
  id: string;
  name: string;
  priority_algorithm_type: OrganizationType | null;
}

export function useOrganizationType(orgId: string | null) {
  return useQuery({
    queryKey: ["organization-type", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, priority_algorithm_type")
        .eq("id", orgId)
        .single();
      
      if (error) throw error;
      return data as OrganizationWithType;
    },
    enabled: !!orgId,
  });
}

export function useUpdateOrganizationType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      orgId, 
      priority_algorithm_type 
    }: { 
      orgId: string; 
      priority_algorithm_type: OrganizationType;
    }) => {
      const { data, error } = await supabase
        .from("organizations")
        .update({ priority_algorithm_type })
        .eq("id", orgId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organization-type", variables.orgId] });
      queryClient.invalidateQueries({ queryKey: ["organization-settings", variables.orgId] });
      toast.success("Organization type updated");
    },
    onError: (error) => {
      console.error("Failed to update organization type:", error);
      toast.error("Failed to update organization type");
    },
  });
}

// Hook to get the current user's organization type
// Since user_profiles doesn't have organization_id, we get the first/default organization
export function useCurrentOrganizationType() {
  return useQuery({
    queryKey: ["current-organization-type"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      // Get the first organization (single-tenant assumption)
      const { data: org, error } = await supabase
        .from("organizations")
        .select("id, name, priority_algorithm_type")
        .limit(1)
        .single();
      
      if (error) throw error;
      return org as OrganizationWithType;
    },
  });
}
