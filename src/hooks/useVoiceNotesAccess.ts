import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPremiumDomain } from "@/config/premiumDomains";

interface VoiceNotesAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
}

export function useVoiceNotesAccess(): VoiceNotesAccessResult {
  const { data, isLoading } = useQuery({
    queryKey: ["voice-notes-access"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return false;

      // Check if user's email domain is in allowed list - grant full access
      if (isPremiumDomain(user.email)) {
        return true;
      }

      // Fallback: Check if org has voice notes enabled
      const { data: orgs } = await supabase
        .from("organizations")
        .select("voice_notes_enabled")
        .eq("voice_notes_enabled", true)
        .limit(1);
      
      return orgs && orgs.length > 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    hasAccess: data ?? false,
    isLoading,
  };
}
