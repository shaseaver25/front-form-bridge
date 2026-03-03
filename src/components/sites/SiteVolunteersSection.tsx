import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Users, Plus, Clock } from "lucide-react";
import { format } from "date-fns";
import { CreateSiteVolunteerDialog } from "./CreateSiteVolunteerDialog";

interface SiteVolunteersSectionProps {
  siteId: string;
  siteName: string;
}

export function SiteVolunteersSection({ siteId, siteName }: SiteVolunteersSectionProps) {
  const [showCreate, setShowCreate] = useState(false);

  const { data: events, isLoading } = useQuery({
    queryKey: ["site-volunteer-events", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteer_events")
        .select("*")
        .eq("site_id", siteId)
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  const upcoming = events?.filter((e) => new Date(e.start_date) >= new Date()) ?? [];
  const past = events?.filter((e) => new Date(e.start_date) < new Date()) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Volunteer Opportunities</h3>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Opportunity
        </Button>
      </div>

      {upcoming.length === 0 && past.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium">No volunteer opportunities yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create one to start recruiting volunteers for {siteName}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Opportunity
            </Button>
          </CardContent>
        </Card>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Upcoming ({upcoming.length})</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Past ({past.length})</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {past.map((event) => (
              <EventCard key={event.id} event={event} isPast />
            ))}
          </div>
        </div>
      )}

      <CreateSiteVolunteerDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        siteId={siteId}
        siteName={siteName}
      />
    </div>
  );
}

interface EventCardProps {
  event: {
    id: string;
    title: string;
    start_date: string;
    end_date: string | null;
    location: string | null;
    max_volunteers: number | null;
    volunteers_registered: number | null;
    status: string | null;
    recurrence_rule: string | null;
  };
  isPast?: boolean;
}

function EventCard({ event, isPast }: EventCardProps) {
  const filled = event.volunteers_registered ?? 0;
  const max = event.max_volunteers;
  const isFull = max !== null && filled >= max;

  return (
    <Card className={isPast ? "opacity-60" : undefined}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h5 className="font-medium text-sm line-clamp-1">{event.title}</h5>
          <div className="flex gap-1">
            {event.recurrence_rule && (
              <Badge variant="outline" className="text-xs shrink-0">
                {event.recurrence_rule}
              </Badge>
            )}
            <Badge
              variant={isFull ? "destructive" : "secondary"}
              className="text-xs shrink-0"
            >
              {filled}/{max ?? "∞"}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(event.start_date), "MMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(event.start_date), "h:mm a")}
            {event.end_date && ` – ${format(new Date(event.end_date), "h:mm a")}`}
          </span>
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.location}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
