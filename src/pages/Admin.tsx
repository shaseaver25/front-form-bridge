import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Activity, Clock, UserPlus, GraduationCap, AlertTriangle } from "lucide-react";
import { useEscalationCount } from "@/hooks/useEscalationCount";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  totalUsers: number;
  activeToday: number;
  pendingInvites: number;
}

interface RecentActivity {
  id: string;
  action_type: string;
  created_at: string;
  admin_name: string;
  details: any;
}

export default function Admin() {
  const navigate = useNavigate();
  const { data: pendingEscalations = 0 } = useEscalationCount();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeToday: 0,
    pendingInvites: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      // Get total users count
      const { count: usersCount } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true });

      // Get active today (users who logged in today)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: activeCount } = await supabase
        .from("user_login_history")
        .select("*", { count: "exact", head: true })
        .gte("login_at", today.toISOString())
        .eq("success", true);

      // Get pending invitations
      const { count: pendingCount } = await supabase
        .from("user_invitations")
        .select("*", { count: "exact", head: true })
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString());

      setStats({
        totalUsers: usersCount || 0,
        activeToday: activeCount || 0,
        pendingInvites: pendingCount || 0,
      });

      // Get recent admin activities
      const { data: activities } = await supabase
        .from("admin_activity_log")
        .select(`
          id,
          action_type,
          created_at,
          details,
          admin_user_id,
          user_profiles!admin_activity_log_admin_user_id_fkey(first_name, last_name)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (activities) {
        const formattedActivities = activities.map((activity: any) => ({
          id: activity.id,
          action_type: activity.action_type,
          created_at: activity.created_at,
          admin_name: activity.user_profiles
            ? `${activity.user_profiles.first_name} ${activity.user_profiles.last_name}`
            : "Admin",
          details: activity.details,
        }));
        setRecentActivities(formattedActivities);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getActivityDescription(activity: RecentActivity): string {
    switch (activity.action_type) {
      case "user_invited":
        return `invited new user "${activity.details?.name || activity.details?.email}"`;
      case "role_changed":
        return `changed role for "${activity.details?.user_name}" to ${activity.details?.new_role}`;
      case "password_reset_sent":
        return `sent password reset to user`;
      case "user_deleted":
        return `deleted user account`;
      case "user_deactivated":
        return `deactivated user "${activity.details?.user_name}"`;
      case "user_activated":
        return `activated user "${activity.details?.user_name}"`;
      default:
        return activity.action_type.replace(/_/g, " ");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, roles, and system settings</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvites}</div>
          </CardContent>
        </Card>

        <Card
          className={pendingEscalations > 0 ? "border-amber-300 dark:border-amber-700" : ""}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Escalations</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${pendingEscalations > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${pendingEscalations > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>
              {pendingEscalations}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.admin_name}</span>{" "}
                      {getActivityDescription(activity)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate("/admin/activity-log")}
          >
            View Full Activity Log
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => navigate("/admin/users/new")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add New User
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/users")}>
            <Users className="mr-2 h-4 w-4" />
            View All Users
          </Button>
          <Button variant="outline" onClick={() => navigate("/talent-pool")}>
            <GraduationCap className="mr-2 h-4 w-4" />
            Talent Pool
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/roles")}>
            Roles & Permissions
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/coaching")}>
            <GraduationCap className="mr-2 h-4 w-4" />
            Coaching Clients
          </Button>
          <Button
            variant={pendingEscalations > 0 ? "default" : "outline"}
            onClick={() => navigate("/admin/escalations")}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Review Escalations
            {pendingEscalations > 0 && (
              <span className="ml-1.5 bg-white/20 rounded-full px-1.5 text-xs">
                {pendingEscalations}
              </span>
            )}
          </Button>
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
}