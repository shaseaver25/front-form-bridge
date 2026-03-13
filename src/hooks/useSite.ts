import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSite(siteId: string | undefined) {
  return useQuery({
    queryKey: ['company', siteId],
    queryFn: async () => {
      if (!siteId) throw new Error('Site ID is required');

      const { data, error } = await supabase
        .from('crm_companies')
        .select('*')
        .eq('id', siteId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!siteId,
  });
}
