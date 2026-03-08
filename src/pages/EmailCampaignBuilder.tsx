import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Send, 
  Save, 
  Eye, 
  Users,
  Loader2,
  Clock,
  FileCode,
  Plus,
  Filter,
  UserPlus
} from 'lucide-react';
import { CustomAudienceBuilder, SegmentCriteria } from '@/components/email-campaigns/CustomAudienceBuilder';
import { ManualRecipientSelector } from '@/components/email-campaigns/ManualRecipientSelector';
import { 
  useEmailTemplates, 
  useEmailTemplate,
  useCreateCampaign,
  useSendCampaign,
  EmailTemplate 
} from '@/hooks/useEmailTemplates';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AddTemplateDialog } from '@/components/email-templates/AddTemplateDialog';

type Step = 'template' | 'configure' | 'recipients' | 'schedule';

const steps: { key: Step; label: string }[] = [
  { key: 'template', label: 'Select Template' },
  { key: 'configure', label: 'Configure' },
  { key: 'recipients', label: 'Recipients' },
  { key: 'schedule', label: 'Schedule & Send' },
];

const prebuiltSegments = [
  { id: 'all_subscribed', label: 'All Active Subscribers', description: 'All contacts with active email subscriptions' },
  { id: 'major_donors', label: 'Top Clients ($1,000+)', description: 'Contacts with total billing over $1,000' },
  { id: 'lybunt', label: 'Returning Clients', description: 'Clients active last year but not this year' },
  { id: 'sybunt', label: 'Past Clients', description: 'Clients active in prior years but not recently' },
  { id: 'monthly_donors', label: 'Recurring Clients', description: 'Contacts with active recurring engagements' },
  { id: 'new_donors', label: 'New Clients (Last 30 Days)', description: 'First-time clients from the past month' },
];

