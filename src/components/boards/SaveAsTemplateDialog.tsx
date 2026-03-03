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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { useSaveAsTemplate } from '@/hooks/useBoardTemplates';

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  boardName: string;
}

const CATEGORIES = [
  { value: 'training', label: 'Training' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'project', label: 'Project' },
  { value: 'general', label: 'General' },
];

export function SaveAsTemplateDialog({
  open,
  onOpenChange,
  boardId,
  boardName,
}: SaveAsTemplateDialogProps) {
  const [name, setName] = useState(`${boardName} Template`);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [includeAssignees, setIncludeAssignees] = useState(false);
  
  const saveTemplate = useSaveAsTemplate();

  const handleSave = async () => {
    await saveTemplate.mutateAsync({
      boardId,
      name,
      description,
      category,
      includeAssignees,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Create a reusable template from this board. The template will include
            all columns, cards, subtasks, and automations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template is for..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="template-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-muted-foreground text-sm">Options</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-assignees"
                checked={includeAssignees}
                onCheckedChange={(checked) => setIncludeAssignees(checked === true)}
              />
              <Label htmlFor="include-assignees" className="text-sm font-normal cursor-pointer">
                Include card assignees
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || saveTemplate.isPending}>
            {saveTemplate.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
