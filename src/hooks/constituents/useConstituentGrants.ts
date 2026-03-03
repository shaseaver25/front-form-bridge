import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Type for linked grants with joined data
export interface LinkedGrantData {
  id: string;
  constituent_id: string;
  grant_opportunity_id: string;
  role: string | null;
  notes: string | null;
  created_at: string | null;
  created_by: string | null;
  updated_at: string | null;
  grant_opportunities: {
    id: string;
    title: string;
    status_stage: string | null;
    submission_deadline: string | null;
    requested_amount: number | null;
    awarded_amount: number | null;
    organizations: { name: string } | null;
  };
}

export function useConstituentGrants(constituentId: string | null) {
  return useQuery({
    queryKey: ['constituent-grants', constituentId],
    queryFn: async () => {
      if (!constituentId) return [];
      
      const { data, error } = await supabase
        .from('constituent_grants')
        .select(`
          *,
          grant_opportunities (
            id,
            title,
            status_stage,
            submission_deadline,
            requested_amount,
            awarded_amount,
            organizations (name)
          )
        `)
        .eq('constituent_id', constituentId);

      if (error) {
        toast.error('Failed to load linked grants');
        throw error;
      }
      return (data as unknown as LinkedGrantData[]) || [];
    },
    enabled: !!constituentId,
  });
}

export function useUnlinkGrant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, constituentId }: { linkId: string; constituentId: string }) => {
      const { error } = await supabase.from('constituent_grants').delete().eq('id', linkId);
      if (error) throw error;
      return { linkId, constituentId };
    },
    onSuccess: (_, variables) => {
      toast.success('Grant unlinked successfully');
      queryClient.invalidateQueries({ queryKey: ['constituent-grants', variables.constituentId] });
    },
    onError: () => {
      toast.error('Failed to unlink grant');
    },
  });
}
