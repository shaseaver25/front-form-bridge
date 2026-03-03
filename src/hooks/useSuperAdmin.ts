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

        // Only shannon@tailoredu.org can be super admin
        if (user.email !== "shannon@tailoredu.org") {
          setIsSuperAdmin(false);
          setIsLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("is_super_admin")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error checking super admin status:", error);
          setIsSuperAdmin(false);
        } else {
          setIsSuperAdmin(profile?.is_super_admin ?? false);
        }
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
