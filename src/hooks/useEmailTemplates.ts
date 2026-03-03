import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailTemplate {
  id: string;
  name: string;
  description: string | null;
  template_type: string;
  thumbnail_url: string | null;
  html_content: string | null;
  merge_fields: string[];
  subject_line: string | null;
  preview_text: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailMergeField {
  id: string;
  field_name: string;
  field_label: string;
  placeholder: string;
  source_table: string;
  source_column: string;
  default_value: string | null;
  field_category: string | null;
  is_active: boolean;
  created_at: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  description: string | null;
  template_id: string | null;
  subject_line: string;
  preview_text: string | null;
  segment_type: string | null;
  segment_criteria: Record<string, unknown> | null;
  constituent_list: string[] | null;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_unsubscribed: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  template?: EmailTemplate;
}

export interface EmailSend {
  id: string;
  campaign_id: string | null;
  constituent_id: string | null;
  resend_email_id: string | null;
  to_email: string;
  subject: string;
  status: string;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export function useEmailTemplates(templateType?: string) {
  return useQuery({
    queryKey: ['email-templates', templateType],
    queryFn: async () => {
      let query = supabase
        .from('email_templates')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (templateType && templateType !== 'all') {
        query = query.eq('template_type', templateType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });
}

export function useEmailTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ['email-template', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as EmailTemplate;
    },
    enabled: !!id,
  });
}

export function useMergeFields() {
  return useQuery({
    queryKey: ['email-merge-fields'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_merge_fields')
        .select('*')
        .eq('is_active', true)
        .order('field_category', { ascending: true });
      if (error) throw error;
      return data as EmailMergeField[];
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: Partial<EmailTemplate>) => {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          name: template.name!,
          template_type: template.template_type!,
          description: template.description,
          subject_line: template.subject_line,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('email_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
}

export function useEmailCampaigns(status?: string) {
  return useQuery({
    queryKey: ['email-campaigns', status],
    queryFn: async () => {
      let query = supabase
        .from('email_campaigns')
        .select(`
          *,
          template:email_templates(*)
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

export function useEmailCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ['email-campaign', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('email_campaigns')
        .select(`
          *,
          template:email_templates(*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as EmailCampaign;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaign: Partial<EmailCampaign>) => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert({
          name: campaign.name!,
          subject_line: campaign.subject_line!,
          template_id: campaign.template_id,
          preview_text: campaign.preview_text,
          segment_type: campaign.segment_type,
          segment_criteria: campaign.segment_criteria ? JSON.parse(JSON.stringify(campaign.segment_criteria)) : null,
          constituent_list: campaign.constituent_list,
          status: campaign.status,
          scheduled_at: campaign.scheduled_at,
          total_recipients: campaign.total_recipients,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, name, subject_line, preview_text, status }: Partial<EmailCampaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .update({ name, subject_line, preview_text, status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update campaign: ${error.message}`);
    },
  });
}

export function useEmailSends(campaignId?: string, constituentId?: string) {
  return useQuery({
    queryKey: ['email-sends', campaignId, constituentId],
    queryFn: async () => {
      let query = supabase
        .from('email_sends')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }
      if (constituentId) {
        query = query.eq('constituent_id', constituentId);
      }
      
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as EmailSend[];
    },
    enabled: !!(campaignId || constituentId),
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: async ({ templateId, toEmail }: { templateId: string; toEmail: string }) => {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: { templateId, toEmail },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Test email sent successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to send test email: ${error.message}`);
    },
  });
}

export function useSendCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('send-email-campaign', {
        body: { campaignId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign sending started');
    },
    onError: (error: Error) => {
      toast.error(`Failed to send campaign: ${error.message}`);
    },
  });
}
