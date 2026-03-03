import { useSubscription, TIER_ORDER } from "./useSubscription";
import { useSuperAdmin } from "./useSuperAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPremiumDomain } from "@/config/premiumDomains";

export const TIER_FEATURES = {
  grants: {
    label: "Grants",
    requiredTier: "professional" as const,
    description: "Track grant opportunities, manage applications, and connect funders to programs.",
  },
  major_gifts: {
    label: "Major Gifts",
    requiredTier: "professional" as const,
    description: "Build and manage major donor relationships with a dedicated pipeline.",
  },
  voice_notes: {
    label: "Voice Notes",
    requiredTier: "professional" as const,
    description: "Capture contacts and notes by voice after networking events.",
  },
  burndown: {
    label: "Financial Runway",
    requiredTier: "enterprise" as const,
    description: "Model cash flow projections and track your organization's financial runway.",
  },
} as const;

export type TierFeature = keyof typeof TIER_FEATURES;

interface FeatureAccessResult {
  hasAccess: boolean;
  requiredTier: "professional" | "enterprise";
  featureLabel: string;
  isLoading: boolean;
}

export function useFeatureAccess(feature: TierFeature): FeatureAccessResult {
  const { tier, isActive, isLoading: subLoading } = useSubscription();
  const { isSuperAdmin } = useSuperAdmin();

  const { data: isPremium, isLoading: premiumLoading } = useQuery({
    queryKey: ["premium-domain-check"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return isPremiumDomain(user?.email);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { requiredTier, label } = TIER_FEATURES[feature];

  const hasAccess =
    isSuperAdmin || isPremium === true || (isActive && TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(requiredTier));

  return {
    hasAccess,
    requiredTier,
    featureLabel: label,
    isLoading: subLoading || premiumLoading,
  };
}
