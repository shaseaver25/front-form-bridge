import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VolunteerOpportunity {
  id: string;
  title: string;
  description: string | null;
  event_type: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  location_type: string | null;
  virtual_link: string | null;
  max_volunteers: number | null;
  volunteers_registered: number;
  status: string;
  skills_needed: string[] | null;
  image_url: string | null;
  is_active: boolean;
  public_signup_enabled: boolean;
  signup_form_slug: string | null;
  created_at: string;
}

interface UseVolunteerOpportunitiesOptions {
  /** Only show active & open events with future dates */
  publicOnly?: boolean;
  /** Filter by date range */
  startAfter?: Date;
  startBefore?: Date;
}

export function useVolunteerOpportunities(options: UseVolunteerOpportunitiesOptions = {}) {
  const { publicOnly = false, startAfter, startBefore } = options;

  return useQuery({
    queryKey: ['volunteer-opportunities', { publicOnly, startAfter: startAfter?.toISOString(), startBefore: startBefore?.toISOString() }],
    queryFn: async () => {
      let query = supabase
        .from('volunteer_events')
        .select('*')
        .order('start_date', { ascending: true });

      if (publicOnly) {
        query = query
          .eq('is_active', true)
          .eq('public_signup_enabled', true)
          .in('status', ['open', 'full'])
          .gte('start_date', new Date().toISOString());
      }

      if (startAfter) {
        query = query.gte('start_date', startAfter.toISOString());
      }
      if (startBefore) {
        query = query.lte('start_date', startBefore.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VolunteerOpportunity[];
    },
  });
}
