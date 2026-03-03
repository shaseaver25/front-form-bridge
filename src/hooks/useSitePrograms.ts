import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SiteProgram } from '@/types/sites';

interface LinkProgramInput {
  site_id: string;
  program_id: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
}

export function useSitePrograms(siteId: string | undefined) {
  const queryClient = useQueryClient();

  const programsQuery = useQuery({
    queryKey: ['site-programs', siteId],
    queryFn: async () => {
      if (!siteId) return [];
      
      const { data, error } = await supabase
        .from('site_programs')
        .select(`
          *,
          program:programs(id, name, description)
        `)
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SiteProgram[];
    },
    enabled: !!siteId,
  });

  const linkProgram = useMutation({
    mutationFn: async (input: LinkProgramInput) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('site_programs')
        .insert({
          ...input,
          created_by: user.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-programs', siteId] });
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      toast.success('Program linked to site');
    },
    onError: (error) => {
      toast.error('Failed to link program: ' + error.message);
    },
  });

  const unlinkProgram = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('site_programs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-programs', siteId] });
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      toast.success('Program unlinked from site');
    },
    onError: (error) => {
      toast.error('Failed to unlink program: ' + error.message);
    },
  });

  return {
    programs: programsQuery.data ?? [],
    isLoading: programsQuery.isLoading,
    error: programsQuery.error,
    linkProgram,
    unlinkProgram,
  };
}
