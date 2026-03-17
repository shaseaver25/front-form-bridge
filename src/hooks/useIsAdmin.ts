import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });

        setIsAdmin(!error && !!data);
      } catch {
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAdmin, isLoading };
}
