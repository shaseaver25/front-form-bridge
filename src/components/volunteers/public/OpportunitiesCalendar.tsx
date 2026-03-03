import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import type { VolunteerOpportunity } from '@/hooks/volunteers/useVolunteerOpportunities';

interface OpportunitiesCalendarProps {
  opportunities: VolunteerOpportunity[];
  onSignUp: (eventId: string) => void;
}

export function OpportunitiesCalendar({ opportunities, onSignUp }: OpportunitiesCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getEventsForDate = (date: Date) =>
    opportunities.filter((e) => isSameDay(new Date(e.start_date), date));

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold text-lg">{format(currentMonth, 'MMMM yyyy')}</h3>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {days.map((d, i) => {
          const eventsOnDay = getEventsForDate(d);
          const inMonth = isSameMonth(d, currentMonth);
          const selected = selectedDate && isSameDay(d, selectedDate);

          return (
            <button
              key={i}
              onClick={() => eventsOnDay.length > 0 && setSelectedDate(d)}
              className={[
                'relative min-h-[72px] p-1.5 text-left bg-card transition-colors',
                !inMonth && 'opacity-40',
                isToday(d) && 'ring-1 ring-primary ring-inset',
                selected && 'bg-primary/10',
                eventsOnDay.length > 0 && 'cursor-pointer hover:bg-accent',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="text-xs font-medium">{format(d, 'd')}</span>
              {eventsOnDay.length > 0 && (
                <div className="mt-0.5 space-y-0.5">
                  {eventsOnDay.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="text-[10px] leading-tight px-1 py-0.5 rounded bg-primary/15 text-primary truncate"
                    >
                      {ev.title}
                    </div>
                  ))}
                  {eventsOnDay.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{eventsOnDay.length - 2} more
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date detail */}
      {selectedDate && (
        <div className="space-y-3">
          <h4 className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h4>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events on this date.</p>
          ) : (
            selectedEvents.map((event) => {
              const isFull = !!(event.max_volunteers && event.volunteers_registered >= event.max_volunteers);
              return (
                <Card key={event.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h5 className="font-semibold">{event.title}</h5>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(event.start_date), 'h:mm a')}
                        {event.end_date && ` – ${format(new Date(event.end_date), 'h:mm a')}`}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {event.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.volunteers_registered}/{event.max_volunteers ?? '∞'}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={isFull || event.status !== 'open'}
                      onClick={() => onSignUp(event.id)}
                    >
                      {isFull ? 'Full' : 'Sign Up'}
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
