import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SUPER_ADMIN_DOMAIN = "tailoredu.org";

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

        // Super admin = has admin role AND is from the TailoredU domain
        const emailDomain = user.email?.split("@")[1]?.toLowerCase();
        if (emailDomain !== SUPER_ADMIN_DOMAIN) {
          setIsSuperAdmin(false);
          setIsLoading(false);
          return;
        }

        // Server-side admin check using the has_role database function
        const { data, error } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });

        if (error) {
          console.error("Error checking admin role:", error);
          setIsSuperAdmin(false);
        } else {
          setIsSuperAdmin(!!data);
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
