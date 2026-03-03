import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FirefliesSettings {
  id: string;
  user_id: string;
  api_key_encrypted: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  sync_frequency: 'manual' | 'daily' | 'hourly';
}

export function useFirefliesConnection() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['fireflies-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('fireflies_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as FirefliesSettings | null;
    },
  });

  const saveApiKeyMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const existing = settingsQuery.data;

      if (existing) {
        const { error } = await supabase
          .from('fireflies_settings')
          .update({ api_key_encrypted: apiKey, is_active: true })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fireflies_settings')
          .insert({
            user_id: user.id,
            api_key_encrypted: apiKey,
            is_active: true,
            sync_frequency: 'manual',
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fireflies-settings'] });
      toast.success('Fireflies API key saved');
    },
    onError: (error) => {
      toast.error('Failed to save API key: ' + error.message);
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('fireflies-user-sync', {
        body: { action: 'test' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => toast.success('Connection successful!'),
    onError: (error) => toast.error('Connection failed: ' + error.message),
  });

  const syncNowMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('fireflies-user-sync', {
        body: { action: 'sync' },
      });
      if (error) throw error;
      
      if (settingsQuery.data) {
        await supabase
          .from('fireflies_settings')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', settingsQuery.data.id);
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fireflies-settings'] });
      queryClient.invalidateQueries({ queryKey: ['meeting-transcripts'] });
      toast.success(`Synced ${data?.meetingsImported || 0} meetings`);
    },
    onError: (error) => toast.error('Sync failed: ' + error.message),
  });

  const updateSyncFrequencyMutation = useMutation({
    mutationFn: async (frequency: 'manual' | 'daily' | 'hourly') => {
      if (!settingsQuery.data) throw new Error('No settings found');
      const { error } = await supabase
        .from('fireflies_settings')
        .update({ sync_frequency: frequency })
        .eq('id', settingsQuery.data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fireflies-settings'] });
      toast.success('Sync frequency updated');
    },
    onError: (error) => toast.error('Failed to update frequency: ' + error.message),
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!settingsQuery.data) throw new Error('No settings found');
      const { error } = await supabase
        .from('fireflies_settings')
        .update({ is_active: false, api_key_encrypted: null })
        .eq('id', settingsQuery.data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fireflies-settings'] });
      toast.success('Fireflies disconnected');
    },
    onError: (error) => toast.error('Failed to disconnect: ' + error.message),
  });

  const isConnected = settingsQuery.data?.is_active && settingsQuery.data?.api_key_encrypted;

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    isConnected,
    saveApiKey: saveApiKeyMutation.mutateAsync,
    testConnection: testConnectionMutation.mutateAsync,
    syncNow: syncNowMutation.mutateAsync,
    updateSyncFrequency: updateSyncFrequencyMutation.mutateAsync,
    disconnect: disconnectMutation.mutateAsync,
    isSaving: saveApiKeyMutation.isPending,
    isTesting: testConnectionMutation.isPending,
    isSyncing: syncNowMutation.isPending,
  };
}
