import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Phone, Calendar, MessageSquare, FileText, Users } from "lucide-react";
import { AddActivityDialog } from "./AddActivityDialog";
import { format } from "date-fns";

const activityTypeIcons: Record<string, React.ReactNode> = {
  email_sent: <Mail className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  proposal_sent: <FileText className="h-4 w-4" />,
  site_visit: <Calendar className="h-4 w-4" />,
  note: <MessageSquare className="h-4 w-4" />,
};

const activityTypeLabels: Record<string, string> = {
  email_sent: "Email",
  call: "Call",
  meeting: "Meeting",
  proposal_sent: "Proposal",
  site_visit: "Site Visit",
  note: "Note",
  event: "Event",
};

const outcomeColors: Record<string, string> = {
  positive: "bg-green-100 text-green-800",
  neutral: "bg-gray-100 text-gray-800",
  negative: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

interface SiteActivitiesSectionProps {
  siteId: string;
}

export function SiteActivitiesSection({ siteId }: SiteActivitiesSectionProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: activities, isLoading } = useQuery({
    queryKey: ["site-activities", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_activities")
        .select(`
          *,
          constituent:constituents(id, first_name, last_name)
        `)
        .eq("site_id", siteId)
        .order("activity_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading activities...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Activity Timeline ({activities?.length || 0})</h3>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Log Activity
        </Button>
      </div>

      {activities && activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card key={activity.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    {activityTypeIcons[activity.activity_type] || <MessageSquare className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {activityTypeLabels[activity.activity_type] || activity.activity_type}
                        </span>
                        {activity.outcome && (
                          <Badge className={outcomeColors[activity.outcome]}>
                            {activity.outcome}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(activity.activity_date), "MMM d, yyyy")}
                      </span>
                    </div>
                    {activity.subject && (
                      <p className="text-sm font-medium">{activity.subject}</p>
                    )}
                    {activity.description && (
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    )}
                    {activity.constituent && (
                      <p className="text-xs text-muted-foreground">
                        With: {activity.constituent.first_name} {activity.constituent.last_name}
                      </p>
                    )}
                    {activity.follow_up_date && (
                      <p className="text-xs text-primary">
                        Follow-up: {format(new Date(activity.follow_up_date), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No activities logged yet. Start tracking your interactions!
          </CardContent>
        </Card>
      )}

      <AddActivityDialog
        siteId={siteId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
