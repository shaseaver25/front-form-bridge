import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Clock,
  Users,
  FileText,
  Eye,
  CalendarIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Settings,
  X,
  Plus,
  UserPlus,
} from 'lucide-react';
import { ManualRecipientSelector } from '@/components/email-campaigns/ManualRecipientSelector';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  useMailchimpCampaign,
  useCreateMailchimpCampaign,
  useUpdateMailchimpCampaign,
  useSyncToMailchimp,
  useSendMailchimpCampaign,
  useScheduleMailchimpCampaign,
  useGetAudienceCount,
  useMailchimpConfig,
} from '@/hooks/useMailchimpCampaigns';
import { useEmailTemplates, useSendCampaign } from '@/hooks/useEmailTemplates';
import { EmailContentEditor } from '@/components/email-campaigns/EmailContentEditor';
import { EmailPreviewPanel } from '@/components/email-campaigns/EmailPreviewPanel';
import { TemplateSelectionGrid } from '@/components/email-campaigns/TemplateSelectionGrid';

const STEPS = [
  { id: 'setup', label: 'Setup', icon: Settings },
  { id: 'audience', label: 'Audience', icon: Users },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'review', label: 'Review & Send', icon: Send },
];

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All subscribers', description: 'Send to your entire Mailchimp audience' },
  { value: 'tag', label: 'By tag', description: 'Filter recipients by Mailchimp tags' },
  { value: 'title', label: 'By title', description: 'Filter recipients by their job title (e.g. Superintendent)' },
  { value: 'donors', label: 'Active donors', description: 'Subscribers who have made a donation' },
  { value: 'new', label: 'New subscribers', description: 'Subscribers who joined in the last 30 days' },
  { value: 'manual', label: 'Select specific people', description: 'Manually pick individuals from your contacts' },
];

interface FilterRow {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export default function MailchimpCampaignComposer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const isEditing = !!id;

  const { data: existingCampaign, isLoading: loadingCampaign } = useMailchimpCampaign(id || duplicateId || undefined);
  const { data: templates } = useEmailTemplates();
  const { data: mailchimpConfig } = useMailchimpConfig();
  const createCampaign = useCreateMailchimpCampaign();
  const updateCampaign = useUpdateMailchimpCampaign();
  const syncToMailchimp = useSyncToMailchimp();
  const sendMailchimpCampaign = useSendMailchimpCampaign();
  const sendDirectCampaign = useSendCampaign();
  const scheduleCampaign = useScheduleMailchimpCampaign();
  const getAudienceCount = useGetAudienceCount();

  const [currentStep, setCurrentStep] = useState(0);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [campaignId, setCampaignId] = useState<string | null>(id || null);

  // Form state - Setup
  const [formData, setFormData] = useState({
    name: '',
    subject_line: '',
    preview_text: '',
    from_name: '',
    reply_to: '',
  });

