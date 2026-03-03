import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Code, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  html_content?: string;
  template_type?: string;
  category?: string;
}

interface TemplateSelectionGridProps {
  templates: Template[];
  selectedTemplateId?: string;
  onSelect: (template: Template) => void;
  onStartFromScratch: () => void;
  loading?: boolean;
}

export function TemplateSelectionGrid({
  templates,
  selectedTemplateId,
  onSelect,
  onStartFromScratch,
  loading,
}: TemplateSelectionGridProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="aspect-video rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Starter Options */}
      <div>
        <h4 className="text-sm font-medium mb-3">Start Fresh</h4>
        <div className="grid grid-cols-1 gap-4">
          <Card
            className={cn(
              "cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
              selectedTemplateId === 'scratch' && "ring-2 ring-primary"
            )}
            onClick={onStartFromScratch}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Code className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">Start from Scratch</p>
                <p className="text-xs text-muted-foreground">Begin with a blank template</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Saved Templates */}
      {templates.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Choose from Templates</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={cn(
                  "cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 overflow-hidden",
                  selectedTemplateId === template.id && "ring-2 ring-primary"
                )}
                onClick={() => onSelect(template)}
              >
                <CardContent className="p-0">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {template.thumbnail_url ? (
                      <img
                        src={template.thumbnail_url}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Selected indicator */}
                    {selectedTemplateId === template.id && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-1.5">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}

                    {/* Category badge */}
                    {template.category && (
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2 text-xs"
                      >
                        {template.category}
                      </Badge>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="font-medium text-sm truncate">{template.name}</p>
                    {template.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {template.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No saved templates yet</p>
          <p className="text-xs">Create your first template in Email Templates</p>
        </div>
      )}
    </div>
  );
}
