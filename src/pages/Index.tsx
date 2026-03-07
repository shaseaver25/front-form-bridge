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
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
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
