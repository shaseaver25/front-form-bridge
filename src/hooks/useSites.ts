import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateCompanyInput {
  name: string;
  description?: string;
  company_type?: string;
  status?: string;
  domain?: string | null;
  revenue?: number | null;
  parent_company_id?: string | null;
}

export function useSites() {
  const queryClient = useQueryClient();

  const sitesQuery = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_companies')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const createSite = useMutation({
    mutationFn: async (input: CreateCompanyInput) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('crm_companies')
        .insert({
          name: input.name,
          description: input.description || null,
          company_type: input.company_type || 'prospect',
          status: input.status || 'active',
          domain: input.domain || null,
          revenue: input.revenue || null,
          parent_company_id: input.parent_company_id || null,
          created_by: user.user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Company created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create company: ' + error.message);
    },
  });

  const updateSite = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CreateCompanyInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('crm_companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Company updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update company: ' + error.message);
    },
  });

  const deleteSite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_companies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      toast.success('Company deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete company: ' + error.message);
    },
  });

  return {
    sites: sitesQuery.data ?? [],
    isLoading: sitesQuery.isLoading,
    error: sitesQuery.error,
    createSite,
    updateSite,
    deleteSite,
  };
}
