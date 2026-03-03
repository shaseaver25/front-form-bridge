import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2 } from "lucide-react";
import { useCalendarEvents, useCalendarSettings } from "@/hooks/useCalendarSync";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format, isToday, isTomorrow } from "date-fns";

export function MeetingsThisWeekWidget() {
  const { data: events, isLoading } = useCalendarEvents(20);
  const { data: settings } = useCalendarSettings();

  const { data: microsoftConnection } = useQuery({
    queryKey: ["microsoft-connection"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("user_microsoft_connections")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      return data;
    },
  });

  if (!microsoftConnection) {
    return null; // Don't show widget if calendar not connected
  }

  const upcomingCount = events?.length || 0;
  const prepTasksComplete = events?.filter((e) => e.prep_task_created).length || 0;
  const nextMeeting = events?.[0];

  const getNextMeetingLabel = () => {
    if (!nextMeeting) return null;
    const startTime = new Date(nextMeeting.start_time);
    
    if (isToday(startTime)) {
      return `Today at ${format(startTime, "h:mm a")}`;
    }
    if (isTomorrow(startTime)) {
      return `Tomorrow at ${format(startTime, "h:mm a")}`;
    }
    return format(startTime, "EEE 'at' h:mm a");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="h-20 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Meetings This Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{upcomingCount}</span>
          <span className="text-sm text-muted-foreground">meetings</span>
        </div>
        
        {nextMeeting && (
          <div className="text-sm">
            <p className="text-muted-foreground">Next meeting:</p>
            <p className="font-medium truncate">{nextMeeting.subject}</p>
            <p className="text-xs text-muted-foreground">{getNextMeetingLabel()}</p>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>{prepTasksComplete} of {upcomingCount} prep tasks complete</span>
        </div>

        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/calendar">View Calendar</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
