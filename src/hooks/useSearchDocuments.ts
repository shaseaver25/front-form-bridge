import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SearchOptions {
  query: string;
  grantId?: string;
  categoryId?: string;
  searchMode: 'keyword' | 'semantic';
  enabled?: boolean;
  maxResults?: number;
}

interface SearchResult {
  document_id: string;
  file_name: string;
  category_name: string | null;
  excerpt: string | null;
  relevance_score: number;
  grant_id: string;
}

export const useSearchDocuments = ({
  query,
  grantId,
  categoryId,
  searchMode,
  enabled = true,
  maxResults = 20
}: SearchOptions) => {
  return useQuery({
    queryKey: ['document-search', query, grantId, categoryId, searchMode, maxResults],
    queryFn: async (): Promise<SearchResult[]> => {
      const { data, error } = await supabase.rpc('search_documents', {
        search_query: query || null,
        grant_id_filter: grantId || null,
        category_filter: categoryId || null,
        search_mode: searchMode,
        match_threshold: 0.7,
        max_results: maxResults
      });
      
      if (error) throw error;
      return (data as SearchResult[]) || [];
    },
    enabled: enabled && (query.length > 2 || !query)
  });
};

// Phase 2: Semantic search hook (placeholder)
export const useSemanticSearch = ({
  query,
  grantId,
  enabled = true
}: Omit<SearchOptions, 'searchMode' | 'categoryId'>) => {
  return useQuery({
    queryKey: ['semantic-search', query, grantId],
    queryFn: async () => {
      // Phase 2: Call embedding endpoint and perform vector search
      throw new Error('Semantic search available in Phase 2');
    },
    enabled: false // Disabled until Phase 2
  });
};
