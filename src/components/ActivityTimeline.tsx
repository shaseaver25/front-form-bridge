import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, DollarSign, FileText, Settings, Plus, Loader2 } from "lucide-react";
import ActivityNoteForm from "./ActivityNoteForm";

interface ActivityTimelineProps {
  constituentId: string;
}

interface TimelineEvent {
  id: string;
  type: "gift" | "note" | "system_event" | "record_update" | "task";
  title: string;
  description?: string;
  amount?: number;
  date: string;
}

const ActivityTimeline = ({ constituentId }: ActivityTimelineProps) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteFormOpen, setNoteFormOpen] = useState(false);

  useEffect(() => {
    fetchTimeline();
  }, [constituentId]);

  const fetchTimeline = async () => {
    setLoading(true);

    // Fetch activities from crm_activities
    const { data: activities, error: activitiesError } = await supabase
      .from("crm_activities")
      .select("*")
      .eq("contact_id", constituentId)
      .order("created_at", { ascending: false });

    if (activitiesError) {
      toast.error("Failed to load activities");
      setLoading(false);
      return;
    }

    const allEvents: TimelineEvent[] = (activities || []).map((a) => ({
      id: a.id,
      type: (a.activity_type as TimelineEvent["type"]) || "note",
      title: a.subject || a.activity_type,
      description: a.body || undefined,
      date: a.created_at || new Date().toISOString(),
    }));

    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setEvents(allEvents);
    setLoading(false);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "gift":
        return <DollarSign className="w-4 h-4" />;
      case "note":
        return <FileText className="w-4 h-4" />;
      case "system_event":
        return <Settings className="w-4 h-4" />;
      case "record_update":
        return <Calendar className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getEventBadgeVariant = (type: string) => {
    switch (type) {
      case "gift":
        return "default";
      case "note":
        return "secondary";
      case "system_event":
        return "outline";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Activity Timeline
            </CardTitle>
            <Button size="sm" onClick={() => setNoteFormOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Note
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No activity recorded yet</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setNoteFormOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add First Note
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={event.id} className="relative">
                  {index !== events.length - 1 && (
                    <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border" />
                  )}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 space-y-1 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{event.title}</p>
                            <Badge variant={getEventBadgeVariant(event.type)} className="text-xs">
                              {event.type.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground capitalize">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(event.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ActivityNoteForm
        open={noteFormOpen}
        onOpenChange={setNoteFormOpen}
        constituentId={constituentId}
        onSuccess={fetchTimeline}
      />
    </>
  );
};

export default ActivityTimeline;
