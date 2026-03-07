import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Landing from "./Landing";
import Layout from "@/components/Layout";
import {
  DashboardStats,
  RecentActivity,
  QuickLinks,
  UnifiedTasksWidget,
} from "@/components/dashboard";

import { MeetingsThisWeekWidget } from "@/components/calendar";
import { TailoredUCustomersWidget } from "@/components/dashboard/TailoredUCustomersWidget";
import { UpcomingEventsWidget } from "@/components/dashboard/UpcomingEventsWidget";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        supabase
          .from("instance_config")
          .select("key, value")
          .eq("key", "setup_completed")
          .maybeSingle()
          .then(({ data }) => {
            setSetupComplete(!!data);
          });
      } else {
        setSetupComplete(null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (!session) setSetupComplete(null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        Loading…
      </div>
    );
  }

  return isAuthenticated ? (
    <Layout>
      <div className="space-y-6">
        {/* Setup banner — shown until setup is complete */}
        {setupComplete === false && !bannerDismissed && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <Settings2 className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Complete your CRM setup</p>
                <p className="text-xs text-muted-foreground">
                  Add your API keys and connect integrations to unlock all features.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate("/setup")}
                className="text-xs font-medium bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:bg-primary/90 transition-colors"
              >
                Finish Setup
              </button>
              <button
                onClick={() => setBannerDismissed(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Welcome header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
        </div>

        {/* Quick Actions */}
        <QuickLinks />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Tasks and Activity */}
          <div className="lg:col-span-2 space-y-6">
            <UnifiedTasksWidget />
            <RecentActivity />
          </div>

          {/* Right column - Widgets */}
          <div className="space-y-6">
            <TailoredUCustomersWidget />
            <UpcomingEventsWidget />
            <MeetingsThisWeekWidget />
            
          </div>
        </div>
      </div>
    </Layout>
  ) : (
    <Landing />
  );
};

export default Index;
