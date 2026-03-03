import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NavLink } from "./NavLink";
import { Settings } from "lucide-react";

export function AdminNavItem() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAdmin(false);
          return;
        }

        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin");

        setIsAdmin(roles && roles.length > 0);
      } catch (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
      }
    }

    checkAdminRole();
  }, []);

  if (!isAdmin) {
    return null;
  }

  const navLinkClass = "px-4 py-2 rounded-md hover:bg-accent transition-colors flex items-center gap-2";
  const activeNavLinkClass = "bg-accent";

  return (
    <NavLink to="/admin" className={navLinkClass} activeClassName={activeNavLinkClass}>
      <Settings className="h-4 w-4" />
      Admin
    </NavLink>
  );
}