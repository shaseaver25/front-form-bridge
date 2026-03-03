import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import type { VolunteerOpportunity } from '@/hooks/volunteers/useVolunteerOpportunities';

interface OpportunitiesListProps {
  opportunities: VolunteerOpportunity[];
  onSignUp: (eventId: string) => void;
}

export function OpportunitiesList({ opportunities, onSignUp }: OpportunitiesListProps) {
  if (opportunities.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No upcoming volunteer opportunities at this time. Check back soon!</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {opportunities.map((event) => {
        const isFull = !!(event.max_volunteers && event.volunteers_registered >= event.max_volunteers);
        const spotsLeft = event.max_volunteers ? event.max_volunteers - event.volunteers_registered : null;

        return (
          <Card key={event.id} className="overflow-hidden flex flex-col">
            {event.image_url && (
              <img src={event.image_url} alt={event.title} className="w-full h-40 object-cover" />
            )}
            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-lg leading-tight">{event.title}</h3>
                {isFull && <Badge variant="secondary">Full</Badge>}
              </div>

              {event.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.description}</p>
              )}

              <div className="space-y-2 text-sm text-muted-foreground mt-auto mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>
                    {format(new Date(event.start_date), 'EEE, MMM d, yyyy · h:mm a')}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>
                    {spotsLeft !== null
                      ? `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} remaining`
                      : `${event.volunteers_registered} volunteer${event.volunteers_registered === 1 ? '' : 's'} signed up`}
                  </span>
                </div>
              </div>

              {event.skills_needed && event.skills_needed.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {event.skills_needed.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                  ))}
                </div>
              )}

              <Button
                className="w-full"
                disabled={isFull || event.status !== 'open'}
                onClick={() => onSignUp(event.id)}
              >
                {isFull ? 'Event Full' : 'Sign Up to Volunteer'}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
