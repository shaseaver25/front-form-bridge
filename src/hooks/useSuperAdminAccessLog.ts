import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdmin } from "./useSuperAdmin";

export function useSuperAdminAccessLog() {
  const { isSuperAdmin } = useSuperAdmin();
  const location = useLocation();
  const lastLoggedPath = useRef<string>("");

  useEffect(() => {
    if (!isSuperAdmin) return;
    if (location.pathname === lastLoggedPath.current) return;
    lastLoggedPath.current = location.pathname;

    const logAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      await supabase.from("super_admin_access_log").insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action: "page_visit",
        metadata: { path: location.pathname },
      });
    };

    logAccess();
  }, [isSuperAdmin, location.pathname]);
}
