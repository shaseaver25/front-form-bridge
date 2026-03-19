import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface RequireClientProps {
  children: React.ReactNode;
}

export function RequireClient({ children }: RequireClientProps) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAllowed(false);
        return;
      }
      // Allow both 'client' and 'admin' roles to access client portal
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasAccess = roles?.some(
        (r) => r.role === "client" || r.role === "admin"
      );
      setAllowed(!!hasAccess);
    }
    check();
  }, []);

  if (allowed === null) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#F5F2ED" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "#C8A96E" }} />
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/client/login" replace />;
  }

  return <>{children}</>;
}
