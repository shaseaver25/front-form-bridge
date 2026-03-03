import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Briefcase, Target, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalContacts: number;
  openJobs: number;
  placements: number;
  pipelineItems: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [contactsResult, jobsResult, placementsResult, pipelineResult] = await Promise.all([
        supabase.from("crm_contacts").select("id", { count: "exact", head: true }),
        supabase.from("crm_jobs").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("crm_placements").select("id", { count: "exact", head: true }),
        supabase.from("crm_pipeline_items").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalContacts: contactsResult.count || 0,
        openJobs: jobsResult.count || 0,
        placements: placementsResult.count || 0,
        pipelineItems: pipelineResult.count || 0,
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
      label: "Contacts",
      value: stats?.totalContacts.toLocaleString() || "0",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Open Jobs",
      value: stats?.openJobs.toLocaleString() || "0",
      icon: Briefcase,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      label: "Placements",
      value: stats?.placements.toLocaleString() || "0",
      icon: Target,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      label: "Pipeline",
      value: stats?.pipelineItems.toLocaleString() || "0",
      icon: BarChart3,
      color: "text-primary",
      bgColor: "bg-primary/10",
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
