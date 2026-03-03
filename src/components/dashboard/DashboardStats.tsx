import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, FileText, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalConstituents: number;
  totalDonations: number;
  activeGrants: number;
  pendingTasks: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [constituentsResult, giftsResult, grantsResult, tasksResult] = await Promise.all([
        supabase.from("constituents").select("id", { count: "exact", head: true }),
        supabase.from("gifts").select("amount"),
        supabase.from("grant_opportunities").select("id", { count: "exact", head: true }).in("status_stage", ["application_in_progress", "submitted", "awarded"]),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("assigned_to", user.id).neq("status", "completed"),
      ]);

      const totalDonations = giftsResult.data?.reduce((sum, g) => sum + (g.amount || 0), 0) || 0;

      setStats({
        totalConstituents: constituentsResult.count || 0,
        totalDonations,
        activeGrants: grantsResult.count || 0,
        pendingTasks: tasksResult.count || 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: "Constituents",
      value: stats?.totalConstituents.toLocaleString() || "0",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Total Donations",
      value: `$${(stats?.totalDonations || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Active Grants",
      value: stats?.activeGrants.toLocaleString() || "0",
      icon: FileText,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Pending Tasks",
      value: stats?.pendingTasks.toLocaleString() || "0",
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <Card key={item.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-bold mt-1">{item.value}</p>
              </div>
              <div className={`p-3 rounded-full ${item.bgColor}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