  // Form state - Audience
  const [audienceData, setAudienceData] = useState({
    audience_type: 'all',
    tag_filter: [] as string[],
    segment_id: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [customFilters, setCustomFilters] = useState<FilterRow[]>([]);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [manualRecipientIds, setManualRecipientIds] = useState<string[]>([]);
  const [manualRecipientCount, setManualRecipientCount] = useState(0);
  const [titleFilter, setTitleFilter] = useState<string[]>([]);
  const [availableTitles, setAvailableTitles] = useState<string[]>([]);
  const [titleRecipientIds, setTitleRecipientIds] = useState<string[]>([]);

  const handleManualRecipientCountChange = useCallback((count: number) => {
    setManualRecipientCount(count);
    setRecipientCount(count);
  }, []);

  // Form state - Content
  const [contentData, setContentData] = useState({
    content_html: '',
    content_text: '',
    template_source: 'custom',
    selectedTemplateId: '',
  });

  // Load existing campaign data
  useEffect(() => {
    if (existingCampaign) {
      setFormData({
        name: duplicateId ? `Copy of ${existingCampaign.name}` : existingCampaign.name || '',
        subject_line: existingCampaign.subject_line || '',
        preview_text: existingCampaign.preview_text || '',
        from_name: existingCampaign.from_name || '',
        reply_to: existingCampaign.reply_to || '',
      });

      setContentData({
        content_html: existingCampaign.content_html || '',
        content_text: existingCampaign.content_text || '',
        template_source: existingCampaign.template_source || 'custom',
        selectedTemplateId: '',
      });

      const audience = existingCampaign.email_campaign_audiences?.[0];
      if (audience) {
        setAudienceData({
          audience_type: audience.audience_type || 'all',
          tag_filter: audience.tag_filter || [],
          segment_id: audience.segment_id || '',
        });
        setRecipientCount(audience.recipient_count || null);
      }
    }
  }, [existingCampaign, duplicateId]);

  // Fetch available titles for title filter
  useEffect(() => {
    const fetchTitles = async () => {
      const { data } = await supabase
        .from('constituents')
        .select('title')
        .not('title', 'is', null)
        .not('primary_email', 'is', null);
      if (data) {
        const uniqueTitles = [...new Set(data.map(c => c.title).filter(Boolean))] as string[];
        uniqueTitles.sort((a, b) => a.localeCompare(b));
        setAvailableTitles(uniqueTitles);
      }
    };
    fetchTitles();
  }, []);

  // Fetch recipients matching title filter
  useEffect(() => {
    const fetchTitleRecipients = async () => {
      if (audienceData.audience_type !== 'title' || titleFilter.length === 0) {
        setTitleRecipientIds([]);
        if (audienceData.audience_type === 'title') setRecipientCount(0);
        return;
      }
      const { data } = await supabase
        .from('constituents')
        .select('id')
        .not('primary_email', 'is', null)
        .in('title', titleFilter);
      if (data) {
        const ids = data.map(c => c.id);
        setTitleRecipientIds(ids);
        setRecipientCount(ids.length);
      }
    };
    fetchTitleRecipients();
  }, [audienceData.audience_type, titleFilter]);

  // Refresh audience count when audience settings change
  const refreshAudienceCount = async () => {
    if (audienceData.audience_type === 'title') {
      // Already handled by the effect above
      return;
    }
    const result = await getAudienceCount.mutateAsync({
      audience_type: audienceData.audience_type,
      tag_filter: audienceData.tag_filter,
      segment_id: audienceData.segment_id || undefined,
    });
    setRecipientCount(result.count);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !audienceData.tag_filter.includes(tagInput.trim())) {
      setAudienceData(prev => ({
        ...prev,
        tag_filter: [...prev.tag_filter, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setAudienceData(prev => ({
      ...prev,
      tag_filter: prev.tag_filter.filter(t => t !== tag),
    }));
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setContentData(prev => ({
        ...prev,
        content_html: template.html_content || '',
        selectedTemplateId: templateId,
        template_source: template.template_type || 'custom',
      }));
    }
  };

  const getStarterHtml = () => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { padding: 40px 30px; text-align: center; background: #4f46e5; color: white; }
    .content { padding: 30px; }
    .footer { padding: 20px 30px; text-align: center; font-size: 12px; color: #666; background: #f9f9f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Headline Here</h1>
    </div>
    <div class="content">
      <p>Hi {{first_name}},</p>
      <p>Start writing your email content here. You can use merge tags like {{first_name}} and {{last_name}} to personalize your message.</p>
      <p>Best regards,<br>{{organization}}</p>
    </div>
    <div class="footer">
      <p>&copy; {{current_year}} Your Organization. All rights reserved.</p>
      <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
  };

  const saveDraft = async () => {
    try {
      // Extract only the fields that exist in the database (exclude selectedTemplateId)
      const { selectedTemplateId: _, ...dbContentData } = contentData;

      // Build audience data with constituent_list for manual/title recipients
      const constituentList = audienceData.audience_type === 'manual' 
        ? manualRecipientIds 
        : audienceData.audience_type === 'title' 
          ? titleRecipientIds 
          : undefined;
      const audiencePayload = {
        ...audienceData,
        constituent_list: constituentList,
        recipient_count: recipientCount ?? undefined,
      };

      if (campaignId) {
        await updateCampaign.mutateAsync({
          id: campaignId,
          ...formData,
          ...dbContentData,
          audience: audiencePayload,
        });
        toast({
          title: "Campaign saved",
          description: "Your campaign draft has been saved successfully.",
        });
      } else {
        const result = await createCampaign.mutateAsync({
          ...formData,
          ...dbContentData,
          audience: audiencePayload,
        });
        setCampaignId(result.id);
        toast({
          title: "Campaign created",
          description: "Your new campaign has been created as a draft.",
        });
        navigate(`/email-marketing/campaigns/${result.id}/edit`, { replace: true });
      }
    } catch (error) {
      toast({
        title: "Error saving campaign",
        description: error instanceof Error ? error.message : "Failed to save campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSyncToMailchimp = async () => {
    try {
      if (!campaignId) {
        await saveDraft();
      }
      if (campaignId) {
        await syncToMailchimp.mutateAsync(campaignId);
        toast({
          title: "Synced to Mailchimp",
          description: "Campaign has been synced to Mailchimp successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to sync with Mailchimp. Please check your connection.",
        variant: "destructive",
      });
    }
  };

  const handleSend = async () => {
    if (!campaignId) return;

    // Validate before sending
    const validation = validateCampaign();
    if (!validation.valid) {
      toast({
        title: "Cannot send campaign",
        description: validation.errors.join('. '),
        variant: "destructive",
      });
      return;
    }

    // Check audience count
    if (recipientCount !== null && recipientCount === 0) {
      toast({
        title: "No recipients",
        description: "Your audience has 0 recipients. Please adjust your audience settings before sending.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Extract only the fields that exist in the database (exclude selectedTemplateId)
      const { selectedTemplateId: _, ...dbContentData } = contentData;

      // For manual/title recipients, use direct sending via Resend (no Mailchimp sync needed)
      if (audienceData.audience_type === 'manual' || audienceData.audience_type === 'title') {
        const recipientIds = audienceData.audience_type === 'manual' ? manualRecipientIds : titleRecipientIds;
        // First save the campaign with recipient IDs
        console.warn('[Send] Saving campaign with recipients:', recipientIds.length);
        await updateCampaign.mutateAsync({
          id: campaignId,
          ...formData,
          ...dbContentData,
          audience: {
            ...audienceData,
            constituent_list: recipientIds,
            recipient_count: recipientIds.length,
          },
        });

        toast({
          title: "Sending campaign...",
          description: `Your email is being sent to ${recipientCount?.toLocaleString() || 'your'} recipients via direct email.`,
        });

        console.warn('[Send] Calling sendDirectCampaign for campaign:', campaignId);
        await sendDirectCampaign.mutateAsync(campaignId);
        
        toast({
          title: "Campaign sent successfully!",
          description: `Your campaign "${formData.name}" has been sent.`,
        });
      } else {
        // For Mailchimp audiences, sync first if needed
        if (!existingCampaign?.mailchimp_campaign_id) {
          toast({
            title: "Syncing campaign...",
            description: "Preparing your campaign for sending.",
          });
          await syncToMailchimp.mutateAsync(campaignId);
        }

        toast({
          title: "Sending campaign...",
          description: `Your email is being sent to ${recipientCount?.toLocaleString() || 'your'} recipients.`,
        });

        await sendMailchimpCampaign.mutateAsync(campaignId);
        
        toast({
          title: "Campaign sent successfully!",
          description: `Your campaign "${formData.name}" has been sent.`,
        });
      }
      
      setShowSendDialog(false);
      navigate('/email-marketing/campaigns');
    } catch (error) {
      console.error('[Send] Error sending campaign:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Handle specific errors
      let userMessage = "There was an error sending your campaign.";
      if (errorMessage.includes('rate limit')) {
        userMessage = "Rate limit exceeded. Please wait a few minutes and try again.";
      } else if (errorMessage.includes('already sent')) {
        userMessage = "This campaign has already been sent.";
      } else if (errorMessage.includes('not ready')) {
        userMessage = "Campaign is not ready to send. Please check all required fields.";
      } else if (errorMessage.includes('compliance')) {
        userMessage = "Campaign does not meet compliance requirements.";
      } else {
        userMessage = errorMessage;
      }
      
      toast({
        title: "Failed to send campaign",
        description: userMessage,
        variant: "destructive",
      });
    }
  };

  const handleSchedule = async () => {
    if (!campaignId || !scheduleDate) return;

    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const scheduledDateTime = new Date(scheduleDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    try {
      // Sync to Mailchimp first if not synced
      if (!existingCampaign?.mailchimp_campaign_id) {
        await syncToMailchimp.mutateAsync(campaignId);
      }

      await scheduleCampaign.mutateAsync({
        campaignId,
        scheduleTime: scheduledDateTime.toISOString(),
      });

      toast({
        title: "Campaign scheduled",
        description: `Your campaign will be sent on ${format(scheduledDateTime, 'PPP')} at ${format(scheduledDateTime, 'p')}.`,
      });

      setShowScheduleDialog(false);
      navigate('/email-marketing/campaigns');
    } catch (error) {
      toast({
        title: "Failed to schedule campaign",
        description: error instanceof Error ? error.message : "There was an error scheduling your campaign. Please try again.",
        variant: "destructive",
      });
    }
  };

  const validateCampaign = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate required fields
    if (!formData.name.trim()) {
      errors.push('Campaign name is required');
    }
    if (!formData.subject_line.trim()) {
      errors.push('Subject line is required');
    }
    if (!contentData.content_html.trim()) {
      errors.push('Email content is required');
    }

    // Validate audience count
    if (recipientCount !== null && recipientCount === 0) {
      errors.push('Audience has 0 recipients. Please adjust your audience settings.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Setup
        return formData.name.trim() && formData.subject_line.trim();
      case 1: // Audience
        return audienceData.audience_type === 'all' || 
               (audienceData.audience_type === 'tag' && audienceData.tag_filter.length > 0) ||
               (audienceData.audience_type === 'title' && titleFilter.length > 0) ||
               audienceData.audience_type === 'donors' ||
               audienceData.audience_type === 'new' ||
               (audienceData.audience_type === 'manual' && manualRecipientIds.length > 0);
      case 2: // Content
        return contentData.content_html.trim().length > 0;
      default:
        return true;
    }
  };

  const canSend = () => {
    const validation = validateCampaign();
    return validation.valid && (recipientCount === null || recipientCount > 0);
  };

  const isSaving = createCampaign.isPending || updateCampaign.isPending;
  const isSyncing = syncToMailchimp.isPending;
  const isSending = sendMailchimpCampaign.isPending || sendDirectCampaign.isPending;
  const isScheduling = scheduleCampaign.isPending;
  const isSynced = !!existingCampaign?.mailchimp_campaign_id;

  if (loadingCampaign) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!mailchimpConfig) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Mailchimp Not Connected</h2>
          <p className="text-muted-foreground mb-4">
            Connect your Mailchimp account to create email campaigns.
          </p>
          <Button onClick={() => navigate('/mailchimp-settings')}>Connect Mailchimp</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/email-marketing/campaigns')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isEditing ? 'Edit Campaign' : duplicateId ? 'Duplicate Campaign' : 'New Campaign'}
              </h1>
              <p className="text-muted-foreground">
                {formData.name || 'Untitled campaign'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSynced && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                Synced
              </Badge>
            )}
            <Button variant="outline" onClick={saveDraft} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isComplete && "text-primary",
                  !isActive && !isComplete && "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium",
                  isComplete && "bg-primary text-primary-foreground"
                )}>
                  {isComplete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </div>
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[500px]">
          {/* Step 1: Setup */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Campaign Setup</CardTitle>
                <CardDescription>Configure the basic settings for your campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name *</Label>
                    <Input
                      id="name"
                      placeholder="Q1 Newsletter"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Internal name, not shown to recipients</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from_name">From Name</Label>
                    <Input
                      id="from_name"
                      placeholder="Your Organization"
                      value={formData.from_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, from_name: e.target.value }))}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="subject">Subject Line *</Label>
                    <span className={cn(
                      "text-xs",
                      formData.subject_line.length > 50 ? "text-amber-500" : "text-muted-foreground"
                    )}>
                      {formData.subject_line.length}/50 characters
                    </span>
                  </div>
                  <Input
                    id="subject"
                    placeholder="Your Monthly Update"
                    value={formData.subject_line}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject_line: e.target.value }))}
                  />
                  {formData.subject_line && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                      <p className="font-medium">{formData.subject_line}</p>
                      <p className="text-sm text-muted-foreground">
                        {formData.preview_text || 'Preview text appears here...'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preview">Preview Text</Label>
                  <Input
                    id="preview"
                    placeholder="A brief preview of your email content..."
                    value={formData.preview_text}
                    onChange={(e) => setFormData(prev => ({ ...prev, preview_text: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    This appears after the subject in some email clients
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reply_to">Reply-To Email</Label>
                  <Input
                    id="reply_to"
                    type="email"
                    placeholder="contact@example.org"
                    value={formData.reply_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, reply_to: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Audience */}
          {currentStep === 1 && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Audience</CardTitle>
                    <CardDescription>Choose who will receive this campaign</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <RadioGroup
                      value={audienceData.audience_type}
                      onValueChange={(value) => {
                        setAudienceData(prev => ({ ...prev, audience_type: value }));
                        setRecipientCount(null);
                      }}
                    >
                      {AUDIENCE_OPTIONS.map((option) => (
                        <div
                          key={option.value}
                          className={cn(
                            "flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors",
                            audienceData.audience_type === option.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor={option.value} className="font-medium cursor-pointer">
                              {option.label}
                            </Label>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>

                    {/* Tag Selection */}
                    {audienceData.audience_type === 'tag' && (
                      <div className="space-y-3 p-4 border rounded-lg">
                        <Label>Filter by Tags</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter tag name..."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                          />
                          <Button type="button" onClick={handleAddTag}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {audienceData.tag_filter.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {audienceData.tag_filter.map((tag) => (
                              <Badge key={tag} variant="secondary" className="gap-1">
                                {tag}
                                <button onClick={() => handleRemoveTag(tag)}>
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Subscribers must have all specified tags
                        </p>
                      </div>
                    )}

                    {/* Title Filter */}
                    {audienceData.audience_type === 'title' && (
                      <div className="space-y-3 p-4 border rounded-lg">
                        <Label>Filter by Title</Label>
                        <div className="grid gap-2 max-h-[250px] overflow-y-auto">
                          {availableTitles.map((title) => (
                            <label
                              key={title}
                              className={cn(
                                "flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-colors text-sm",
                                titleFilter.includes(title)
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={titleFilter.includes(title)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTitleFilter(prev => [...prev, title]);
                                  } else {
                                    setTitleFilter(prev => prev.filter(t => t !== title));
                                  }
                                }}
                                className="rounded"
                              />
                              {title}
                            </label>
                          ))}
                        </div>
                        {titleFilter.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {titleFilter.map((title) => (
                              <Badge key={title} variant="secondary" className="gap-1">
                                {title}
                                <button onClick={() => setTitleFilter(prev => prev.filter(t => t !== title))}>
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Recipients matching any selected title will be included
                        </p>
                      </div>
                    )}

                    {/* Manual Selection */}
                    {audienceData.audience_type === 'manual' && (
                      <div className="space-y-3 p-4 border rounded-lg">
                        <Label>Select Specific People</Label>
                        <ManualRecipientSelector
                          selectedIds={manualRecipientIds}
                          onSelectionChange={setManualRecipientIds}
                          onRecipientCountChange={handleManualRecipientCountChange}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Audience Preview Panel */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Audience Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-6 bg-muted rounded-lg">
                      {getAudienceCount.isPending ? (
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      ) : (
                        <>
                          <div className="text-3xl font-bold">
                            {recipientCount !== null ? recipientCount.toLocaleString() : '—'}
                          </div>
                          <p className="text-sm text-muted-foreground">estimated recipients</p>
                        </>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={refreshAudienceCount}
                      disabled={getAudienceCount.isPending}
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", getAudienceCount.isPending && "animate-spin")} />
                      Refresh Count
                    </Button>

                    {recipientCount === 0 && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <p>No recipients match your criteria. Adjust your audience settings.</p>
                      </div>
                    )}

                    {recipientCount !== null && recipientCount > 0 && recipientCount < 10 && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg text-sm">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <p>Very small audience. Consider broadening your criteria.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 3: Content */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Template Selection */}
              {!contentData.content_html && (
                <Card>
                  <CardHeader>
                    <CardTitle>Choose Your Starting Point</CardTitle>
                    <CardDescription>Start from scratch, use a template, or import from Canva</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TemplateSelectionGrid
                      templates={templates?.map(t => ({
                        id: t.id,
                        name: t.name,
                        description: t.description || undefined,
                        thumbnail_url: t.thumbnail_url || undefined,
                        html_content: t.html_content || undefined,
                        template_type: t.template_type || undefined,
                      })) || []}
                      selectedTemplateId={contentData.selectedTemplateId}
                      onSelect={(template) => {
                        setContentData(prev => ({
                          ...prev,
                          content_html: template.html_content || '',
                          selectedTemplateId: template.id,
                          template_source: 'template',
                        }));
                      }}
                      onStartFromScratch={() => {
                        setContentData(prev => ({
                          ...prev,
                          content_html: getStarterHtml(),
                          template_source: 'custom',
                        }));
                      }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Content Editor */}
              {contentData.content_html && (
                <div className="grid gap-6 lg:grid-cols-5">
                  <div className="lg:col-span-3">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Email Content</CardTitle>
                            <CardDescription>Design your email or edit the HTML directly</CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setContentData(prev => ({ ...prev, content_html: '', selectedTemplateId: '' }))}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Start Over
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <EmailContentEditor
                          htmlContent={contentData.content_html}
                          onHtmlChange={(html) => setContentData(prev => ({ ...prev, content_html: html }))}
                          textContent={contentData.content_text}
                          onTextChange={(text) => setContentData(prev => ({ ...prev, content_text: text }))}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Preview Panel */}
                  <div className="lg:col-span-2">
                    <EmailPreviewPanel
                      htmlContent={contentData.content_html}
                      subjectLine={formData.subject_line}
                      previewText={formData.preview_text}
                      fromName={formData.from_name}
                    />
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Step 4: Review & Send */}
          {currentStep === 3 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Campaign Name</p>
                      <p className="font-medium">{formData.name}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Subject Line</p>
                      <p className="font-medium">{formData.subject_line}</p>
                    </div>
                    {formData.preview_text && (
                      <div>
                        <p className="text-sm text-muted-foreground">Preview Text</p>
                        <p>{formData.preview_text}</p>
                      </div>
                    )}
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">From</p>
                      <p className="font-medium">{formData.from_name || 'Your Organization'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reply-To</p>
                      <p>{formData.reply_to || 'Default email'}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Audience</p>
                      <p className="font-medium">
                        {AUDIENCE_OPTIONS.find(o => o.value === audienceData.audience_type)?.label || 'All subscribers'}
                      </p>
                      {audienceData.audience_type === 'tag' && audienceData.tag_filter.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {audienceData.tag_filter.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Recipients</p>
                      <p className="text-2xl font-bold">
                        {recipientCount !== null ? recipientCount.toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {contentData.content_html ? (
                      <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                        <iframe
                          srcDoc={contentData.content_html}
                          className="w-full h-[350px] bg-white"
                          title="Email Preview"
                        />
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No content to preview
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Send Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Validation warnings */}
                    {recipientCount !== null && recipientCount === 0 && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-destructive">No recipients</p>
                          <p className="text-muted-foreground">Your audience has 0 recipients. Go back to adjust your audience settings.</p>
                        </div>
                      </div>
                    )}

                    {!contentData.content_html.trim() && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-destructive">Missing content</p>
                          <p className="text-muted-foreground">Add email content before sending.</p>
                        </div>
                      </div>
                    )}

                    {!isSynced && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleSyncToMailchimp}
                        disabled={isSyncing}
                      >
                        {isSyncing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Sync to Mailchimp
                      </Button>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => setShowSendDialog(true)}
                      disabled={!canSend()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Now
                    </Button>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Clock className="h-4 w-4 mr-2" />
                          Schedule for Later
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4" align="center">
                        <div className="space-y-4">
                          <Calendar
                            mode="single"
                            selected={scheduleDate}
                            onSelect={setScheduleDate}
                            disabled={(date) => date < new Date()}
                          />
                          <div className="flex items-center gap-2">
                            <Label>Time:</Label>
                            <Input
                              type="time"
                              value={scheduleTime}
                              onChange={(e) => setScheduleTime(e.target.value)}
                              className="w-32"
                            />
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => setShowScheduleDialog(true)}
                            disabled={!scheduleDate || !canSend()}
                          >
                            Confirm Schedule
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <div /> // Spacer
          )}
        </div>

        {/* Send Confirmation Dialog */}
        <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send Campaign Now?</AlertDialogTitle>
              <AlertDialogDescription>
                This will send "{formData.name}" to approximately {recipientCount?.toLocaleString() || 'your'} recipients immediately.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => toast({ title: "Cancelled", description: "Campaign send was cancelled" })}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSend} disabled={isSending || isSyncing}>
                {(isSending || isSyncing) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Send Campaign
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Schedule Confirmation Dialog */}
        <AlertDialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Schedule Campaign?</AlertDialogTitle>
              <AlertDialogDescription>
                This will schedule "{formData.name}" to be sent on{' '}
                {scheduleDate && format(scheduleDate, 'PPP')} at {scheduleTime}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => toast({ title: "Cancelled", description: "Campaign scheduling was cancelled" })}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSchedule} disabled={isScheduling || isSyncing}>
                {(isScheduling || isSyncing) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Schedule Campaign
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
