import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Save, Send, Clock, Users, FileText, Eye, CalendarIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  useMailchimpCampaign,
  useCreateMailchimpCampaign,
  useUpdateMailchimpCampaign,
  useSyncToMailchimp,
  useSendMailchimpCampaign,
  useScheduleMailchimpCampaign,
  useMailchimpConfig,
} from '@/hooks/useMailchimpCampaigns';
import { useEmailTemplates } from '@/hooks/useEmailTemplates';

const audienceOptions = [
  { value: 'all', label: 'All Subscribers', description: 'Send to your entire audience' },
  { value: 'tag', label: 'By Tag', description: 'Target subscribers with specific tags' },
  { value: 'segment', label: 'Saved Segment', description: 'Use a pre-built segment' },
  { value: 'donors', label: 'Active Donors', description: 'Subscribers who have donated' },
  { value: 'new', label: 'New Subscribers', description: 'Joined in the last 30 days' },
];

export default function MailchimpCampaignBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { data: existingCampaign, isLoading: loadingCampaign } = useMailchimpCampaign(id);
  const { data: templates } = useEmailTemplates();
  const { data: mailchimpConfig } = useMailchimpConfig();
  const createCampaign = useCreateMailchimpCampaign();
  const updateCampaign = useUpdateMailchimpCampaign();
  const syncToMailchimp = useSyncToMailchimp();
  const sendCampaign = useSendMailchimpCampaign();
  const scheduleCampaign = useScheduleMailchimpCampaign();

  const [activeTab, setActiveTab] = useState('content');
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('09:00');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    subject_line: '',
    preview_text: '',
    from_name: '',
    reply_to: '',
    content_html: '',
    content_text: '',
    template_source: 'custom',
  });

  const [audienceData, setAudienceData] = useState({
    audience_type: 'all',
    tag_filter: [] as string[],
    segment_id: '',
  });

  // Load existing campaign data
  useEffect(() => {
    if (existingCampaign) {
      setFormData({
        name: existingCampaign.name || '',
        subject_line: existingCampaign.subject_line || '',
        preview_text: existingCampaign.preview_text || '',
        from_name: existingCampaign.from_name || '',
        reply_to: existingCampaign.reply_to || '',
        content_html: existingCampaign.content_html || '',
        content_text: existingCampaign.content_text || '',
        template_source: existingCampaign.template_source || 'custom',
      });

      const audience = existingCampaign.email_campaign_audiences?.[0];
      if (audience) {
        setAudienceData({
          audience_type: audience.audience_type || 'all',
          tag_filter: audience.tag_filter || [],
          segment_id: audience.segment_id || '',
        });
      }
    }
  }, [existingCampaign]);

  const handleSave = async () => {
    if (isEditing && id) {
      await updateCampaign.mutateAsync({
        id,
        ...formData,
        audience: audienceData,
      });
    } else {
      const result = await createCampaign.mutateAsync({
        ...formData,
        audience: audienceData,
      });
      navigate(`/email-campaigns/${result.id}`);
    }
  };

  const handleSyncToMailchimp = async () => {
    if (!id) return;
    await syncToMailchimp.mutateAsync(id);
  };

  const handleSend = async () => {
    if (!id) return;
    
    // First sync to Mailchimp if not already synced
    if (!existingCampaign?.mailchimp_campaign_id) {
      await syncToMailchimp.mutateAsync(id);
    }
    
    await sendCampaign.mutateAsync(id);
    setShowSendDialog(false);
    navigate('/email-campaigns');
  };

  const handleSchedule = async () => {
    if (!id || !scheduleDate) return;

    // Combine date and time
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const scheduledDateTime = new Date(scheduleDate);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    // First sync to Mailchimp if not already synced
    if (!existingCampaign?.mailchimp_campaign_id) {
      await syncToMailchimp.mutateAsync(id);
    }

    await scheduleCampaign.mutateAsync({
      campaignId: id,
      scheduleTime: scheduledDateTime.toISOString(),
    });
    
    setShowScheduleDialog(false);
    navigate('/email-campaigns');
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        content_html: template.html_content || '',
        content_text: '',
        template_source: template.template_type || 'custom',
      }));
    }
  };

  const isSaving = createCampaign.isPending || updateCampaign.isPending;
  const isSyncing = syncToMailchimp.isPending;
  const isSending = sendCampaign.isPending;
  const isScheduling = scheduleCampaign.isPending;

  const canSend = formData.name && formData.subject_line && formData.content_html;
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
            Connect your Mailchimp account to create and send email campaigns.
          </p>
          <Button onClick={() => navigate('/integrations/mailchimp')}>
            Connect Mailchimp
          </Button>
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/email-campaigns')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isEditing ? 'Edit Campaign' : 'New Campaign'}</h1>
              <p className="text-muted-foreground">
                {isEditing ? 'Update your email campaign' : 'Create a new email campaign'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSynced && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                Synced to Mailchimp
              </Badge>
            )}

            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Draft
            </Button>

            {isEditing && (
              <>
                <Button variant="outline" onClick={handleSyncToMailchimp} disabled={isSyncing || !canSend}>
                  {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isSynced ? 'Re-sync' : 'Sync to Mailchimp'}
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" disabled={!canSend}>
                      <Clock className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="end">
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
                        disabled={!scheduleDate}
                      >
                        Schedule Campaign
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button onClick={() => setShowSendDialog(true)} disabled={!canSend}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Now
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Campaign Status */}
        {existingCampaign && existingCampaign.status !== 'draft' && (
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-4">
                <Badge variant={existingCampaign.status === 'sent' ? 'default' : 'secondary'}>
                  {existingCampaign.status}
                </Badge>
                {existingCampaign.sent_at && (
                  <span className="text-sm text-muted-foreground">
                    Sent on {format(new Date(existingCampaign.sent_at), 'PPp')}
                  </span>
                )}
                {existingCampaign.scheduled_at && existingCampaign.status === 'scheduled' && (
                  <span className="text-sm text-muted-foreground">
                    Scheduled for {format(new Date(existingCampaign.scheduled_at), 'PPp')}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="content" className="gap-2">
              <FileText className="h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="audience" className="gap-2">
              <Users className="h-4 w-4" />
              Audience
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
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
                          placeholder="createMPLS"
                          value={formData.from_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, from_name: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject Line *</Label>
                      <Input
                        id="subject"
                        placeholder="Your Monthly Update"
                        value={formData.subject_line}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject_line: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preview">Preview Text</Label>
                      <Input
                        id="preview"
                        placeholder="A brief preview of your email content..."
                        value={formData.preview_text}
                        onChange={(e) => setFormData(prev => ({ ...prev, preview_text: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">Shown in email clients alongside the subject line</p>
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

                <Card>
                  <CardHeader>
                    <CardTitle>Email Content</CardTitle>
                    <CardDescription>
                      Paste your HTML email content or use a template
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="content_html">HTML Content *</Label>
                      <Textarea
                        id="content_html"
                        placeholder="<html>...</html>"
                        value={formData.content_html}
                        onChange={(e) => setFormData(prev => ({ ...prev, content_html: e.target.value }))}
                        className="min-h-[300px] font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content_text">Plain Text Version</Label>
                      <Textarea
                        id="content_text"
                        placeholder="Plain text fallback for email clients that don't support HTML..."
                        value={formData.content_text}
                        onChange={(e) => setFormData(prev => ({ ...prev, content_text: e.target.value }))}
                        className="min-h-[150px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Use Template</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates?.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {templates?.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        No templates available. Create one in Email Templates.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Content Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={formData.template_source}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, template_source: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom HTML</SelectItem>
                        <SelectItem value="canva">Canva Import</SelectItem>
                        <SelectItem value="mailchimp">Mailchimp Template</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audience" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Target Audience</CardTitle>
                <CardDescription>
                  Choose who will receive this campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {audienceOptions.map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-colors",
                        audienceData.audience_type === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setAudienceData(prev => ({ ...prev, audience_type: option.value }))}
                    >
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  ))}
                </div>

                {audienceData.audience_type === 'tag' && (
                  <div className="space-y-2">
                    <Label>Filter by Tags</Label>
                    <Input
                      placeholder="Enter tags separated by commas"
                      value={audienceData.tag_filter.join(', ')}
                      onChange={(e) => setAudienceData(prev => ({
                        ...prev,
                        tag_filter: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Subscribers must have all specified tags
                    </p>
                  </div>
                )}

                {existingCampaign?.email_campaign_audiences?.[0]?.recipient_count && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {existingCampaign.email_campaign_audiences[0].recipient_count.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Estimated recipients</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
                <CardDescription>
                  Preview how your email will appear to recipients
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formData.content_html ? (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted p-3 border-b">
                      <div className="text-sm">
                        <strong>From:</strong> {formData.from_name || 'Your Organization'}
                      </div>
                      <div className="text-sm">
                        <strong>Subject:</strong> {formData.subject_line || '(No subject)'}
                      </div>
                      {formData.preview_text && (
                        <div className="text-sm text-muted-foreground">
                          {formData.preview_text}
                        </div>
                      )}
                    </div>
                    <iframe
                      srcDoc={formData.content_html}
                      className="w-full h-[600px] bg-white"
                      title="Email Preview"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Add HTML content to see a preview
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Send Confirmation Dialog */}
        <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send Campaign Now?</AlertDialogTitle>
              <AlertDialogDescription>
                This will send "{formData.name}" to your selected audience immediately.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
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
              <AlertDialogCancel>Cancel</AlertDialogCancel>
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
