import { useState } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Plus, Search, Loader2, FileCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  useEmailTemplates, 
  useDeleteTemplate,
  EmailTemplate 
} from '@/hooks/useEmailTemplates';
import { TemplateCard } from '@/components/email-templates/TemplateCard';
import { AddTemplateDialog } from '@/components/email-templates/AddTemplateDialog';
import { toast } from 'sonner';

const templateCategories = [
  { value: 'all', label: 'All Templates' },
  { value: 'donor_thank_you', label: 'Donor Thank You' },
  { value: 'newsletter', label: 'Newsletters' },
  { value: 'event_invitation', label: 'Event Invitations' },
  { value: 'appeal', label: 'Appeals' },
  { value: 'lapsed_donor', label: 'Lapsed Donor' },
  { value: 'welcome_series', label: 'Welcome Series' },
  { value: 'receipt', label: 'Receipts' },
  { value: 'custom', label: 'Custom' },
];

export default function EmailTemplates() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);

  const { data: templates, isLoading } = useEmailTemplates(selectedCategory);
  const deleteTemplate = useDeleteTemplate();

  const filteredTemplates = templates?.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDuplicate = (template: EmailTemplate) => {
    toast.info('Duplicate feature coming soon');
  };

  const handleExportHtml = (template: EmailTemplate) => {
    if (template.html_content) {
      const blob = new Blob([template.html_content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('HTML exported successfully');
    } else {
      toast.error('No HTML content to export. Edit in Canva and export first.');
    }
  };

  const handleUseInCampaign = (template: EmailTemplate) => {
    navigate(`/email-campaigns/new?templateId=${template.id}`);
  };

  const handleViewHistory = (template: EmailTemplate) => {
    navigate(`/email-templates/${template.id}/history`);
  };

  const handleDeleteConfirm = async () => {
    if (templateToDelete) {
      await deleteTemplate.mutateAsync(templateToDelete.id);
      setTemplateToDelete(null);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Email Templates</h1>
            <p className="text-muted-foreground">
              Design and manage email templates for donor communications
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Template
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex-wrap h-auto gap-1">
            {templateCategories.map((category) => (
              <TabsTrigger key={category.value} value={category.value}>
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileCode className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try a different search term'
                : 'Get started by creating your first email template'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Template
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onDuplicate={handleDuplicate}
                onExportHtml={handleExportHtml}
                onUseInCampaign={handleUseInCampaign}
                onViewHistory={handleViewHistory}
                onDelete={setTemplateToDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Template Dialog */}
      <AddTemplateDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
