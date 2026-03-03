import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VolunteerSignup {
  id: string;
  event_id: string;
  constituent_id: string | null;
  registration_date: string;
  status: string;
  attendance_confirmed: boolean;
  skills_offered: string[] | null;
  availability_notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  dietary_restrictions: string | null;
  shirt_size: string | null;
  waiver_signed: boolean;
  referral_source: string | null;
  company: string | null;
  job_title: string | null;
  thank_you_sent_at: string | null;
  reminder_sent_at: string | null;
  constituent?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    primary_email: string | null;
    phone: string | null;
  } | null;
}

export function useVolunteerSignups(eventId: string | undefined) {
  return useQuery({
    queryKey: ['volunteer-signups', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('volunteer_event_registrations')
        .select(`
          *,
          constituent:constituents(id, first_name, last_name, primary_email, phone)
        `)
        .eq('event_id', eventId)
        .order('registration_date', { ascending: false });

      if (error) throw error;
      return data as VolunteerSignup[];
    },
    enabled: !!eventId,
  });
}

export function useUpdateSignupStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ registrationId, status }: { registrationId: string; status: string }) => {
      const { error } = await supabase
        .from('volunteer_event_registrations')
        .update({
          status,
          attendance_confirmed: status === 'attended',
        })
        .eq('id', registrationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-signups'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-events'] });
    },
  });
}
