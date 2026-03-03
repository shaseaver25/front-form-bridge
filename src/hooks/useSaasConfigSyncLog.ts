import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SaasConfigSyncLog {
  id: string;
  organization_id: string;
  sync_type: string;
  status: string;
  config_pushed: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string | null;
}

export function useSaasConfigSyncLog(orgId: string | undefined) {
  const query = useQuery({
    queryKey: ["saas-config-sync-log", orgId],
    queryFn: async () => {
      if (!orgId) throw new Error("Organization ID is required");
      
      const { data, error } = await supabase
        .from("saas_config_sync_log")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SaasConfigSyncLog[];
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
