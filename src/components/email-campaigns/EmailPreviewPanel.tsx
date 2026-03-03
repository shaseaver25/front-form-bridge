import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Monitor, Smartphone, Send, Loader2, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailPreviewPanelProps {
  htmlContent: string;
  subjectLine: string;
  previewText?: string;
  fromName?: string;
}

export function EmailPreviewPanel({
  htmlContent,
  subjectLine,
  previewText,
  fromName,
}: EmailPreviewPanelProps) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({ title: 'Please enter an email address', variant: 'destructive' });
      return;
    }

    if (!htmlContent) {
      toast({ title: 'No email content to send', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: {
          to: testEmail,
          subject: `[TEST] ${subjectLine}`,
          html: htmlContent,
          from_name: fromName || 'TailoredU',
        },
      });

      if (error) throw error;

      setSent(true);
      toast({ title: 'Test email sent successfully!' });

      // Reset sent state after 3 seconds
      setTimeout(() => setSent(false), 3000);
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast({
        title: 'Failed to send test email',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Preview</CardTitle>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'desktop' | 'mobile')}>
            <TabsList className="h-8">
              <TabsTrigger value="desktop" className="h-7 px-2">
                <Monitor className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="mobile" className="h-7 px-2">
                <Smartphone className="h-3.5 w-3.5" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Header Preview */}
        <div className="p-3 bg-muted rounded-lg text-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-muted-foreground">From:</span>
            <span className="font-medium">{fromName || 'Your Organization'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Subject:</span>
            <span className="font-medium">{subjectLine || '(No subject)'}</span>
          </div>
          {previewText && (
            <p className="text-muted-foreground mt-1 text-xs truncate">{previewText}</p>
          )}
        </div>

        {/* Email Content Preview */}
        <div
          className={cn(
            "border rounded-lg overflow-hidden bg-white transition-all duration-200",
            viewMode === 'mobile' ? "max-w-[375px] mx-auto" : "w-full"
          )}
        >
          {htmlContent ? (
            <iframe
              srcDoc={htmlContent}
              className={cn(
                "w-full bg-white",
                viewMode === 'mobile' ? "h-[500px]" : "h-[400px]"
              )}
              title="Email Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <p>Add content to see a preview</p>
            </div>
          )}
        </div>

        {/* Merge Tags Preview */}
        {htmlContent && htmlContent.includes('{{') && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground">Merge tags used:</span>
            {Array.from(htmlContent.matchAll(/\{\{(\w+)\}\}/g)).map(([tag], i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Send Test Email */}
        <div className="pt-4 border-t">
          <Label className="text-sm font-medium mb-2 block">Send Test Email</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email address..."
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={sendTestEmail}
              disabled={sending || !htmlContent}
              variant={sent ? 'outline' : 'default'}
              className={cn(sent && 'text-green-600 border-green-600')}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : sent ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Sends a test email to verify your design looks correct. Test emails don't affect campaign stats.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
