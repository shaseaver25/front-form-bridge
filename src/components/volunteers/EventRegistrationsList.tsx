import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, User, Mail, Phone, Eye } from 'lucide-react';
import { VolunteerFormDetailDialog } from './VolunteerFormDetailDialog';

interface EventRegistrationsListProps {
  eventId: string;
  onClose: () => void;
}

export function EventRegistrationsList({ eventId, onClose }: EventRegistrationsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);

  const { data: event } = useQuery({
    queryKey: ['volunteer-event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('volunteer_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['volunteer-registrations', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('volunteer_event_registrations')
        .select(`
          *,
          constituent:constituents(
            id,
            first_name,
            last_name,
            primary_email,
            phone
          )
        `)
        .eq('event_id', eventId)
        .order('registration_date', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ registrationId, status }: { registrationId: string; status: string }) => {
      const { error } = await supabase
        .from('volunteer_event_registrations')
        .update({ 
          status,
          attendance_confirmed: status === 'attended'
        })
        .eq('id', registrationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-registrations', eventId] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-events'] });
      toast({
        title: 'Status Updated',
        description: 'Registration status has been updated.'
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Registered</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-800 gap-1"><CheckCircle className="h-3 w-3" /> Confirmed</Badge>;
      case 'attended':
        return <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle className="h-3 w-3" /> Attended</Badge>;
      case 'no_show':
        return <Badge className="bg-red-100 text-red-800 gap-1"><XCircle className="h-3 w-3" /> No Show</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 gap-1"><XCircle className="h-3 w-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Sheet open={!!eventId} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{event?.title || 'Event Registrations'}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {event && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {format(new Date(event.start_date), 'EEEE, MMMM d, yyyy')} at {format(new Date(event.start_date), 'h:mm a')}
              </p>
              <p className="text-sm font-medium mt-1">
                {event.volunteers_registered} / {event.max_volunteers || '∞'} volunteers registered
              </p>
            </div>
          )}

          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading registrations...</p>
          ) : registrations?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No registrations yet.</p>
          ) : (
            <div className="space-y-3">
              {registrations?.map((registration) => (
                <div 
                  key={registration.id} 
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {registration.constituent?.first_name} {registration.constituent?.last_name}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {registration.constituent?.primary_email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {registration.constituent.primary_email}
                            </span>
                          )}
                          {registration.constituent?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {registration.constituent.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(registration.status)}
                  </div>

                  {registration.skills_offered?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {registration.skills_offered.map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Custom responses from event form */}
                  {registration.custom_responses && typeof registration.custom_responses === 'object' && Object.keys(registration.custom_responses).length > 0 && (
                    <div className="bg-muted/50 rounded-md p-3 space-y-2">
                      {Object.entries(registration.custom_responses as Record<string, unknown>).map(([key, value]) => {
                        // Try to find the label from event's custom_fields
                        const customFields = Array.isArray(event?.custom_fields) ? event.custom_fields : [];
                        const customField = customFields.find((f) => {
                          const field = f as { id?: string; label?: string };
                          return field.id === key;
                        }) as { id?: string; label?: string } | undefined;
                        const label = customField?.label || key;
                        return (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-muted-foreground">{label}: </span>
                            <span>{String(value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Availability notes */}
                  {registration.availability_notes && (
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">Availability: </span>
                      <span>{registration.availability_notes}</span>
                    </div>
                  )}

                  {/* Referral source */}
                  {registration.referral_source && (
                    <div className="text-sm">
                      <span className="font-medium text-muted-foreground">How they heard about this: </span>
                      <span>{registration.referral_source}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRegistration(registration)}
                      className="gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View Form
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus.mutate({ registrationId: registration.id, status: 'confirmed' })}
                      disabled={registration.status === 'confirmed'}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600"
                      onClick={() => updateStatus.mutate({ registrationId: registration.id, status: 'attended' })}
                      disabled={registration.status === 'attended'}
                    >
                      Mark Attended
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => updateStatus.mutate({ registrationId: registration.id, status: 'no_show' })}
                      disabled={registration.status === 'no_show'}
                    >
                      No Show
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Registered {format(new Date(registration.registration_date), 'MMM d, yyyy h:mm a')}
                    {registration.waiver_signed && ' • Waiver signed'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <VolunteerFormDetailDialog
          open={!!selectedRegistration}
          onOpenChange={(open) => !open && setSelectedRegistration(null)}
          registration={selectedRegistration}
          event={event}
        />
      </SheetContent>
    </Sheet>
  );
}
