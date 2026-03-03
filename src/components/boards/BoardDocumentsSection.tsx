import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Link as LinkIcon, Upload, Trash2, ExternalLink, File, Image, FileSpreadsheet } from 'lucide-react';
import { useBoardDocuments, BoardDocument } from '@/hooks/useBoardDocuments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface BoardDocumentsSectionProps {
  boardId: string;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return FileSpreadsheet;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word')) return FileText;
  return File;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BoardDocumentsSection({ boardId }: BoardDocumentsSectionProps) {
  const { documents, isLoading, addLink, uploadFile, deleteDocument, isAddingLink, isUploadingFile } = useBoardDocuments(boardId);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<BoardDocument | null>(null);
  
  // Link form state
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  
  // File form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileDescription, setFileDescription] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setFileName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension for name
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
  });

  const handleAddLink = () => {
    if (!linkName.trim() || !linkUrl.trim()) return;
    addLink(
      { name: linkName.trim(), url: linkUrl.trim(), description: linkDescription.trim() || undefined },
      {
        onSuccess: () => {
          setLinkName('');
          setLinkUrl('');
          setLinkDescription('');
          setIsAddDialogOpen(false);
        },
      }
    );
  };

  const handleUploadFile = () => {
    if (!selectedFile || !fileName.trim()) return;
    uploadFile(
      { file: selectedFile, name: fileName.trim(), description: fileDescription.trim() || undefined },
      {
        onSuccess: () => {
          setSelectedFile(null);
          setFileName('');
          setFileDescription('');
          setIsAddDialogOpen(false);
        },
      }
    );
  };

  const handleOpenDocument = (doc: BoardDocument) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Documents</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Document</DialogTitle>
              <DialogDescription>
                Add an external link or upload a file to this board.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="link" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="link">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Link
                </TabsTrigger>
                <TabsTrigger value="file">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="link" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="link-name">Name</Label>
                  <Input
                    id="link-name"
                    placeholder="Document name"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link-url">URL</Label>
                  <Input
                    id="link-url"
                    placeholder="https://..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link-description">Description (optional)</Label>
                  <Textarea
                    id="link-description"
                    placeholder="Brief description..."
                    value={linkDescription}
                    onChange={(e) => setLinkDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleAddLink}
                    disabled={!linkName.trim() || !linkUrl.trim() || isAddingLink}
                  >
                    {isAddingLink ? 'Adding...' : 'Add Link'}
                  </Button>
                </DialogFooter>
              </TabsContent>
              
              <TabsContent value="file" className="space-y-4 mt-4">
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
                  )}
                >
                  <input {...getInputProps()} />
                  {selectedFile ? (
                    <div className="space-y-1">
                      <FileText className="h-8 w-8 mx-auto text-primary" />
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {isDragActive ? 'Drop file here' : 'Drag & drop or click to select'}
                      </p>
                      <p className="text-xs text-muted-foreground">Max 20MB</p>
                    </div>
                  )}
                </div>
                
                {selectedFile && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="file-name">Name</Label>
                      <Input
                        id="file-name"
                        placeholder="Document name"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="file-description">Description (optional)</Label>
                      <Textarea
                        id="file-description"
                        placeholder="Brief description..."
                        value={fileDescription}
                        onChange={(e) => setFileDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleUploadFile}
                        disabled={!fileName.trim() || isUploadingFile}
                      >
                        {isUploadingFile ? 'Uploading...' : 'Upload File'}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No documents yet</p>
            <p className="text-xs text-muted-foreground">Add links or upload files to this board</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const Icon = doc.document_type === 'link' ? LinkIcon : getFileIcon(doc.mime_type);
            return (
              <Card key={doc.id} className="group">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.description || (doc.document_type === 'file' ? formatFileSize(doc.file_size) : doc.url)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDocument(doc)}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDocumentToDelete(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{documentToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (documentToDelete) {
                  deleteDocument(documentToDelete);
                  setDocumentToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
