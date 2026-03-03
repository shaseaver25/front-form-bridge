import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, MapPin, Users, ArrowRight } from "lucide-react";
import { useEvents } from "@/hooks/useEventRegistrations";
import { Link } from "react-router-dom";
import { format, isAfter } from "date-fns";

export function UpcomingEventsWidget() {
  const { data: events = [], isLoading } = useEvents("published");

  // Filter to upcoming events and take first 5
  const upcomingEvents = events
    .filter((e) => e.start_date && isAfter(new Date(e.start_date), new Date()))
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Upcoming Events
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/events" className="gap-1 text-xs">
              View All
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming events</p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link to="/events">Create Event</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="flex gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center w-12 h-12 rounded bg-primary/10 text-primary text-center">
                  <span className="text-xs font-medium uppercase">
                    {event.start_date ? format(new Date(event.start_date), "MMM") : "TBD"}
                  </span>
                  <span className="text-lg font-bold leading-none">
                    {event.start_date ? format(new Date(event.start_date), "d") : "-"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{event.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {event.location && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {event.location}
                      </span>
                    )}
                    {event.capacity && (
                      <Badge variant="outline" className="text-[10px] px-1.5">
                        <Users className="h-2.5 w-2.5 mr-1" />
                        {event.capacity}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
