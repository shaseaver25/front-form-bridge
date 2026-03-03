import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPremiumDomain } from "@/config/premiumDomains";

interface BurndownAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
}

export function useBurndownAccess(): BurndownAccessResult {
  const { data, isLoading } = useQuery({
    queryKey: ["burndown-access"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if user's email domain is in allowed list - grant full access
      if (isPremiumDomain(user.email)) {
        return true;
      }

      // Fallback: Check if any organization has burndown enabled
      const { data: orgs, error } = await supabase
        .from("organizations")
        .select("burndown_enabled")
        .eq("burndown_enabled", true)
        .limit(1);

      if (error) {
        console.error("Error checking burndown access:", error);
        return false;
      }

      return orgs && orgs.length > 0;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    hasAccess: data ?? false,
    isLoading,
  };
}
