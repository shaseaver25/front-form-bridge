import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { syncSiteContact } from '@/utils/siteContactSync';
import { syncSiteVolunteerEvent } from '@/utils/siteVolunteerSync';
import type { Site, SiteType, OrganizationType, RelationshipStatus, BudgetTier, TechReadiness, ConnectionSource } from '@/types/sites';

interface CreateSiteInput {
  name: string;
  description?: string;
  site_type?: string;
  organization_type?: string | null;
  district_name?: string | null;
  district_id?: string | null;
  enrollment?: number | null;
  grade_levels?: string[];
  website?: string | null;
  phone?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_zip?: string | null;
  relationship_status?: string;
  relationship_started_at?: string | null;
  connection_source?: string | null;
  connection_notes?: string | null;
  budget_tier?: string | null;
  decision_timeline?: string | null;
  tech_readiness?: string | null;
  notes?: string | null;
  tags?: string[];
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  volunteers_needed?: boolean;
  meeting_time?: string | null;
  meeting_days?: string[] | null;
  instructor_name?: string | null;
}

export function useSites() {
  const queryClient = useQueryClient();

  const sitesQuery = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as unknown as Site[];
    },
  });

  const createSite = useMutation({
    mutationFn: async (input: CreateSiteInput) => {
      const { data: user } = await supabase.auth.getUser();
      // Convert empty strings to null for date and optional fields
      const clean = (val: string | null | undefined): string | null =>
        val === '' || val === undefined ? null : val;
      const { data, error } = await supabase
        .from('sites')
        .insert({
          name: input.name,
          description: clean(input.description),
          site_type: input.site_type,
          organization_type: clean(input.organization_type),
          district_name: clean(input.district_name),
          district_id: clean(input.district_id),
          enrollment: input.enrollment,
          grade_levels: input.grade_levels,
          website: clean(input.website),
          phone: clean(input.phone),
          address_street: clean(input.address_street),
          address_city: clean(input.address_city),
          address_state: clean(input.address_state),
          address_zip: clean(input.address_zip),
          relationship_status: input.relationship_status,
          relationship_started_at: clean(input.relationship_started_at),
          connection_source: clean(input.connection_source),
          connection_notes: clean(input.connection_notes),
          budget_tier: clean(input.budget_tier),
          decision_timeline: clean(input.decision_timeline),
          tech_readiness: clean(input.tech_readiness),
          notes: clean(input.notes),
          tags: input.tags,
          is_active: input.is_active ?? true,
          start_date: clean(input.start_date),
          end_date: clean(input.end_date),
          contact_name: clean(input.contact_name),
          contact_email: clean(input.contact_email),
          contact_phone: clean(input.contact_phone),
          created_by: user.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Auto-create/link constituent from contact fields
      const site = data as unknown as Site;
      await syncSiteContact(site.id, input.contact_name || null, input.contact_email || null, input.contact_phone || null);

      // Auto-create/sync volunteer event if volunteers needed
      await syncSiteVolunteerEvent(site.id, {
        name: input.name,
        volunteers_needed: input.volunteers_needed ?? false,
        meeting_time: input.meeting_time || null,
        meeting_days: input.meeting_days || null,
        address_street: input.address_street || null,
        address_city: input.address_city || null,
        address_state: input.address_state || null,
        instructor_name: input.instructor_name || null,
      });

      return site;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create site: ' + error.message);
    },
  });

  const updateSite = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CreateSiteInput> & { id: string }) => {
      const updateData = { ...updates };
      
      const { data, error } = await supabase
        .from('sites')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as Site;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update site: ' + error.message);
    },
  });

  const deleteSite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sites')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Site deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete site: ' + error.message);
    },
  });

  return {
    sites: sitesQuery.data ?? [],
    isLoading: sitesQuery.isLoading,
    error: sitesQuery.error,
    createSite,
    updateSite,
    deleteSite,
  };
}
