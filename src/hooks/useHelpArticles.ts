import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HelpArticle {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  document_url: string | null;
  document_type: string;
  category: string;
  subcategory: string | null;
  order_index: number;
  is_published: boolean;
  target_roles: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HelpFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const HELP_CATEGORIES = [
  { value: 'getting-started', label: 'Getting Started', icon: 'Rocket' },
  { value: 'constituents', label: 'Constituents & Donors', icon: 'Users' },
  { value: 'pipeline', label: 'Major Gifts Pipeline', icon: 'TrendingUp' },
  { value: 'grants', label: 'Grants Management', icon: 'FileText' },
  { value: 'voice-notes', label: 'Voice Notes', icon: 'Mic' },
  { value: 'boards', label: 'Project Boards', icon: 'Kanban' },
  { value: 'financial', label: 'Financial Runway', icon: 'DollarSign' },
  { value: 'admin', label: 'Admin & Settings', icon: 'Settings' },
];

export function useHelpArticles(category?: string) {
  return useQuery({
    queryKey: ['help-articles', category],
    queryFn: async () => {
      let query = supabase
        .from('help_articles')
        .select('*')
        .eq('is_published', true)
        .order('order_index')
        .order('title');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HelpArticle[];
    },
  });
}

export function useHelpArticle(slug: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['help-article', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_articles')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;

      // Track view
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data) {
        await supabase.from('help_article_views').insert({
          article_id: data.id,
          user_id: user.id,
        });
      }

      return data as HelpArticle;
    },
    enabled: !!slug,
  });
}

export function useSearchHelpArticles(searchQuery: string) {
  return useQuery({
    queryKey: ['help-articles-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const { data, error } = await supabase
        .from('help_articles')
        .select('*')
        .eq('is_published', true)
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .order('order_index')
        .limit(20);

      if (error) throw error;
      return data as HelpArticle[];
    },
    enabled: searchQuery.length >= 2,
  });
}

export function useHelpFaqs(category?: string) {
  return useQuery({
    queryKey: ['help-faqs', category],
    queryFn: async () => {
      let query = supabase
        .from('help_faqs')
        .select('*')
        .eq('is_published', true)
        .order('order_index')
        .order('question');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HelpFaq[];
    },
  });
}

export function useMostViewedArticles(limit = 5) {
  return useQuery({
    queryKey: ['help-articles-most-viewed', limit],
    queryFn: async () => {
      // Get view counts grouped by article
      const { data: views, error: viewsError } = await supabase
        .from('help_article_views')
        .select('article_id');

      if (viewsError) throw viewsError;

      // Count views per article
      const viewCounts: Record<string, number> = {};
      views?.forEach((v) => {
        viewCounts[v.article_id] = (viewCounts[v.article_id] || 0) + 1;
      });

      // Get the top article IDs
      const topIds = Object.entries(viewCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([id]) => id);

      if (topIds.length === 0) {
        // Return first articles if no views yet
        const { data, error } = await supabase
          .from('help_articles')
          .select('*')
          .eq('is_published', true)
          .order('order_index')
          .limit(limit);

        if (error) throw error;
        return data as HelpArticle[];
      }

      const { data, error } = await supabase
        .from('help_articles')
        .select('*')
        .in('id', topIds)
        .eq('is_published', true);

      if (error) throw error;
      return data as HelpArticle[];
    },
  });
}
