import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEscalationCount(enabled = true) {
  return useQuery<number>({
    queryKey: ["pending-escalation-count"],
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("escalation_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_approval");
      return count ?? 0;
    },
    enabled,
    refetchInterval: 30_000,
  });
}
