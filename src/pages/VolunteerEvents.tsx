import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Calendar, Users, Link as LinkIcon, Pencil, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { CreateEventDialog } from '@/components/volunteers/CreateEventDialog';
import { EditEventDialog } from '@/components/volunteers/EditEventDialog';
import { EventRegistrationsList } from '@/components/volunteers/EventRegistrationsList';
import { useToast } from '@/hooks/use-toast';

export default function VolunteerEvents() {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const { toast } = useToast();

  const { data: events, isLoading } = useQuery({
    queryKey: ['volunteer-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('volunteer_events')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const copyPublicLink = (slug: string) => {
    const url = `${window.location.origin}/volunteer/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link Copied',
      description: 'Public sign-up link copied to clipboard'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'full': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard')}
        className="gap-2 mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Volunteer Events</h1>
          <p className="text-muted-foreground">Manage volunteer opportunities and registrations</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading events...</p>
      ) : (
        <div className="grid gap-4">
          {events?.map(event => (
            <Card 
              key={event.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedEvent(event.id)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingEvent(event);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (event.signup_form_slug) {
                        copyPublicLink(event.signup_form_slug);
                      }
                    }}
                    disabled={!event.signup_form_slug}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(event.start_date), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {event.volunteers_registered} / {event.max_volunteers || '∞'} volunteers
                </div>
              </div>

              {event.public_signup_enabled && event.signup_form_slug && (
                <div className="mt-3">
                  <a
                    href={`/volunteer/${event.signup_form_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Public Sign-Up Form →
                  </a>
                </div>
              )}
            </Card>
          ))}

          {events?.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No volunteer events yet. Create your first event to get started.</p>
            </Card>
          )}
        </div>
      )}

      {selectedEvent && (
        <EventRegistrationsList
          eventId={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <EditEventDialog
        event={editingEvent}
        open={!!editingEvent}
        onOpenChange={(open) => !open && setEditingEvent(null)}
      />
    </div>
  );
}
