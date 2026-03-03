import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { Settings } from "lucide-react";

export function AdminNavButton() {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function checkAdminRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");

      setIsAdmin(roles && roles.length > 0);
    }
    checkAdminRole();
  }, []);

  if (!isAdmin) return null;

  return (
    <Button
      variant="ghost"
      className={`rounded-none border-b-2 ${
        location.pathname.startsWith("/admin") ? "border-primary text-primary" : "border-transparent"
      }`}
      onClick={() => navigate("/admin")}
    >
      <Settings className="w-4 h-4 mr-2" />
      Admin
    </Button>
  );
}