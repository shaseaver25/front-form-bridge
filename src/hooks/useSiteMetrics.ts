import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SiteMetric } from '@/types/sites';

interface CreateMetricInput {
  site_id: string;
  metric_name: string;
  metric_type?: string;
  target_value?: number;
  current_value?: number;
  measurement_date?: string;
  notes?: string;
}

export function useSiteMetrics(siteId: string | undefined) {
  const queryClient = useQueryClient();

  const metricsQuery = useQuery({
    queryKey: ['site-metrics', siteId],
    queryFn: async () => {
      if (!siteId) return [];
      
      const { data, error } = await supabase
        .from('site_metrics')
        .select('*')
        .eq('site_id', siteId)
        .order('measurement_date', { ascending: false });
      
      if (error) throw error;
      return data as SiteMetric[];
    },
    enabled: !!siteId,
  });

  const createMetric = useMutation({
    mutationFn: async (input: CreateMetricInput) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('site_metrics')
        .insert({
          ...input,
          created_by: user.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as SiteMetric;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-metrics', siteId] });
      toast.success('Metric added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add metric: ' + error.message);
    },
  });

  const updateMetric = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SiteMetric> & { id: string }) => {
      const { data, error } = await supabase
        .from('site_metrics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as SiteMetric;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-metrics', siteId] });
      toast.success('Metric updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update metric: ' + error.message);
    },
  });

  const deleteMetric = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('site_metrics')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-metrics', siteId] });
      toast.success('Metric deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete metric: ' + error.message);
    },
  });

  return {
    metrics: metricsQuery.data ?? [],
    isLoading: metricsQuery.isLoading,
    error: metricsQuery.error,
    createMetric,
    updateMetric,
    deleteMetric,
  };
}
