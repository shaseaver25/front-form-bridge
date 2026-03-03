import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Users, Check } from 'lucide-react';
import { useBoardTemplates, useBulkCreateFromTemplate, BoardTemplate } from '@/hooks/useBoardTemplates';

interface BulkCreateBoardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkCreateBoardsDialog({
  open,
  onOpenChange,
}: BulkCreateBoardsDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [namesText, setNamesText] = useState('');
  
  const { data: templates, isLoading: templatesLoading } = useBoardTemplates('training');
  const bulkCreate = useBulkCreateFromTemplate();

  const names = namesText
    .split('\n')
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  const handleCreate = async () => {
    if (!selectedTemplateId || names.length === 0) return;

    await bulkCreate.mutateAsync({
      templateId: selectedTemplateId,
      names,
    });
    onOpenChange(false);
    setSelectedTemplateId('');
    setNamesText('');
  };

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk Create Training Boards
          </DialogTitle>
          <DialogDescription>
            Create multiple training boards at once from a template.
            Each board will be named "[Name]'s Training".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select Training Template</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {templatesLoading ? (
                  <div className="p-2 text-center text-muted-foreground">
                    Loading...
                  </div>
                ) : templates && templates.length > 0 ? (
                  templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-muted-foreground">
                    No training templates available
                  </div>
                )}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <p className="text-xs text-muted-foreground">
                {selectedTemplate.description || 'No description'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="names-list">
              Names (one per line)
            </Label>
            <Textarea
              id="names-list"
              value={namesText}
              onChange={(e) => setNamesText(e.target.value)}
              placeholder="John Smith&#10;Jane Doe&#10;Bob Johnson&#10;..."
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Paste a list of names, one per line. Each name will get their own training board.
            </p>
          </div>

          {names.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Preview ({names.length} boards)</Label>
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-1">
                  {names.map((name, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>{name}'s Training</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedTemplateId || names.length === 0 || bulkCreate.isPending}
          >
            {bulkCreate.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating {names.length} boards...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Create {names.length} Boards
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
