import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, Handshake, TrendingUp } from "lucide-react";

export function SiteQuickStats() {
  const { data: stats } = useQuery({
    queryKey: ["site-stats"],
    queryFn: async () => {
      const { data: sites, error } = await supabase
        .from("sites")
        .select("relationship_status, site_type");
      
      if (error) throw error;

      const total = sites?.length ?? 0;
      const prospects = sites?.filter(s => s.relationship_status === "prospect").length ?? 0;
      const activePartners = sites?.filter(s => s.relationship_status === "active_partner").length ?? 0;
      const inConversation = sites?.filter(s => 
        s.relationship_status === "contacted" || 
        s.relationship_status === "in_conversation" ||
        s.relationship_status === "pilot"
      ).length ?? 0;

      return { total, prospects, activePartners, inConversation };
    },
  });

  const statCards = [
    { label: "Total Sites", value: stats?.total ?? 0, icon: Building2, color: "text-blue-600" },
    { label: "Prospects", value: stats?.prospects ?? 0, icon: TrendingUp, color: "text-yellow-600" },
    { label: "In Pipeline", value: stats?.inConversation ?? 0, icon: Users, color: "text-purple-600" },
    { label: "Active Partners", value: stats?.activePartners ?? 0, icon: Handshake, color: "text-green-600" },
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
