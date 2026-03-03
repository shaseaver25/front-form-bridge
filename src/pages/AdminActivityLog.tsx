import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function AdminActivityLog() {
  const navigate = useNavigate();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["admin-activity-log-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_activity_log")
        .select(`
          id,
          action_type,
          created_at,
          details,
          admin_user_id,
          target_user_id,
          ip_address,
          user_profiles!admin_activity_log_admin_user_id_fkey(first_name, last_name)
        `)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/admin")} className="gap-2 mb-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Admin
      </Button>

      <h1 className="text-2xl font-bold">Activity Log</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Admin Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !activities?.length ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((activity: any) => {
                const adminName = activity.user_profiles
                  ? `${activity.user_profiles.first_name ?? ""} ${activity.user_profiles.last_name ?? ""}`.trim()
                  : "System";
                const details =
                  typeof activity.details === "object" && activity.details
                    ? activity.details
                    : {};

                return (
                  <div
                    key={activity.id}
                    className="flex items-start justify-between gap-4 border-b pb-3 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {activity.action_type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {adminName}
                      </p>
                      {details.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {details.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.created_at
                        ? format(new Date(activity.created_at), "MMM d, yyyy h:mm a")
                        : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
