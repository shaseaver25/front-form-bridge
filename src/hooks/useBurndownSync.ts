import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { runFullSync, getSyncStatus, type SyncStatus } from "@/utils/burndown-sync";

// ============== Sync Status Query ==============

export function useBurndownSyncStatus(orgId: string | null) {
  return useQuery({
    queryKey: ["burndown", "sync-status", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      return getSyncStatus(orgId);
    },
    enabled: !!orgId,
    staleTime: 60 * 1000, // 1 minute
  });
}

// ============== Full Sync Mutation ==============

export function useSyncFromCRM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orgId: string) => {
      return runFullSync(orgId);
    },
    onSuccess: (result, orgId) => {
      const totalSynced = result.donationsSynced + result.grantsSynced + result.expensesSynced;
      
      if (result.errors.length > 0) {
        console.warn("Sync completed with errors:", result.errors);
        toast.warning(
          `Synced ${totalSynced} items with ${result.errors.length} warnings`,
          {
            description: result.errors[0], // Show first error
          }
        );
      } else if (totalSynced === 0) {
        toast.info("No new items to sync");
      } else {
        toast.success(
          `Synced ${totalSynced} items`,
          {
            description: `${result.donationsSynced} donations, ${result.grantsSynced} grants, ${result.expensesSynced} expenses`,
          }
        );
      }

      // Invalidate all burndown queries
      queryClient.invalidateQueries({ queryKey: ["burndown"] });
    },
    onError: (error) => {
      console.error("Sync failed:", error);
      toast.error("Failed to sync from CRM", {
        description: String(error),
      });
    },
  });
}

// ============== Combined Hook ==============

export function useBurndownSync(orgId: string | null) {
  const syncStatus = useBurndownSyncStatus(orgId);
  const syncMutation = useSyncFromCRM();

  const runSync = () => {
    if (orgId) {
      syncMutation.mutate(orgId);
    }
  };

  return {
    // Status
    syncStatus: syncStatus.data,
    isLoadingStatus: syncStatus.isLoading,
    
    // Sync action
    runSync,
    isSyncing: syncMutation.isPending,
    lastSyncResult: syncMutation.data,
    syncError: syncMutation.error,
  };
}
