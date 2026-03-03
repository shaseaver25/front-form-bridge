import { useState, useMemo } from 'react';
import DOMPurify from 'dompurify';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Send, Settings } from 'lucide-react';
import { EmailTemplate, useMergeFields, useSendTestEmail } from '@/hooks/useEmailTemplates';
import { toast } from 'sonner';

interface TemplatePreviewDialogProps {
  template: EmailTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Sample data for preview
const defaultSampleData: Record<string, string> = {
  first_name: 'Sarah',
  last_name: 'Johnson',
  full_name: 'Sarah Johnson',
  email: 'sarah@example.com',
  gift_amount: '$100',
  gift_date: 'December 10, 2025',
  fund_designation: 'General Fund',
  total_giving: '$1,500',
  org_name: 'createMPLS',
  current_year: '2025',
};

export function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
}: TemplatePreviewDialogProps) {
  const [sampleData, setSampleData] = useState(defaultSampleData);
  const [showEditData, setShowEditData] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const { data: mergeFields } = useMergeFields();
  const sendTestEmail = useSendTestEmail();

  // Replace merge fields in content
  const replaceMergeFields = (content: string) => {
    let result = content;
    Object.entries(sampleData).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  };

  const previewSubject = template.subject_line 
    ? replaceMergeFields(template.subject_line)
    : 'No subject line set';

  const previewText = template.preview_text
    ? replaceMergeFields(template.preview_text)
    : '';

  const previewHtml = useMemo(() => {
    const rawHtml = template.html_content
      ? replaceMergeFields(template.html_content)
      : `<div style="padding: 20px; text-align: center; color: #666;">
          <p>No HTML content available</p>
          <p>Click "Export HTML" in Canva to generate email content</p>
        </div>`;
    
    // Sanitize HTML to prevent XSS attacks
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['p', 'div', 'span', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'br', 'strong', 'em', 'b', 'i', 'u', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'caption', 'colgroup', 'col', 'blockquote', 'pre', 'code', 'hr', 'center', 'font'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class', 'id', 'width', 'height', 'border', 'cellpadding', 'cellspacing', 'align', 'valign', 'bgcolor', 'color', 'size', 'face', 'target'],
    });
  }, [template.html_content, sampleData]);

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }
    await sendTestEmail.mutateAsync({ 
      templateId: template.id, 
      toEmail: testEmail 
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview: {template.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email metadata */}
          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="font-medium w-24">Subject:</span>
              <span>{previewSubject}</span>
            </div>
            {previewText && (
              <div className="flex">
                <span className="font-medium w-24">Preview text:</span>
                <span className="text-muted-foreground">{previewText}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* HTML Preview */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <div 
              className="p-4 min-h-[300px]"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>

          <Separator />

          {/* Sample Data */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Sample Data Used:</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditData(!showEditData)}
              >
                <Settings className="h-4 w-4 mr-1" />
                {showEditData ? 'Hide' : 'Edit'} Sample Data
              </Button>
            </div>
            
            {showEditData ? (
              <div className="grid grid-cols-2 gap-3 p-4 bg-muted rounded-lg">
                {Object.entries(sampleData).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{key}</Label>
                    <Input
                      value={value}
                      onChange={(e) => setSampleData(prev => ({
                        ...prev,
                        [key]: e.target.value
                      }))}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {Object.entries(sampleData).map(([key, value]) => (
                  <span key={key}>
                    • {key}: <span className="text-foreground">{value}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Send Test Email */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="test-email" className="text-sm">Send Test Email</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleSendTest}
              disabled={sendTestEmail.isPending}
            >
              <Send className="h-4 w-4 mr-1" />
              {sendTestEmail.isPending ? 'Sending...' : 'Send Test'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
