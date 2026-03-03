import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import DOMPurify from 'dompurify';
import { Upload, FileText, X, Eye, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HELP_CATEGORIES, HelpArticle } from '@/hooks/useHelpArticles';
import { useUploadHelpDocument } from '@/hooks/useHelpAdmin';

interface HelpArticleEditorProps {
  article?: HelpArticle;
  onSave: (data: {
    title: string;
    slug: string;
    content?: string;
    document_url?: string;
    document_type: string;
    category: string;
    subcategory?: string;
    order_index: number;
    is_published: boolean;
    target_roles: string[];
  }) => void;
  isLoading?: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'pdf', label: 'PDF Document' },
  { value: 'docx', label: 'Word Document' },
  { value: 'video', label: 'Video URL' },
];

const TARGET_ROLES = [
  { value: 'board_member', label: 'Board Member' },
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
];

export function HelpArticleEditor({ article, onSave, isLoading }: HelpArticleEditorProps) {
  const [title, setTitle] = useState(article?.title || '');
  const [slug, setSlug] = useState(article?.slug || '');
  const [content, setContent] = useState(article?.content || '');
  const [documentUrl, setDocumentUrl] = useState(article?.document_url || '');
  const [documentType, setDocumentType] = useState(article?.document_type || 'markdown');
  const [category, setCategory] = useState(article?.category || '');
  const [subcategory, setSubcategory] = useState(article?.subcategory || '');
  const [orderIndex, setOrderIndex] = useState(article?.order_index || 0);
  const [isPublished, setIsPublished] = useState(article?.is_published ?? true);
  const [targetRoles, setTargetRoles] = useState<string[]>(article?.target_roles || []);
  const [previewMode, setPreviewMode] = useState(false);

  const uploadDocument = useUploadHelpDocument();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const url = await uploadDocument.mutateAsync(file);
    setDocumentUrl(url);

    // Auto-detect document type
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') setDocumentType('pdf');
    else if (ext === 'docx' || ext === 'doc') setDocumentType('docx');
  }, [uploadDocument]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  });

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!article) {
      setSlug(generateSlug(value));
    }
  };

  const toggleRole = (role: string) => {
    setTargetRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const handleSave = () => {
    onSave({
      title,
      slug,
      content: documentType === 'markdown' ? content : undefined,
      document_url: documentType !== 'markdown' ? documentUrl : undefined,
      document_type: documentType,
      category,
      subcategory: subcategory || undefined,
      order_index: orderIndex,
      is_published: isPublished,
      target_roles: targetRoles,
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Article title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="article-slug"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {HELP_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subcategory">Subcategory (optional)</Label>
          <Input
            id="subcategory"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            placeholder="e.g., Advanced"
          />
        </div>

        <div className="space-y-2">
          <Label>Content Type</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {documentType === 'markdown' ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Content</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </>
              )}
            </Button>
          </div>

          {previewMode ? (
            <Card>
              <CardContent className="prose prose-neutral dark:prose-invert max-w-none py-4">
                <div dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }} />
              </CardContent>
            </Card>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article content in Markdown..."
              rows={15}
              className="font-mono"
            />
          )}
        </div>
      ) : documentType === 'video' ? (
        <div className="space-y-2">
          <Label htmlFor="video-url">Video URL</Label>
          <Input
            id="video-url"
            value={documentUrl}
            onChange={(e) => setDocumentUrl(e.target.value)}
            placeholder="https://youtube.com/embed/..."
          />
          <p className="text-xs text-muted-foreground">
            Use an embeddable URL (e.g., YouTube embed link)
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Document</Label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            {uploadDocument.isPending ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : documentUrl ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium">Document uploaded</p>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">
                    {documentUrl}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDocumentUrl('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive
                    ? 'Drop the file here'
                    : 'Drag & drop a PDF or Word document, or click to browse'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <Label>Target Roles (leave empty for all)</Label>
          <div className="flex flex-wrap gap-2">
            {TARGET_ROLES.map((role) => (
              <Button
                key={role.value}
                variant={targetRoles.includes(role.value) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleRole(role.value)}
              >
                {role.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="order-index">Display Order</Label>
            <Input
              id="order-index"
              type="number"
              value={orderIndex}
              onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
              className="w-24"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is-published">Published</Label>
            <Switch
              id="is-published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleSave}
          disabled={!title || !slug || !category || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Article'
          )}
        </Button>
      </div>
    </div>
  );
}

// Simple markdown formatter with XSS protection
function formatMarkdown(content: string): string {
  const html = content
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n/gim, '<br />');

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'br', 'ul', 'ol', 'li', 'a', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
}
