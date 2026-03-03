import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useProjectRole() {
  const [isProjectRole, setIsProjectRole] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkProjectRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsProjectRole(false);
          setIsLoading(false);
          return;
        }

        const { data: roleData, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error checking project role:", error);
          setIsProjectRole(false);
        } else {
          setIsProjectRole(roleData?.role === "project");
        }
      } catch (error) {
        console.error("Error in useProjectRole:", error);
        setIsProjectRole(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkProjectRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkProjectRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isProjectRole, isLoading };
}
