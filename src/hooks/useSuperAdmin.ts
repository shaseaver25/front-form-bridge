import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsSuperAdmin(false);
          setIsLoading(false);
          return;
        }

        // Simple email-based super admin check since user_profiles table doesn't exist
        setIsSuperAdmin(user.email === "shannon@tailoredu.org");
      } catch (error) {
        console.error("Error in useSuperAdmin:", error);
        setIsSuperAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSuperAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSuperAdmin();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isSuperAdmin, isLoading };
}
