import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useCreateTemplate } from '@/hooks/useEmailTemplates';

interface AddTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const templateTypes = [
  { value: 'donor_thank_you', label: 'Donor Thank You' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'event_invitation', label: 'Event Invitation' },
  { value: 'appeal', label: 'Appeal' },
  { value: 'lapsed_donor', label: 'Lapsed Donor' },
  { value: 'welcome_series', label: 'Welcome Series' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'custom', label: 'Custom' },
];

export function AddTemplateDialog({ open, onOpenChange }: AddTemplateDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    template_type: '',
    description: '',
    subject_line: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const createTemplate = useCreateTemplate();

  const handleCreate = async () => {
    if (!formData.name || !formData.template_type) return;

    setIsLoading(true);
    try {
      await createTemplate.mutateAsync({
        name: formData.name,
        template_type: formData.template_type,
        description: formData.description || null,
        subject_line: formData.subject_line || null,
      });

      onOpenChange(false);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      template_type: '',
      description: '',
      subject_line: '',
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Template</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4 py-2">
            {/* Template Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Donor Thank You - Holiday 2025"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Template Type *</Label>
                <Select
                  value={formData.template_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, template_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this template..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Default Subject Line</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Thank you for your gift, {{first_name}}!"
                  value={formData.subject_line}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject_line: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Use {'{{field_name}}'} for personalization
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleCreate}
            disabled={!formData.name || !formData.template_type || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Template'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
