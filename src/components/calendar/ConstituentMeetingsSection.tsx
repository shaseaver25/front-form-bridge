import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MapPin, Video, Users, ExternalLink } from "lucide-react";
import { useConstituentMeetings } from "@/hooks/useCalendarSync";
import { format, isPast } from "date-fns";
import { Link } from "react-router-dom";

interface ConstituentMeetingsSectionProps {
  constituentId: string;
}

export function ConstituentMeetingsSection({ constituentId }: ConstituentMeetingsSectionProps) {
  const { data: meetings, isLoading } = useConstituentMeetings(constituentId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!meetings || meetings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Meetings
          </CardTitle>
          <CardDescription>Past and upcoming meetings with this contact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No meetings found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const upcomingMeetings = meetings.filter((m) => !isPast(new Date(m.start_time)));
  const pastMeetings = meetings.filter((m) => isPast(new Date(m.start_time)));

  const MeetingItem = ({ meeting }: { meeting: any }) => {
    const startTime = new Date(meeting.start_time);
    const attendeesRaw = meeting.attendees as Array<{ name: string }> | null;
    const attendees = attendeesRaw || [];

    return (
      <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50">
        <div className="text-center min-w-[50px]">
          <p className="text-xs text-muted-foreground">{format(startTime, "MMM")}</p>
          <p className="text-lg font-bold">{format(startTime, "d")}</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{meeting.subject}</p>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span>{format(startTime, "h:mm a")}</span>
            {meeting.is_online_meeting ? (
              <Badge variant="secondary" className="text-xs">
                <Video className="h-3 w-3 mr-1" />
                Virtual
              </Badge>
            ) : meeting.location ? (
              <span className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {meeting.location}
              </span>
            ) : null}
          </div>
          {attendees.length > 1 && (
            <div className="flex items-center gap-1 mt-2">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                +{attendees.length - 1} other{attendees.length > 2 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Meetings
        </CardTitle>
        <CardDescription>Past and upcoming meetings with this contact</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={upcomingMeetings.length > 0 ? "upcoming" : "past"}>
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingMeetings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastMeetings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-1">
            {upcomingMeetings.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No upcoming meetings</p>
            ) : (
              upcomingMeetings.slice(0, 5).map((meeting) => (
                <MeetingItem key={meeting.id} meeting={meeting} />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-1">
            {pastMeetings.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No past meetings</p>
            ) : (
              pastMeetings.slice(0, 5).map((meeting) => (
                <MeetingItem key={meeting.id} meeting={meeting} />
              ))
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/calendar">View All Meetings</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
