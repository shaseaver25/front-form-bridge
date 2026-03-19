import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Menu } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import avidEdgeLogo from "@/assets/avidedge-logo.png";

import { SupportModeBanner } from "./admin/SupportModeBanner";
import { ChipAssistant } from "./chip/ChipAssistant";
import { useSuperAdminAccessLog } from "@/hooks/useSuperAdminAccessLog";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setLoading(false);
        navigate("/login");
        return;
      }

      // Check if user is client-only (no admin role) — redirect to client portal
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      const isAdmin = roles?.some((r) => r.role === "admin");
      if (!isAdmin) {
        // Client-only users should not see CRM pages
        navigate("/client/dashboard", { replace: true });
        return;
      }

      setUser(session.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" && !session) {
        setUser(null);
        setLoading(false);
        navigate("/login");
        return;
      }
      setUser((prev) => {
        const newUser = session?.user ?? null;
        if (prev?.id === newUser?.id) return prev;
        return newUser;
      });
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useSuperAdminAccessLog();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto bg-primary rounded-lg flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full bg-background">
        <SupportModeBanner />
        <div className="flex flex-1 min-h-0">
          <AppSidebar />

          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <header className="bg-card border-b border-border sticky top-0 z-50 h-14 flex items-center px-4 gap-4">
              <SidebarTrigger className="shrink-0">
                <Menu className="w-5 h-5" />
              </SidebarTrigger>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-foreground leading-tight">AvidEdge Search</h1>
                </div>
              </div>

              <div className="flex-1" />

              <div className="text-sm text-muted-foreground hidden sm:block">{user.email}</div>
            </header>

            {/* Main content */}
            <main className="flex-1 p-6 overflow-auto">{children}</main>
          </div>
        </div>
      </div>

      <ChipAssistant />
      
    </SidebarProvider>
  );
};

export default Layout;
