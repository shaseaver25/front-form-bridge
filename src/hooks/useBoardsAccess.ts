import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPremiumDomain } from "@/config/premiumDomains";

export function useBoardsAccess() {
  const { data, isLoading } = useQuery({
    queryKey: ["boards-access"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { hasAccess: false };

      // Check if user's email domain is in allowed list - grant full access
      if (isPremiumDomain(user.email)) {
        return { hasAccess: true };
      }

      // Check if user has a role (meaning they have organization access)
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!userRole) return { hasAccess: false };

      // Get organization and check project_boards_enabled
      const { data: orgs } = await supabase
        .from("organizations")
        .select("project_boards_enabled")
        .limit(1)
        .single();

      return { hasAccess: orgs?.project_boards_enabled ?? false };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    hasAccess: data?.hasAccess ?? false,
    isLoading,
  };
}
