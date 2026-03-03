import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  ExternalLink, 
  Eye, 
  Copy, 
  FileCode, 
  Send, 
  History, 
  Trash2,
  Edit
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { EmailTemplate } from '@/hooks/useEmailTemplates';
import { TemplatePreviewDialog } from './TemplatePreviewDialog';

interface TemplateCardProps {
  template: EmailTemplate;
  onDuplicate: (template: EmailTemplate) => void;
  onExportHtml: (template: EmailTemplate) => void;
  onUseInCampaign: (template: EmailTemplate) => void;
  onViewHistory: (template: EmailTemplate) => void;
  onDelete: (template: EmailTemplate) => void;
}

const templateTypeLabels: Record<string, string> = {
  donor_thank_you: 'Donor Thank You',
  newsletter: 'Newsletter',
  event_invitation: 'Event Invitation',
  appeal: 'Appeal',
  lapsed_donor: 'Lapsed Donor',
  welcome_series: 'Welcome Series',
  receipt: 'Receipt',
  custom: 'Custom',
};

const templateTypeColors: Record<string, string> = {
  donor_thank_you: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  newsletter: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  event_invitation: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  appeal: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  lapsed_donor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  welcome_series: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  receipt: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  custom: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

export function TemplateCard({
  template,
  onDuplicate,
  onExportHtml,
  onUseInCampaign,
  onViewHistory,
  onDelete,
}: TemplateCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {template.thumbnail_url ? (
            <img
              src={template.thumbnail_url}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <FileCode className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{template.name}</h3>
              <Badge 
                variant="secondary" 
                className={`mt-1 text-xs ${templateTypeColors[template.template_type] || ''}`}
              >
                {templateTypeLabels[template.template_type] || template.template_type}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onDuplicate(template)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Template
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExportHtml(template)}>
                  <FileCode className="h-4 w-4 mr-2" />
                  Export HTML
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onUseInCampaign(template)}>
                  <Send className="h-4 w-4 mr-2" />
                  Use in Campaign
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewHistory(template)}>
                  <History className="h-4 w-4 mr-2" />
                  View Send History
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(template)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Template
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {template.description || 'No description'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Updated {formatDistanceToNow(new Date(template.updated_at), { addSuffix: true })}
          </p>
        </CardContent>
      </Card>

      {showPreview && (
        <TemplatePreviewDialog
          template={template}
          open={showPreview}
          onOpenChange={setShowPreview}
        />
      )}
    </>
  );
}
