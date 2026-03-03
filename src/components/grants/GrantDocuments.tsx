import { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  MoreVertical, 
  Search,
  Clock,
  RefreshCw,
  File,
  FileSpreadsheet,
  FileImage,
  Calculator,
  Award,
  FileCheck,
  Paperclip,
  StickyNote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  useGrantDocuments, 
  useDeleteGrantDocument, 
  useDocumentDownloadUrl,
  GrantDocument 
} from '@/hooks/useGrantDocuments';
import { DocumentUpload } from './DocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GrantDocumentsProps {
  grantId: string;
  className?: string;
}

const getCategoryIcon = (iconName: string | null | undefined) => {
  switch (iconName) {
    case 'file-text': return FileText;
    case 'calculator': return Calculator;
    case 'award': return Award;
    case 'file-check': return FileCheck;
    case 'paperclip': return Paperclip;
    case 'sticky-note': return StickyNote;
    default: return File;
  }
};

const getFileIcon = (fileType: string) => {
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
    return FileSpreadsheet;
  }
  if (fileType.includes('image')) {
    return FileImage;
  }
  return FileText;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const DocumentCard = ({ 
  document, 
  onDelete, 
  onNewVersion 
}: { 
  document: GrantDocument; 
  onDelete: () => void;
  onNewVersion: () => void;
}) => {
  const [downloading, setDownloading] = useState(false);
  const CategoryIcon = document.category ? getCategoryIcon(document.category.icon) : File;
  const FileIcon = getFileIcon(document.file_type);
  
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from('grant-documents')
        .download(document.storage_path);
      
      if (error) throw error;
      
      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    } finally {
      setDownloading(false);
    }
  };
  
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <FileIcon className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate" title={document.file_name}>
                  {document.file_name}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {document.category && (
                    <Badge variant="secondary" className="text-xs">
                      <CategoryIcon className="h-3 w-3 mr-1" />
                      {document.category.name}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(document.file_size)}
                  </span>
                  {(document.version_number ?? 1) > 1 && (
                    <Badge variant="outline" className="text-xs">
                      v{document.version_number}
                    </Badge>
                  )}
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownload} disabled={downloading}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onNewVersion}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Upload New Version
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {document.notes && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {document.notes}
              </p>
            )}
            
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {format(new Date(document.uploaded_at), 'MMM d, yyyy')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const GrantDocuments = ({ grantId, className }: GrantDocumentsProps) => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDocument, setDeleteDocument] = useState<GrantDocument | null>(null);
  const [newVersionFor, setNewVersionFor] = useState<string | undefined>(undefined);
  
  const { data: documents = [], isLoading } = useGrantDocuments(grantId);
  const deleteMutation = useDeleteGrantDocument();
  
  const filteredDocuments = documents.filter(doc => 
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleDelete = async () => {
    if (!deleteDocument) return;
    
    await deleteMutation.mutateAsync({
      documentId: deleteDocument.id,
      storagePath: deleteDocument.storage_path,
      grantId
    });
    
    setDeleteDocument(null);
  };
  
  const handleNewVersion = (documentId: string) => {
    setNewVersionFor(documentId);
    setUploadOpen(true);
  };
  
  const handleUploadClose = (open: boolean) => {
    setUploadOpen(open);
    if (!open) {
      setNewVersionFor(undefined);
    }
  };
  
  // Group documents by category
  const documentsByCategory = filteredDocuments.reduce((acc, doc) => {
    const categoryName = doc.category?.name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(doc);
    return acc;
  }, {} as Record<string, GrantDocument[]>);
  
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-1">No documents yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload documents to keep everything organized
            </p>
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(documentsByCategory).map(([category, docs]) => (
            <div key={category}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {category} ({docs.length})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {docs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onDelete={() => setDeleteDocument(doc)}
                    onNewVersion={() => handleNewVersion(doc.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <DocumentUpload
        grantId={grantId}
        open={uploadOpen}
        onOpenChange={handleUploadClose}
        replacesDocumentId={newVersionFor}
      />
      
      <AlertDialog open={!!deleteDocument} onOpenChange={() => setDeleteDocument(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDocument?.file_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
