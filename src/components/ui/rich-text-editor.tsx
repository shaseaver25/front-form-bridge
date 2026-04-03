import { useRef, useCallback } from "react";
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Undo, Redo } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

function execCmd(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Write something...",
  className,
  minHeight = "120px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleCommand = useCallback((command: string) => {
    execCmd(command);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  const isActive = (command: string) => {
    return document.queryCommandState(command);
  };

  return (
    <div className={cn("border border-input rounded-md overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-border px-1 py-1 bg-muted/30">
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => handleCommand("bold")}
          aria-label="Bold"
          className="h-7 w-7 p-0"
        >
          <Bold className="w-3.5 h-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => handleCommand("italic")}
          aria-label="Italic"
          className="h-7 w-7 p-0"
        >
          <Italic className="w-3.5 h-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => handleCommand("underline")}
          aria-label="Underline"
          className="h-7 w-7 p-0"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </Toggle>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => handleCommand("insertUnorderedList")}
          aria-label="Bullet List"
          className="h-7 w-7 p-0"
        >
          <List className="w-3.5 h-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => handleCommand("insertOrderedList")}
          aria-label="Ordered List"
          className="h-7 w-7 p-0"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </Toggle>
        <Separator orientation="vertical" className="mx-1 h-5" />
        <Toggle
          size="sm"
          onPressedChange={() => handleCommand("undo")}
          aria-label="Undo"
          className="h-7 w-7 p-0"
        >
          <Undo className="w-3.5 h-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          onPressedChange={() => handleCommand("redo")}
          aria-label="Redo"
          className="h-7 w-7 p-0"
        >
          <Redo className="w-3.5 h-3.5" />
        </Toggle>
      </div>
      {/* Editor */}
      <div className="px-3 py-2">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          dangerouslySetInnerHTML={{ __html: content }}
          data-placeholder={placeholder}
          className={cn(
            "prose prose-sm max-w-none focus:outline-none text-foreground",
            "prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5",
            "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5",
            "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none"
          )}
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}

/**
 * Read-only renderer for rich text HTML content.
 * Falls back to plain text display if content has no HTML tags.
 */
export function RichTextDisplay({ content, className }: { content: string; className?: string }) {
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (!isHtml) {
    return <p className={cn("text-sm text-muted-foreground whitespace-pre-line", className)}>{content}</p>;
  }

  const DOMPurify = await import("dompurify");
  // Actually we can't use async here. Use a synchronous import instead.


  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-muted-foreground",
        "prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5",
        "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
