import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Globe, Clock, FileText, Edit } from "lucide-react";
import { format } from "date-fns";
import { Event } from "@/hooks/useEventRegistrations";

interface EventOverviewTabProps {
  event: Event;
  onEdit: () => void;
}

export function EventOverviewTab({ event, onEdit }: EventOverviewTabProps) {
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "Not set";
    return format(new Date(dateStr), "EEEE, MMMM d, yyyy 'at' h:mm a");
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "MMMM d, yyyy");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" onClick={onEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Event
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Start</p>
              <p className="font-medium">{formatDateTime(event.start_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End</p>
              <p className="font-medium">{formatDateTime(event.end_date)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {event.is_virtual ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {event.is_virtual ? (
              <>
                <p className="font-medium">Virtual Event</p>
                {event.virtual_url && (
                  <a 
                    href={event.virtual_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm break-all"
                  >
                    {event.virtual_url}
                  </a>
                )}
              </>
            ) : (
              <>
                {event.location && <p className="font-medium">{event.location}</p>}
                {event.address && <p className="text-sm text-muted-foreground">{event.address}</p>}
                {(event.city || event.state || event.zip) && (
                  <p className="text-sm text-muted-foreground">
                    {[event.city, event.state, event.zip].filter(Boolean).join(", ")}
                  </p>
                )}
                {!event.location && !event.address && !event.city && (
                  <p className="text-muted-foreground">No location set</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            {event.description ? (
              <p className="whitespace-pre-wrap">{event.description}</p>
            ) : (
              <p className="text-muted-foreground italic">No description provided</p>
            )}
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Event Type</p>
                <p className="font-medium capitalize">{event.event_type || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="font-medium">{event.capacity || "Unlimited"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(event.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
