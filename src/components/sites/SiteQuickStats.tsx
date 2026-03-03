import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Handshake, TrendingUp } from "lucide-react";

export function SiteQuickStats() {
  const { data: stats } = useQuery({
    queryKey: ["company-stats"],
    queryFn: async () => {
      const { data: companies, error } = await supabase
        .from("crm_companies")
        .select("status, company_type");
      
      if (error) throw error;

      const total = companies?.length ?? 0;
      const prospects = companies?.filter(c => c.company_type === "prospect" || c.status === "prospect").length ?? 0;
      const active = companies?.filter(c => c.status === "active").length ?? 0;
      const clients = companies?.filter(c => c.company_type === "client").length ?? 0;

      return { total, prospects, active, clients };
    },
  });

  const statCards = [
    { label: "Total Companies", value: stats?.total ?? 0, icon: Building2, color: "text-blue-600" },
    { label: "Prospects", value: stats?.prospects ?? 0, icon: TrendingUp, color: "text-yellow-600" },
    { label: "Active", value: stats?.active ?? 0, icon: Users, color: "text-purple-600" },
    { label: "Clients", value: stats?.clients ?? 0, icon: Handshake, color: "text-green-600" },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
