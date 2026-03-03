import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useQBSettings = () => {
  return useQuery({
    queryKey: ['qb-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quickbooks_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });
};

export const useQBFundMappings = () => {
  return useQuery({
    queryKey: ['qb-fund-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quickbooks_fund_mappings')
        .select('*')
        .order('fund_designation');
      if (error) throw error;
      return data ?? [];
    }
  });
};

export const useQBSyncLog = (filters?: {
  syncType?: string;
  direction?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['qb-sync-log', filters],
    queryFn: async () => {
      let query = supabase
        .from('quickbooks_sync_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);
      
      if (filters?.syncType && filters.syncType !== 'all') {
        query = query.eq('sync_type', filters.syncType);
      }
      if (filters?.direction && filters.direction !== 'all') {
        query = query.eq('direction', filters.direction);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate) {
        query = query.gte('started_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('started_at', filters.endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    }
  });
};

export const useQBEntityMappings = (entityType?: string) => {
  return useQuery({
    queryKey: ['qb-entity-mappings', entityType],
    queryFn: async () => {
      let query = supabase
        .from('quickbooks_entity_mappings')
        .select('*')
        .order('last_synced_at', { ascending: false });
      
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    }
  });
};

export const useUnsyncedGifts = () => {
  return useQuery({
    queryKey: ['unsynced-gifts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unsynced_gifts', { limit_count: 100 });
      if (error) throw error;
      return data ?? [];
    }
  });
};

export const useUnsyncedConstituents = () => {
  return useQuery({
    queryKey: ['unsynced-constituents'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unsynced_constituents', { limit_count: 100 });
      if (error) throw error;
      return data ?? [];
    }
  });
};

export const useUpdateFundMapping = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (mapping: {
      id?: string;
      fund_designation: string;
      qb_account_id?: string | null;
      qb_account_name?: string | null;
      qb_class_id?: string | null;
      qb_class_name?: string | null;
      is_active?: boolean;
    }) => {
      if (mapping.id) {
        const { data, error } = await supabase
          .from('quickbooks_fund_mappings')
          .update(mapping)
          .eq('id', mapping.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('quickbooks_fund_mappings')
          .insert([mapping])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qb-fund-mappings'] });
      toast.success('Fund mapping saved');
    },
    onError: (error: Error) => {
      toast.error('Failed to save mapping: ' + error.message);
    }
  });
};

export const useDeleteFundMapping = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quickbooks_fund_mappings')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qb-fund-mappings'] });
      toast.success('Fund mapping deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete mapping: ' + error.message);
    }
  });
};

export const useStartSync = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (options: {
      syncType: 'full' | 'incremental' | 'single_entity';
      direction: 'to_qb' | 'from_qb' | 'bidirectional';
      entityTypes?: string[];
      entityIds?: string[];
    }) => {
      // Create sync log entry
      const { data: logEntry, error: logError } = await supabase
        .from('quickbooks_sync_log')
        .insert([{
          sync_type: options.syncType,
          direction: options.direction,
          status: 'started',
          started_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (logError) throw logError;

      const entityTypes = options.entityTypes || ['donations', 'pledges', 'customers'];
      const results: Array<{ type: string; result: unknown }> = [];

      // Map old entity type names to new action names
      const typeToAction: Record<string, string> = {
        'donations': 'syncDonations',
        'gift': 'syncDonations',
        'pledges': 'syncPledges',
        'pledge': 'syncPledges',
        'customers': 'syncCustomers',
        'constituent': 'syncCustomers'
      };

      try {
        // Execute syncs based on entity types
        for (const entityType of entityTypes) {
          const action = typeToAction[entityType];
          if (!action) continue;

          const response = await supabase.functions.invoke('quickbooks-api', {
            body: { 
              action, 
              syncLogId: logEntry.id,
              entityIds: options.entityIds 
            }
          });

          if (response.error) {
            console.error(`Error syncing ${entityType}:`, response.error);
          } else {
            results.push({ type: entityType, result: response.data });
          }
        }

        // Calculate totals
        const totals = results.reduce((acc, r: any) => ({
          processed: acc.processed + (r.result?.processed || 0),
          created: acc.created + (r.result?.created || 0),
          updated: acc.updated + (r.result?.updated || 0),
          errors: acc.errors + (r.result?.errors || 0)
        }), { processed: 0, created: 0, updated: 0, errors: 0 });

        // Update sync log with final results
        await supabase
          .from('quickbooks_sync_log')
          .update({
            status: totals.errors > 0 ? 'partial' : 'completed',
            completed_at: new Date().toISOString(),
            records_processed: totals.processed,
            records_created: totals.created,
            records_updated: totals.updated,
            records_failed: totals.errors
          })
          .eq('id', logEntry.id);

        return { logEntry, results, totals };
      } catch (error) {
        // Update sync log on error
        await supabase
          .from('quickbooks_sync_log')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', logEntry.id);

        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qb-sync-log'] });
      queryClient.invalidateQueries({ queryKey: ['unsynced-gifts'] });
      queryClient.invalidateQueries({ queryKey: ['unsynced-constituents'] });
      queryClient.invalidateQueries({ queryKey: ['qb-entity-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['qb-reconciliation'] });
      toast.success('Sync completed successfully');
    },
    onError: (error: Error) => {
      toast.error('Sync failed: ' + error.message);
    }
  });
};

export const useQBConnection = () => {
  return useQuery({
    queryKey: ['qb-connection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quickbooks_connections')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });
};
