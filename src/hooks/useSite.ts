import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Site, SiteWithStats } from '@/types/sites';

export function useSite(siteId: string | undefined) {
  return useQuery({
    queryKey: ['site', siteId],
    queryFn: async () => {
      if (!siteId) throw new Error('Site ID is required');

      const { data: site, error: siteError } = await supabase
        .from('sites')
        .select('*')
        .eq('id', siteId)
        .single();
      
      if (siteError) throw siteError;

      // Get counts
      const [programsResult, storiesResult, mediaResult] = await Promise.all([
        supabase.from('site_programs').select('id', { count: 'exact' }).eq('site_id', siteId),
        supabase.from('site_stories').select('id', { count: 'exact' }).eq('site_id', siteId),
        supabase.from('site_media').select('id', { count: 'exact' }).eq('site_id', siteId),
      ]);

      return {
        ...site,
        program_count: programsResult.count ?? 0,
        story_count: storiesResult.count ?? 0,
        media_count: mediaResult.count ?? 0,
      } as SiteWithStats;
    },
    enabled: !!siteId,
  });
}
