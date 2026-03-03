import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, LayoutTemplate, Columns, FileText, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useBoardTemplates, useCreateBoardFromTemplate, BoardTemplate } from '@/hooks/useBoardTemplates';

interface CreateFromTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFromTemplateDialog({
  open,
  onOpenChange,
}: CreateFromTemplateDialogProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [category, setCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<BoardTemplate | null>(null);
  const [boardName, setBoardName] = useState('');

  const { data: templates, isLoading } = useBoardTemplates(category === 'all' ? undefined : category);
  const createFromTemplate = useCreateBoardFromTemplate();

  const handleSelectTemplate = (template: BoardTemplate) => {
    setSelectedTemplate(template);
    setBoardName(template.name.replace(' Template', ''));
    setStep('configure');
  };

  const handleCreate = async () => {
    if (!selectedTemplate) return;

    const result = await createFromTemplate.mutateAsync({
      templateId: selectedTemplate.id,
      boardName,
    });
    onOpenChange(false);
    navigate(`/projects/${result.id}`);
  };

  const handleClose = () => {
    setStep('select');
    setSelectedTemplate(null);
    setBoardName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5" />
            {step === 'select' ? 'Choose a Template' : 'Configure Board'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select'
              ? 'Select a template to create your new board'
              : 'Customize your board before creating'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <>
            <Tabs value={category} onValueChange={setCategory} className="w-full">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="training">Training</TabsTrigger>
                <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
                <TabsTrigger value="project">Project</TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
              </TabsList>
            </Tabs>

            <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] pr-4">
              {isLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : templates && templates.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {templates.map((template) => {
                    const templateData = template.template_data as {
                      columns?: Array<{ title: string }>;
                      cards?: Array<{ headline: string }>;
                    };
                    return (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          {template.description && (
                            <CardDescription className="line-clamp-2 text-xs">
                              {template.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Columns className="w-3 h-3" />
                              <span>{templateData?.columns?.length || 0} columns</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span>{templateData?.cards?.length || 0} cards</span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="mt-2 text-xs capitalize">
                            {template.category}
                          </Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <LayoutTemplate className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-1">No templates found</h3>
                  <p className="text-sm text-muted-foreground">
                    {category === 'all'
                      ? 'Create templates by saving existing boards'
                      : `No ${category} templates available`}
                  </p>
                </div>
              )}
            </ScrollArea>
          </>
        )}

        {step === 'configure' && selectedTemplate && (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="capitalize">
                  {selectedTemplate.category}
                </Badge>
                <span className="font-medium">{selectedTemplate.name}</span>
              </div>
              {selectedTemplate.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedTemplate.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="board-name">Board Name</Label>
              <Input
                id="board-name"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="Enter board name"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Template Preview</Label>
              <div className="flex flex-wrap gap-2">
                {(selectedTemplate.template_data as { columns?: Array<{ title: string }> })?.columns?.map((col, i) => (
                  <Badge key={i} variant="outline">
                    {col.title}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'configure' && (
            <Button variant="ghost" onClick={() => setStep('select')} className="mr-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === 'configure' && (
            <Button
              onClick={handleCreate}
              disabled={!boardName.trim() || createFromTemplate.isPending}
            >
              {createFromTemplate.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Board
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
