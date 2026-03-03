import { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  LayoutTemplate,
  MoreVertical,
  Trash2,
  Eye,
  Columns,
  FileText,
  Search,
  Users,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  useBoardTemplatesAdmin,
  useUpdateTemplate,
  useDeleteTemplate,
  BoardTemplate,
} from '@/hooks/useBoardTemplates';
import { BulkCreateBoardsDialog } from '@/components/boards/BulkCreateBoardsDialog';

export default function BoardTemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [templateToDelete, setTemplateToDelete] = useState<BoardTemplate | null>(null);
  const [showBulkCreate, setShowBulkCreate] = useState(false);

  const { data: templates, isLoading } = useBoardTemplatesAdmin();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const filteredTemplates = templates?.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleActive = async (template: BoardTemplate) => {
    await updateTemplate.mutateAsync({
      templateId: template.id,
      updates: { is_active: !template.is_active },
    });
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    await deleteTemplate.mutateAsync(templateToDelete.id);
    setTemplateToDelete(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <LayoutTemplate className="w-8 h-8" />
              Board Templates
            </h1>
            <p className="text-muted-foreground">
              Manage reusable templates for creating boards
            </p>
          </div>
          <Button onClick={() => setShowBulkCreate(true)}>
            <Users className="w-4 h-4 mr-2" />
            Bulk Create Training Boards
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredTemplates && filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              const templateData = template.template_data as {
                columns?: Array<{ title: string }>;
                cards?: Array<{ headline: string }>;
              };

              return (
                <Card
                  key={template.id}
                  className={!template.is_active ? 'opacity-60' : ''}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {template.name}
                          {!template.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </CardTitle>
                        {template.description && (
                          <CardDescription className="line-clamp-2">
                            {template.description}
                          </CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleActive(template)}>
                            <Eye className="w-4 h-4 mr-2" />
                            {template.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setTemplateToDelete(template)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Columns className="w-4 h-4" />
                        <span>{templateData?.columns?.length || 0} columns</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>{templateData?.cards?.length || 0} cards</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="capitalize">
                        {template.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Created {formatDistanceToNow(new Date(template.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                <LayoutTemplate className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No templates yet</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Create templates by opening a board and using "Save as Template" in the settings menu.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{templateToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template. Boards created from this template will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Create Dialog */}
      <BulkCreateBoardsDialog
        open={showBulkCreate}
        onOpenChange={setShowBulkCreate}
      />
    </Layout>
  );
}
