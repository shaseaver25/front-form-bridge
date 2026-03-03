import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, DollarSign, FileText, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "gift" | "grant" | "constituent";
  title: string;
  description: string;
  timestamp: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      const [giftsResult, grantsResult, constituentsResult] = await Promise.all([
        supabase
          .from("gifts")
          .select("id, amount, date_received, constituents(full_legal_name)")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("grant_opportunities")
          .select("id, title, status_stage, updated_at")
          .order("updated_at", { ascending: false })
          .limit(3),
        supabase
          .from("constituents")
          .select("id, full_legal_name, created_at")
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      const activityList: ActivityItem[] = [];

      (giftsResult.data ?? []).forEach((g: { id: string; amount: number; date_received: string; constituents: { full_legal_name: string } | null }) => {
        activityList.push({
          id: `gift-${g.id}`,
          type: "gift",
          title: `$${g.amount?.toLocaleString()} donation`,
          description: `From ${g.constituents?.full_legal_name || "Unknown"}`,
          timestamp: g.date_received || "",
        });
      });

      (grantsResult.data ?? []).forEach((g: { id: string; title: string; status_stage: string; updated_at: string }) => {
        activityList.push({
          id: `grant-${g.id}`,
          type: "grant",
          title: g.title,
          description: `Status: ${g.status_stage}`,
          timestamp: g.updated_at || "",
        });
      });

      (constituentsResult.data ?? []).forEach((c: { id: string; full_legal_name: string; created_at: string }) => {
        activityList.push({
          id: `constituent-${c.id}`,
          type: "constituent",
          title: c.full_legal_name,
          description: "New constituent added",
          timestamp: c.created_at,
        });
      });

      // Sort by timestamp and take top 5
      activityList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(activityList.slice(0, 5));
      setLoading(false);
    };

    fetchActivity();
  }, []);

  const getIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "gift":
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case "grant":
        return <FileText className="w-4 h-4 text-purple-500" />;
      case "constituent":
        return <User className="w-4 h-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-muted">
                  {getIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.timestamp && formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
