import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FEATURE_FLAGS } from '@/config/features';

export interface ContentItem {
  id: string;
  title: string;
  content: string;
  content_type: string;
  tags: string[];
  category: string | null;
  is_template: boolean;
  is_approved: boolean;
  use_count: number;
  last_used_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ContentFilters {
  searchQuery?: string;
  contentType?: string;
  onlyTemplates?: boolean;
  searchMode?: 'keyword' | 'semantic';
}

// Generate embedding for a single content item
const generateEmbeddingForContent = async (contentId: string): Promise<void> => {
  if (!FEATURE_FLAGS.SEMANTIC_SEARCH) {
    return;
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: { contentId, table: 'content_repository' }
    });

    if (error) {
      console.error('Embedding generation failed:', error);
      return;
    }

    if (data?.success) {
      console.warn(`Embedding generated for content ${contentId}, tokens: ${data.tokensUsed}`);
    }
  } catch (err) {
    console.error('Error generating embedding:', err);
  }
};

export const useContentRepository = (filters?: ContentFilters) => {
  return useQuery({
    queryKey: ['content-repository', filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_content_repository', {
        search_query: filters?.searchQuery || null,
        search_mode: filters?.searchMode || 'keyword',
        content_type_filter: filters?.contentType || null,
        tag_filter: null,
        only_approved: true,
        max_results: 50
      });
      
      if (error) throw error;
      
      let results = (data as unknown as ContentItem[]) || [];
      
      // Client-side filter for templates
      if (filters?.onlyTemplates) {
        results = results.filter(item => item.is_template);
      }
      
      return results;
    }
  });
};

export const useAddContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (content: {
      title: string;
      content: string;
      content_type: string;
      tags?: string[];
      category?: string;
      is_template?: boolean;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('content_repository')
        .insert({
          ...content,
          is_approved: false,
          created_by: userData.user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['content-repository'] });
      toast.success('Content submitted for approval');
      
      // Fire-and-forget embedding generation
      if (FEATURE_FLAGS.SEMANTIC_SEARCH && data?.id) {
        generateEmbeddingForContent(data.id);
      }
    },
    onError: (error) => {
      toast.error('Failed to add content: ' + error.message);
    }
  });
};

export const useUpdateContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContentItem> & { id: string }) => {
      // Clear embedding if content or title changed (will be regenerated)
      const needsReembedding = updates.title !== undefined || updates.content !== undefined;
      
      const updateData = needsReembedding 
        ? { ...updates, embedding: null, last_embedded_at: null }
        : updates;
      
      const { data, error } = await supabase
        .from('content_repository')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, needsReembedding };
    },
    onSuccess: ({ data, needsReembedding }) => {
      queryClient.invalidateQueries({ queryKey: ['content-repository'] });
      toast.success('Content updated');
      
      // Regenerate embedding if content changed
      if (FEATURE_FLAGS.SEMANTIC_SEARCH && needsReembedding && data?.id) {
        generateEmbeddingForContent(data.id);
      }
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    }
  });
};

export const useIncrementUseCount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase.rpc('increment_content_use_count', {
        content_id: contentId
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-repository'] });
    }
  });
};

export const useDeleteContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase
        .from('content_repository')
        .delete()
        .eq('id', contentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-repository'] });
      toast.success('Content deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    }
  });
};
