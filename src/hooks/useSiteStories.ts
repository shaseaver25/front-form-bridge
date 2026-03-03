import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SiteStory } from '@/types/sites';

interface CreateStoryInput {
  site_id: string;
  title: string;
  story_content: string;
  person_name?: string;
  person_role?: string;
  is_published?: boolean;
  tags?: string[];
}

export function useSiteStories(siteId: string | undefined) {
  const queryClient = useQueryClient();

  const storiesQuery = useQuery({
    queryKey: ['site-stories', siteId],
    queryFn: async () => {
      if (!siteId) return [];
      
      const { data, error } = await supabase
        .from('site_stories')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SiteStory[];
    },
    enabled: !!siteId,
  });

  const createStory = useMutation({
    mutationFn: async (input: CreateStoryInput) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('site_stories')
        .insert({
          ...input,
          created_by: user.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as SiteStory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-stories', siteId] });
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      toast.success('Story added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add story: ' + error.message);
    },
  });

  const updateStory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SiteStory> & { id: string }) => {
      const { data, error } = await supabase
        .from('site_stories')
        .update({
          ...updates,
          published_date: updates.is_published ? new Date().toISOString().split('T')[0] : null,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as SiteStory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-stories', siteId] });
      toast.success('Story updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update story: ' + error.message);
    },
  });

  const deleteStory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('site_stories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-stories', siteId] });
      queryClient.invalidateQueries({ queryKey: ['site', siteId] });
      toast.success('Story deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete story: ' + error.message);
    },
  });

  return {
    stories: storiesQuery.data ?? [],
    isLoading: storiesQuery.isLoading,
    error: storiesQuery.error,
    createStory,
    updateStory,
    deleteStory,
  };
}
