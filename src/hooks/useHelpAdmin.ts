import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { HelpArticle, HelpFaq } from './useHelpArticles';

export function useHelpArticlesAdmin() {
  return useQuery({
    queryKey: ['help-articles-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_articles')
        .select('*')
        .order('category')
        .order('order_index')
        .order('title');

      if (error) throw error;
      return data as HelpArticle[];
    },
  });
}

export function useHelpFaqsAdmin() {
  return useQuery({
    queryKey: ['help-faqs-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_faqs')
        .select('*')
        .order('category')
        .order('order_index')
        .order('question');

      if (error) throw error;
      return data as HelpFaq[];
    },
  });
}

export function useCreateHelpArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (article: {
      title: string;
      slug: string;
      content?: string;
      document_url?: string;
      document_type: string;
      category: string;
      subcategory?: string;
      order_index?: number;
      is_published?: boolean;
      target_roles?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('help_articles')
        .insert({
          ...article,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-articles'] });
      queryClient.invalidateQueries({ queryKey: ['help-articles-admin'] });
      toast.success('Article created');
    },
    onError: () => {
      toast.error('Failed to create article');
    },
  });
}

export function useUpdateHelpArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<HelpArticle, 'id' | 'created_at' | 'created_by'>>;
    }) => {
      const { data, error } = await supabase
        .from('help_articles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-articles'] });
      queryClient.invalidateQueries({ queryKey: ['help-articles-admin'] });
      queryClient.invalidateQueries({ queryKey: ['help-article'] });
      toast.success('Article updated');
    },
    onError: () => {
      toast.error('Failed to update article');
    },
  });
}

export function useDeleteHelpArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('help_articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-articles'] });
      queryClient.invalidateQueries({ queryKey: ['help-articles-admin'] });
      toast.success('Article deleted');
    },
    onError: () => {
      toast.error('Failed to delete article');
    },
  });
}

export function useCreateHelpFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (faq: {
      question: string;
      answer: string;
      category: string;
      order_index?: number;
      is_published?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('help_faqs')
        .insert(faq)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-faqs'] });
      queryClient.invalidateQueries({ queryKey: ['help-faqs-admin'] });
      toast.success('FAQ created');
    },
    onError: () => {
      toast.error('Failed to create FAQ');
    },
  });
}

export function useUpdateHelpFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<HelpFaq, 'id' | 'created_at'>>;
    }) => {
      const { data, error } = await supabase
        .from('help_faqs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-faqs'] });
      queryClient.invalidateQueries({ queryKey: ['help-faqs-admin'] });
      toast.success('FAQ updated');
    },
    onError: () => {
      toast.error('Failed to update FAQ');
    },
  });
}

export function useDeleteHelpFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('help_faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-faqs'] });
      queryClient.invalidateQueries({ queryKey: ['help-faqs-admin'] });
      toast.success('FAQ deleted');
    },
    onError: () => {
      toast.error('Failed to delete FAQ');
    },
  });
}

export function useUploadHelpDocument() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('help-documents')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('help-documents')
        .getPublicUrl(data.path);

      return publicUrl;
    },
    onError: () => {
      toast.error('Failed to upload document');
    },
  });
}

export function useHelpAnalytics() {
  return useQuery({
    queryKey: ['help-analytics'],
    queryFn: async () => {
      // Get view counts grouped by article
      const { data: views, error: viewsError } = await supabase
        .from('help_article_views')
        .select('article_id, viewed_at');

      if (viewsError) throw viewsError;

      // Get all articles
      const { data: articles, error: articlesError } = await supabase
        .from('help_articles')
        .select('id, title, category');

      if (articlesError) throw articlesError;

      // Count views per article
      const viewCounts: Record<string, number> = {};
      views?.forEach((v) => {
        viewCounts[v.article_id] = (viewCounts[v.article_id] || 0) + 1;
      });

      // Build analytics data
      const articleViews = articles?.map((article) => ({
        ...article,
        views: viewCounts[article.id] || 0,
      })).sort((a, b) => b.views - a.views);

      // Category breakdown
      const categoryViews: Record<string, number> = {};
      articles?.forEach((article) => {
        categoryViews[article.category] = (categoryViews[article.category] || 0) + (viewCounts[article.id] || 0);
      });

      return {
        totalViews: views?.length || 0,
        articleViews,
        categoryViews,
      };
    },
  });
}
