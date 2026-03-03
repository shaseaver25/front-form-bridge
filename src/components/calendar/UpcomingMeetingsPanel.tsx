import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, Video, Users, CheckCircle2, Clock3, Minus, ExternalLink, Plus, RefreshCw, Link2 } from "lucide-react";
import { useCalendarEvents, useSyncCalendar, useCreatePrepTask, CalendarEvent } from "@/hooks/useCalendarSync";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { invokeMicrosoftUserOAuthStart } from '@/lib/supabaseClientHelpers';

interface MeetingCardProps {
  event: CalendarEvent;
  onCreateTask: (eventId: string) => void;
  isCreatingTask: boolean;
}

function MeetingCard({ event, onCreateTask, isCreatingTask }: MeetingCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const startTime = new Date(event.start_time);
  const attendees = event.attendees || [];

  const getDateLabel = () => {
    if (isToday(startTime)) return "Today";
    if (isTomorrow(startTime)) return "Tomorrow";
    return format(startTime, "EEE, MMM d");
  };

  const getPrepStatus = () => {
    if (event.prep_task_created && event.prep_task_id) {
      return { icon: CheckCircle2, label: "Prep task created", color: "text-green-600" };
    }
    // Check if within lead time (24 hours by default)
    const hoursUntil = (startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil <= 24) {
      return { icon: Clock3, label: "Prep task pending", color: "text-amber-600" };
    }
    return { icon: Minus, label: "No prep task", color: "text-muted-foreground" };
  };

  const status = getPrepStatus();
  const StatusIcon = status.icon;

  return (
    <>
      <div
        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={() => setShowDetails(true)}
      >
        <div className="flex flex-col items-center min-w-[60px]">
          <span className="text-xs text-muted-foreground">{getDateLabel()}</span>
          <span className="text-sm font-medium">{format(startTime, "h:mm a")}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{event.subject}</p>
          <div className="flex items-center gap-2 mt-1">
            {event.is_online_meeting ? (
              <Badge variant="secondary" className="text-xs">
                <Video className="h-3 w-3 mr-1" />
                Virtual
              </Badge>
            ) : event.location ? (
              <span className="text-xs text-muted-foreground flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {event.location}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {attendees.slice(0, 3).map((attendee, i) => (
              <Avatar key={i} className="h-6 w-6 border-2 border-background">
                <AvatarFallback className="text-xs">
                  {attendee.name?.split(" ").map((n) => n[0]).join("").substring(0, 2) || "?"}
                </AvatarFallback>
              </Avatar>
            ))}
            {attendees.length > 3 && (
              <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-xs">+{attendees.length - 3}</span>
              </div>
            )}
          </div>

          <div className={`flex items-center gap-1 text-xs ${status.color}`}>
            <StatusIcon className="h-3 w-3" />
          </div>
        </div>
      </div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{event.subject}</DialogTitle>
            <DialogDescription>
              {format(startTime, "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(startTime, "h:mm a")} - {format(new Date(event.end_time), "h:mm a")}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            {event.is_online_meeting && event.online_meeting_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={event.online_meeting_url} target="_blank" rel="noopener noreferrer">
                  <Video className="h-4 w-4 mr-2" />
                  Join Meeting
                  <ExternalLink className="h-3 w-3 ml-2" />
                </a>
              </Button>
            )}

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Attendees ({attendees.length})
              </h4>
              <ScrollArea className="h-[120px]">
                <div className="space-y-2">
                  {attendees.map((attendee, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {attendee.name?.split(" ").map((n) => n[0]).join("").substring(0, 2) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{attendee.name || attendee.email}</span>
                      {attendee.response_status !== "none" && (
                        <Badge variant="outline" className="text-xs">
                          {attendee.response_status}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {event.body_preview && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{event.body_preview}</p>
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 text-sm ${status.color}`}>
                <StatusIcon className="h-4 w-4" />
                <span>{status.label}</span>
              </div>
              {event.prep_task_created && event.prep_task_id ? (
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/tasks`}>View Task</Link>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    onCreateTask(event.id);
                    setShowDetails(false);
                  }}
                  disabled={isCreatingTask}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Prep Task
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface UpcomingMeetingsPanelProps {
  limit?: number;
  showViewAll?: boolean;
}

export function UpcomingMeetingsPanel({ limit = 5, showViewAll = true }: UpcomingMeetingsPanelProps) {
  const { data: events, isLoading } = useCalendarEvents(limit);
  const syncCalendar = useSyncCalendar();
  const createPrepTask = useCreatePrepTask();

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

  const isConnected = !!microsoftConnection;

  async function onConnectMicrosoftClick() {
  try {
    const data = await invokeMicrosoftUserOAuthStart(supabase, {}) as { url?: string } | null;
    if (data?.url) {
      window.location.href = data.url;
    } else {
      console.warn('Microsoft OAuth started:', data);
    }
  } catch (err: any) {
    if (err?.message === 'auth_required' || err?.code === 'AUTH_REQUIRED') {
      console.warn('Sign-in required to connect Microsoft account.');
      return;
    }
    console.error('Error invoking microsoft-user-oauth-start:', err);
  }
}
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Meetings
          </CardTitle>
          <CardDescription>Your next calendar events</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => syncCalendar.mutate()}
              disabled={syncCalendar.isPending}
            >
              <RefreshCw className={`h-4 w-4 ${syncCalendar.isPending ? "animate-spin" : ""}`} />
            </Button>
          )}
          {showViewAll && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/calendar">View All</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="mb-2">Connect your Microsoft 365 calendar</p>
            <Button onClick={onConnectMicrosoftClick}>
              <Link2 className="h-4 w-4 mr-2" />
              Connect Calendar
            </Button>
          </div>
        ) : !events || events.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No upcoming meetings</p>
            <Button variant="link" size="sm" onClick={() => syncCalendar.mutate()}>
              Sync your calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {events.map((event) => (
              <MeetingCard
                key={event.id}
                event={event}
                onCreateTask={(id) => createPrepTask.mutate(id)}
                isCreatingTask={createPrepTask.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
