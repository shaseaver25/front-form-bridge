import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCrelateSync() {
  const queryClient = useQueryClient();

  const testConnection = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("crelate-sync", {
        body: { action: "test" },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Connection failed");
      return data;
    },
    onSuccess: () => toast.success("Connected to Crelate API successfully!"),
    onError: (e) => toast.error("Connection failed: " + e.message),
  });

  const runSync = useMutation({
    mutationFn: async (entityType: string = "all") => {
      if (entityType === "all") {
        // Sync entities one at a time to avoid WORKER_LIMIT
        const entities = ["contacts", "companies", "jobs", "placements", "activities", "documents"];
        const allResults: any[] = [];
        for (const entity of entities) {
          const { data, error } = await supabase.functions.invoke("crelate-sync", {
            body: { action: "sync", entity_type: entity },
          });
          if (error) throw error;
          if (data?.results) allResults.push(...data.results);
        }
        const summary = allResults.reduce(
          (acc, r) => ({
            created: acc.created + (r.created || 0),
            updated: acc.updated + (r.updated || 0),
            failed: acc.failed + (r.failed || 0),
          }),
          { created: 0, updated: 0, failed: 0 }
        );
        return { success: true, results: allResults, summary };
      }
      const { data, error } = await supabase.functions.invoke("crelate-sync", {
        body: { action: "sync", entity_type: entityType },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["crm-sync-log"] });
      const s = data.summary;
      toast.success(`Sync complete: ${s.created} created, ${s.updated} updated${s.failed > 0 ? `, ${s.failed} failed` : ""}`);
    },
    onError: (e) => toast.error("Sync failed: " + e.message),
  });

  const { data: syncLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["crm-sync-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_sync_log" as any)
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as any[];
    },
  });

  return {
    testConnection,
    runSync,
    syncLogs: syncLogs || [],
    logsLoading,
  };
}
