import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLogAdminAction } from "./useLogAdminAction";

export function useSyncCustomerConfig() {
  const queryClient = useQueryClient();
  const logAction = useLogAdminAction();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const toastId = toast.loading("Syncing configuration...");

      try {
        const { data, error } = await supabase.functions.invoke("sync-customer-config", {
          body: { organization_id: organizationId },
        });

        if (error) throw error;
        
        // Handle skipped sync (no credentials configured yet)
        if (data.skipped) {
          toast.info(data.message || "Sync skipped — credentials not configured yet.", { id: toastId });
          return data;
        }
        
        if (!data.success) throw new Error(data.error || "Sync failed");

        // Log the sync action
        await logAction.mutateAsync({
          action: "sync_config",
          organizationId,
          details: {
            sync_type: "full",
          },
        });

        toast.success("Configuration synced successfully!", { id: toastId });
        return data;
      } catch (error) {
        toast.error(`Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`, {
          id: toastId,
        });
        throw error;
      }
    },
    onSuccess: (_, organizationId) => {
      queryClient.invalidateQueries({ queryKey: ["saas-organization", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["saas-config-sync-log", organizationId] });
    },
  });
}
