import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionConfig {
  tier: "starter" | "professional" | "enterprise";
  status: "active" | "trialing" | "past_due" | "canceled" | "pending";
}

interface SubscriptionResult {
  tier: SubscriptionConfig["tier"];
  status: SubscriptionConfig["status"];
  isActive: boolean;
  isLoading: boolean;
}

const TIER_ORDER: SubscriptionConfig["tier"][] = ["starter", "professional", "enterprise"];

export function useSubscription(): SubscriptionResult {
  const { data, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instance_config")
        .select("value")
        .eq("key", "subscription")
        .maybeSingle();

      if (error) {
        // Table may not exist yet — silently fall back to defaults
        return null;
      }

      return (data?.value as unknown) as SubscriptionConfig | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const tier = data?.tier ?? "starter";
  const status = data?.status ?? "trialing";
  const isActive = status === "active" || status === "trialing";

  return { tier, status, isActive, isLoading };
}

export { TIER_ORDER };
export type { SubscriptionConfig };
