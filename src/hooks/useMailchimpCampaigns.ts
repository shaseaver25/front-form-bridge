import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailCampaign {
  id: string;
  name: string;
  subject_line: string;
  preview_text?: string;
  from_name?: string;
  reply_to?: string;
  content_html?: string;
  content_text?: string;
  template_source?: string;
  canva_design_id?: string;
  status: string;
  scheduled_at?: string;
  sent_at?: string;
  mailchimp_campaign_id?: string;
  mailchimp_web_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  total_sent?: number;
  total_opened?: number;
  total_clicked?: number;
  total_bounced?: number;
  total_unsubscribed?: number;
  email_campaign_audiences?: EmailCampaignAudience[];
  email_campaign_stats?: EmailCampaignStats[];
}

export interface EmailCampaignAudience {
  id: string;
  campaign_id: string;
  audience_type: string;
  segment_id?: string;
  tag_filter?: string[];
  custom_query?: Record<string, unknown>;
  recipient_count?: number;
  mailchimp_segment_id?: string;
  constituent_list?: string[];
  created_at: string;
}

export interface EmailCampaignStats {
  id: string;
  campaign_id: string;
  emails_sent: number;
  opens: number;
  unique_opens: number;
  open_rate?: number;
  clicks: number;
  unique_clicks: number;
  click_rate?: number;
  bounces: number;
  unsubscribes: number;
  spam_reports: number;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export function useMailchimpCampaigns(status?: string) {
  return useQuery({
    queryKey: ['mailchimp-campaigns', status],
    queryFn: async () => {
      let query = supabase
        .from('email_campaigns')
        .select(`
          *,
          email_campaign_audiences(*),
          email_campaign_stats(*)
        `)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EmailCampaign[];
    },
  });
}

export function useMailchimpCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['mailchimp-campaign', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('email_campaigns')
        .select(`
          *,
          email_campaign_audiences(*),
          email_campaign_stats(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as EmailCampaign;
    },
    enabled: !!id,
  });
}

export function useCreateMailchimpCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaign: Partial<EmailCampaign> & { audience?: Partial<EmailCampaignAudience> }) => {
      const { audience, ...campaignData } = campaign;
      
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Create campaign - include constituent_list for manual audience
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert([{
          name: campaignData.name || 'Untitled Campaign',
          subject_line: campaignData.subject_line || '',
          preview_text: campaignData.preview_text,
          from_name: campaignData.from_name,
          reply_to: campaignData.reply_to,
          content_html: campaignData.content_html,
          content_text: campaignData.content_text,
          template_source: campaignData.template_source,
          created_by: user.user.id,
          status: 'draft',
          constituent_list: audience?.audience_type === 'manual' ? audience.constituent_list : null,
          segment_type: audience?.audience_type,
        }])
        .select()
        .single();

      if (error) throw error;

      // Create audience targeting
      if (audience) {
        const { error: audienceError } = await supabase
          .from('email_campaign_audiences')
          .insert([{
            campaign_id: data.id,
            audience_type: audience.audience_type || 'all',
            tag_filter: audience.tag_filter,
            segment_id: audience.segment_id || null, // Ensure empty string becomes null
            recipient_count: audience.recipient_count || null,
          }]);

        if (audienceError) throw audienceError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailchimp-campaigns'] });
      toast({ title: 'Campaign created' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create campaign', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateMailchimpCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailCampaign> & { id: string; audience?: Partial<EmailCampaignAudience> }) => {
      const { audience, ...campaignData } = updates;

      // Include constituent_list and segment_type for manual audience
      const { data, error } = await supabase
        .from('email_campaigns')
        .update({
          ...campaignData,
          updated_at: new Date().toISOString(),
          constituent_list: audience?.audience_type === 'manual' ? audience.constituent_list : null,
          segment_type: audience?.audience_type,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update audience if provided
      if (audience) {
        // Delete existing audience
        await supabase
          .from('email_campaign_audiences')
          .delete()
          .eq('campaign_id', id);

        // Insert new audience
        const { error: audienceError } = await supabase
          .from('email_campaign_audiences')
          .insert([{
            campaign_id: id,
            audience_type: audience.audience_type || 'all',
            tag_filter: audience.tag_filter,
            segment_id: audience.segment_id || null, // Ensure empty string becomes null
            recipient_count: audience.recipient_count || null,
          }]);

        if (audienceError) throw audienceError;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mailchimp-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['mailchimp-campaign', variables.id] });
      toast({ title: 'Campaign updated' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update campaign', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSyncToMailchimp() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('mailchimp-create-campaign', {
        body: { campaign_id: campaignId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['mailchimp-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['mailchimp-campaign', campaignId] });
      toast({ title: 'Campaign synced to Mailchimp' });
    },
    onError: (error) => {
      toast({ title: 'Failed to sync campaign', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSendMailchimpCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('mailchimp-send-campaign', {
        body: { campaign_id: campaignId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['mailchimp-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['mailchimp-campaign', campaignId] });
      toast({ title: 'Campaign sent successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Failed to send campaign', description: error.message, variant: 'destructive' });
    },
  });
}

export function useScheduleMailchimpCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ campaignId, scheduleTime }: { campaignId: string; scheduleTime: string }) => {
      const { data, error } = await supabase.functions.invoke('mailchimp-schedule-campaign', {
        body: { campaign_id: campaignId, scheduled_time: scheduleTime },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['mailchimp-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['mailchimp-campaign', campaignId] });
      toast({ title: 'Campaign scheduled' });
    },
    onError: (error) => {
      toast({ title: 'Failed to schedule campaign', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSyncCampaignStats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId?: string) => {
      const { data, error } = await supabase.functions.invoke('mailchimp-sync-campaign-stats', {
        body: { campaign_id: campaignId },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['mailchimp-campaigns'] });
      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: ['mailchimp-campaign', campaignId] });
      }
    },
  });
}

export function useDeleteMailchimpCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      // Delete from database directly (Mailchimp deletion handled separately if needed)
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailchimp-campaigns'] });
      toast({ title: 'Campaign deleted' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete campaign', description: error.message, variant: 'destructive' });
    },
  });
}

export function useGetAudienceCount() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      audience_type: string;
      tag_filter?: string[];
      segment_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('mailchimp-get-audience-count', {
        body: params,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onError: (error) => {
      toast({ title: 'Failed to get audience count', description: error.message, variant: 'destructive' });
    },
  });
}


export function useMailchimpConfig() {
  return useQuery({
    queryKey: ['mailchimp-config'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('mailchimp_sync_config')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}