export default function EmailCampaignBuilder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const templateIdParam = searchParams.get('templateId');

  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(templateIdParam);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  
  // Audience type: 'segment' | 'custom' | 'manual'
  const [audienceType, setAudienceType] = useState<'segment' | 'custom' | 'manual'>('segment');
  const [customCriteria, setCustomCriteria] = useState<SegmentCriteria>({});
  const [manualRecipientIds, setManualRecipientIds] = useState<string[]>([]);
  const [customRecipientCount, setCustomRecipientCount] = useState(0);
  
  const [campaignData, setCampaignData] = useState({
    name: '',
    subject_line: '',
    preview_text: '',
    segment_type: 'all_subscribed',
    scheduled_at: '',
    send_now: true,
  });

  const { data: templates, isLoading: templatesLoading } = useEmailTemplates();
  const { data: selectedTemplate } = useEmailTemplate(selectedTemplateId || undefined);
  const createCampaign = useCreateCampaign();
  const sendCampaign = useSendCampaign();

  // Get recipient count based on segment (only for prebuilt segments)
  const { data: segmentRecipientCount } = useQuery({
    queryKey: ['recipient-count', campaignData.segment_type],
    queryFn: async () => {
      let query = supabase
        .from('constituents')
        .select('id', { count: 'exact', head: true })
        .not('primary_email', 'is', null)
        .eq('do_not_email', false);

      if (campaignData.segment_type === 'major_donors') {
        query = query.gte('total_lifetime_giving', 1000);
      } else if (campaignData.segment_type === 'new_donors') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.gte('first_gift_date', thirtyDaysAgo.toISOString().split('T')[0]);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled: audienceType === 'segment',
  });

  // Compute actual recipient count based on audience type
  const recipientCount = audienceType === 'segment' 
    ? segmentRecipientCount 
    : audienceType === 'custom' 
      ? customRecipientCount 
      : manualRecipientIds.length;

  const handleCustomRecipientCountChange = useCallback((count: number) => {
    setCustomRecipientCount(count);
  }, []);

  useEffect(() => {
    if (selectedTemplate && !campaignData.subject_line) {
      setCampaignData(prev => ({
        ...prev,
        subject_line: selectedTemplate.subject_line || '',
        preview_text: selectedTemplate.preview_text || '',
      }));
    }
  }, [selectedTemplate]);

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);
  const canGoNext = () => {
    switch (currentStep) {
      case 'template': return !!selectedTemplateId;
      case 'configure': return !!campaignData.name && !!campaignData.subject_line;
      case 'recipients': 
        if (audienceType === 'segment') return !!campaignData.segment_type;
        if (audienceType === 'custom') return customRecipientCount > 0;
        if (audienceType === 'manual') return manualRecipientIds.length > 0;
        return false;
      case 'schedule': return campaignData.send_now || !!campaignData.scheduled_at;
      default: return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await createCampaign.mutateAsync({
        name: campaignData.name,
        template_id: selectedTemplateId,
        subject_line: campaignData.subject_line,
        preview_text: campaignData.preview_text,
        segment_type: audienceType === 'segment' ? campaignData.segment_type : audienceType,
        segment_criteria: audienceType === 'custom' ? (customCriteria as Record<string, unknown>) : null,
        constituent_list: audienceType === 'manual' ? manualRecipientIds : null,
        status: 'draft',
        total_recipients: recipientCount || 0,
      });
      navigate('/email-campaigns');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSend = async () => {
    try {
      const campaign = await createCampaign.mutateAsync({
        name: campaignData.name,
        template_id: selectedTemplateId,
        subject_line: campaignData.subject_line,
        preview_text: campaignData.preview_text,
        segment_type: audienceType === 'segment' ? campaignData.segment_type : audienceType,
        segment_criteria: audienceType === 'custom' ? (customCriteria as Record<string, unknown>) : null,
        constituent_list: audienceType === 'manual' ? manualRecipientIds : null,
        status: campaignData.send_now ? 'sending' : 'scheduled',
        scheduled_at: campaignData.send_now ? null : campaignData.scheduled_at,
        total_recipients: recipientCount || 0,
      });

      if (campaignData.send_now && campaign.id) {
        await sendCampaign.mutateAsync(campaign.id);
      }
      
      navigate('/email-campaigns');
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/email-campaigns')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Campaign</h1>
            <p className="text-muted-foreground">Send targeted emails to your contacts</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <button
                onClick={() => index <= currentStepIndex && setCurrentStep(step.key)}
                className={`flex items-center gap-2 ${index <= currentStepIndex ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                disabled={index > currentStepIndex}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep === step.key 
                    ? 'bg-primary text-primary-foreground' 
                    : index < currentStepIndex 
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`hidden sm:inline text-sm font-medium
                  ${currentStep === step.key ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className={`w-12 sm:w-24 h-0.5 mx-2 
                  ${index < currentStepIndex ? 'bg-green-500' : 'bg-muted'}`} 
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {currentStep === 'template' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Select a Template</h2>
                  <Button onClick={() => setShowAddTemplate(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Template
                  </Button>
                </div>
                {templatesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates?.map((template) => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-all hover:border-primary
                          ${selectedTemplateId === template.id ? 'border-primary ring-2 ring-primary/20' : ''}`}
                        onClick={() => setSelectedTemplateId(template.id)}
                      >
                        <div className="aspect-[4/3] bg-muted relative overflow-hidden rounded-t-lg">
                          {template.thumbnail_url ? (
                            <img
                              src={template.thumbnail_url}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileCode className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                          )}
                          {selectedTemplateId === template.id && (
                            <div className="absolute top-2 right-2">
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <Check className="h-4 w-4 text-primary-foreground" />
                              </div>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <p className="font-medium truncate">{template.name}</p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {template.template_type.replace(/_/g, ' ')}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentStep === 'configure' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">Configure Campaign</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., December Newsletter 2025"
                    value={campaignData.name}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line *</Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Thank you for your gift, {{first_name}}!"
                    value={campaignData.subject_line}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, subject_line: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {'{{first_name}}'}, {'{{last_name}}'}, etc. for personalization
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preview">Preview Text</Label>
                  <Textarea
                    id="preview"
                    placeholder="e.g., Your {{gift_amount}} donation to {{fund_designation}}..."
                    value={campaignData.preview_text}
                    onChange={(e) => setCampaignData(prev => ({ ...prev, preview_text: e.target.value }))}
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    This text appears in email previews (after the subject line)
                  </p>
                </div>
              </div>
            )}

            {currentStep === 'recipients' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Select Recipients</h2>
                  <Badge variant="outline" className="text-base">
                    <Users className="h-4 w-4 mr-1" />
                    {recipientCount?.toLocaleString() || 0} recipients
                  </Badge>
                </div>

                {/* Audience Type Selection */}
                <RadioGroup
                  value={audienceType}
                  onValueChange={(value) => setAudienceType(value as 'segment' | 'custom' | 'manual')}
                  className="grid grid-cols-3 gap-3"
                >
                  <Label
                    htmlFor="audience-segment"
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-all ${
                      audienceType === 'segment' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
                    }`}
                  >
                    <RadioGroupItem value="segment" id="audience-segment" className="sr-only" />
                    <Users className="h-5 w-5" />
                    <span className="text-sm font-medium">Pre-built Segments</span>
                  </Label>
                  <Label
                    htmlFor="audience-custom"
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-all ${
                      audienceType === 'custom' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
                    }`}
                  >
                    <RadioGroupItem value="custom" id="audience-custom" className="sr-only" />
                    <Filter className="h-5 w-5" />
                    <span className="text-sm font-medium">Custom Search</span>
                  </Label>
                  <Label
                    htmlFor="audience-manual"
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-all ${
                      audienceType === 'manual' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
                    }`}
                  >
                    <RadioGroupItem value="manual" id="audience-manual" className="sr-only" />
                    <UserPlus className="h-5 w-5" />
                    <span className="text-sm font-medium">Select People</span>
                  </Label>
                </RadioGroup>

                <Separator />

                {/* Prebuilt Segments */}
                {audienceType === 'segment' && (
                  <div className="space-y-3">
                    {prebuiltSegments.map((segment) => (
                      <Card
                        key={segment.id}
                        className={`cursor-pointer transition-all hover:border-primary
                          ${campaignData.segment_type === segment.id ? 'border-primary ring-2 ring-primary/20' : ''}`}
                        onClick={() => setCampaignData(prev => ({ ...prev, segment_type: segment.id }))}
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{segment.label}</p>
                            <p className="text-sm text-muted-foreground">{segment.description}</p>
                          </div>
                          {campaignData.segment_type === segment.id && (
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Custom Search & Filter */}
                {audienceType === 'custom' && (
                  <CustomAudienceBuilder
                    criteria={customCriteria}
                    onCriteriaChange={setCustomCriteria}
                    onRecipientCountChange={handleCustomRecipientCountChange}
                  />
                )}

                {/* Manual Selection */}
                {audienceType === 'manual' && (
                  <ManualRecipientSelector
                    selectedIds={manualRecipientIds}
                    onSelectionChange={setManualRecipientIds}
                    onRecipientCountChange={handleCustomRecipientCountChange}
                  />
                )}
              </div>
            )}

            {currentStep === 'schedule' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">Schedule & Send</h2>

                {/* Summary */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Template:</span>
                      <span className="font-medium">{selectedTemplate?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subject:</span>
                      <span className="font-medium">{campaignData.subject_line}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Recipients:</span>
                      <span className="font-medium">{recipientCount?.toLocaleString()} contacts</span>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                <RadioGroup
                  value={campaignData.send_now ? 'now' : 'schedule'}
                  onValueChange={(value) => setCampaignData(prev => ({ 
                    ...prev, 
                    send_now: value === 'now' 
                  }))}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="now" id="send-now" />
                    <Label htmlFor="send-now" className="flex items-center gap-2 cursor-pointer">
                      <Send className="h-4 w-4" />
                      Send Now
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="schedule" id="schedule" />
                    <Label htmlFor="schedule" className="flex items-center gap-2 cursor-pointer">
                      <Clock className="h-4 w-4" />
                      Schedule for Later
                    </Label>
                  </div>
                </RadioGroup>

                {!campaignData.send_now && (
                  <div className="space-y-2 pl-7 animate-in fade-in">
                    <Label htmlFor="scheduled-date">Schedule Date & Time</Label>
                    <Input
                      id="scheduled-date"
                      type="datetime-local"
                      value={campaignData.scheduled_at}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <div className="flex gap-2">
            {currentStep === 'schedule' && (
              <Button variant="outline" onClick={handleSaveDraft}>
                <Save className="h-4 w-4 mr-1" />
                Save as Draft
              </Button>
            )}
            
            {currentStep === 'schedule' ? (
              <Button 
                onClick={() => setShowSendConfirm(true)}
                disabled={!canGoNext()}
              >
                {campaignData.send_now ? (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Send Campaign
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-1" />
                    Schedule Campaign
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canGoNext()}>
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Send Confirmation */}
      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {campaignData.send_now ? 'Send Campaign Now?' : 'Schedule Campaign?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {campaignData.send_now 
                ? `This will immediately send emails to ${recipientCount?.toLocaleString()} recipients.`
                : `This will schedule emails to be sent to ${recipientCount?.toLocaleString()} recipients at the specified time.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>
              {campaignData.send_now ? 'Send Now' : 'Schedule'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddTemplateDialog 
        open={showAddTemplate} 
        onOpenChange={setShowAddTemplate} 
      />
    </Layout>
  );
}
