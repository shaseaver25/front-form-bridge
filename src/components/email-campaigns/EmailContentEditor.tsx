import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Code, Eye, Tags, Bold, Italic, Link, List, Heading1, Heading2 } from 'lucide-react';

interface EmailContentEditorProps {
  htmlContent: string;
  onHtmlChange: (html: string) => void;
  textContent?: string;
  onTextChange?: (text: string) => void;
}

const MERGE_TAGS = [
  { tag: '{{first_name}}', label: 'First Name', description: "Recipient's first name" },
  { tag: '{{last_name}}', label: 'Last Name', description: "Recipient's last name" },
  { tag: '{{email}}', label: 'Email', description: "Recipient's email address" },
  { tag: '{{full_name}}', label: 'Full Name', description: "Recipient's full name" },
  { tag: '{{organization}}', label: 'Organization', description: 'Your organization name' },
  { tag: '{{unsubscribe_url}}', label: 'Unsubscribe Link', description: 'Link to unsubscribe' },
  { tag: '{{current_year}}', label: 'Current Year', description: 'The current year' },
];

const DONOR_MERGE_TAGS = [
  { tag: '{{total_giving}}', label: 'Total Billing', description: 'Lifetime billing total' },
  { tag: '{{last_gift_amount}}', label: 'Last Invoice Amount', description: 'Most recent invoice' },
  { tag: '{{last_gift_date}}', label: 'Last Invoice Date', description: 'Date of last invoice' },
  { tag: '{{giving_level}}', label: 'Client Tier', description: "Client's engagement tier" },
];

export function EmailContentEditor({
  htmlContent,
  onHtmlChange,
  textContent = '',
  onTextChange,
}: EmailContentEditorProps) {
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Sanitize HTML for display
  const sanitizeHtml = useCallback((html: string) => {
    return DOMPurify.sanitize(html || '<p>Start typing your email content here...</p>', {
      ALLOWED_TAGS: ['p', 'div', 'span', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'br', 'strong', 'em', 'b', 'i', 'u', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'caption', 'colgroup', 'col', 'blockquote', 'pre', 'code', 'hr', 'center', 'font'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class', 'id', 'width', 'height', 'border', 'cellpadding', 'cellspacing', 'align', 'valign', 'bgcolor', 'color', 'size', 'face', 'target'],
    });
  }, []);

  // Only set innerHTML on initial mount or when switching to visual mode
  useEffect(() => {
    if (visualRef.current && (isInitialMount.current || viewMode === 'visual')) {
      const currentHtml = visualRef.current.innerHTML;
      const sanitized = sanitizeHtml(htmlContent);
      // Only update if content actually differs (to avoid cursor reset)
      if (isInitialMount.current || currentHtml !== sanitized) {
        visualRef.current.innerHTML = sanitized;
        isInitialMount.current = false;
      }
    }
  }, [viewMode]); // Only run when viewMode changes, not on every htmlContent change

  const insertMergeTag = useCallback((tag: string) => {
    if (viewMode === 'code' && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = htmlContent.slice(0, start) + tag + htmlContent.slice(end);
      onHtmlChange(newContent);
      
      // Restore cursor position after tag
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
    } else if (viewMode === 'visual' && visualRef.current) {
      // For visual mode, insert at cursor or append
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (visualRef.current.contains(range.commonAncestorContainer)) {
          range.deleteContents();
          range.insertNode(document.createTextNode(tag));
          range.collapse(false);
          onHtmlChange(visualRef.current.innerHTML);
        } else {
          onHtmlChange(htmlContent + tag);
        }
      } else {
        onHtmlChange(htmlContent + tag);
      }
    }
  }, [htmlContent, onHtmlChange, viewMode]);

  const handleVisualEdit = () => {
    if (visualRef.current) {
      onHtmlChange(visualRef.current.innerHTML);
    }
  };

  const applyFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleVisualEdit();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Email Content</Label>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Tags className="h-4 w-4 mr-2" />
                Insert Merge Tag
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Standard Fields</DropdownMenuLabel>
              {MERGE_TAGS.map((item) => (
                <DropdownMenuItem
                  key={item.tag}
                  onClick={() => insertMergeTag(item.tag)}
                  className="flex flex-col items-start"
                >
                  <span className="font-mono text-sm">{item.tag}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Donor Fields</DropdownMenuLabel>
              {DONOR_MERGE_TAGS.map((item) => (
                <DropdownMenuItem
                  key={item.tag}
                  onClick={() => insertMergeTag(item.tag)}
                  className="flex flex-col items-start"
                >
                  <span className="font-mono text-sm">{item.tag}</span>
                  <span className="text-xs text-muted-foreground">{item.description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'visual' | 'code')}>
            <TabsList className="h-8">
              <TabsTrigger value="visual" className="h-7 px-2">
                <Eye className="h-3.5 w-3.5 mr-1" />
                Visual
              </TabsTrigger>
              <TabsTrigger value="code" className="h-7 px-2">
                <Code className="h-3.5 w-3.5 mr-1" />
                Code
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {viewMode === 'visual' ? (
        <div className="space-y-2">
          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 p-1 border rounded-md bg-muted/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => applyFormatting('bold')}
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => applyFormatting('italic')}
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-border mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => applyFormatting('formatBlock', '<h1>')}
                >
                  <Heading1 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Heading 1</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => applyFormatting('formatBlock', '<h2>')}
                >
                  <Heading2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Heading 2</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-border mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => applyFormatting('insertUnorderedList')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bullet List</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    const url = prompt('Enter URL:');
                    if (url) applyFormatting('createLink', url);
                  }}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Link</TooltipContent>
            </Tooltip>
          </div>

          {/* Visual Editor */}
          <div
            ref={visualRef}
            contentEditable
            className="min-h-[350px] p-4 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-ring prose prose-sm max-w-none"
            onInput={handleVisualEdit}
            onBlur={handleVisualEdit}
          />
        </div>
      ) : (
        <Textarea
          ref={textareaRef}
          placeholder="<html>...</html>"
          value={htmlContent}
          onChange={(e) => onHtmlChange(e.target.value)}
          className="min-h-[400px] font-mono text-sm"
        />
      )}

      {onTextChange && (
        <div className="space-y-2">
          <Label htmlFor="text_content">Plain Text Version (Optional)</Label>
          <Textarea
            id="text_content"
            placeholder="Plain text fallback for email clients that don't support HTML..."
            value={textContent}
            onChange={(e) => onTextChange(e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground">
            If not provided, a plain text version will be auto-generated from your HTML content.
          </p>
        </div>
      )}
    </div>
  );
}
