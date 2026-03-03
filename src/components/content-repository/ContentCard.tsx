import { useState } from "react";
import { Copy, Eye, Pencil, Check, Bookmark } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ContentItem, useIncrementUseCount } from "@/hooks/useContentRepository";
import { CONTENT_TYPE_LABELS, CONTENT_TYPE_COLORS } from "./ContentTypeFilter";
import { toast } from "sonner";

interface ContentCardProps {
  item: ContentItem;
  onView: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  currentUserId?: string;
}

export function ContentCard({ item, onView, onEdit, currentUserId }: ContentCardProps) {
  const [copied, setCopied] = useState(false);
  const incrementUseCount = useIncrementUseCount();
  
  const canEdit = currentUserId && item.created_by === currentUserId;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.content);
      incrementUseCount.mutate(item.id);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };
  
  const visibleTags = item.tags?.slice(0, 3) || [];
  const extraTagsCount = (item.tags?.length || 0) - 3;
  
  const contentPreview = item.content.length > 120 
    ? item.content.slice(0, 120) + "..." 
    : item.content;

  return (
    <Card className="group relative transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* Content Type Badge */}
      <Badge 
        className={cn(
          "absolute top-3 right-3 text-xs",
          CONTENT_TYPE_COLORS[item.content_type] || CONTENT_TYPE_COLORS.other
        )}
        variant="secondary"
      >
        {CONTENT_TYPE_LABELS[item.content_type] || "Other"}
      </Badge>
      
      <CardHeader className="pb-2 pr-28">
        <h3 className="text-lg font-semibold line-clamp-2">{item.title}</h3>
      </CardHeader>
      
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
          {contentPreview}
        </p>
        
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {visibleTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {extraTagsCount > 0 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{extraTagsCount} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex items-center justify-between pt-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Used {item.use_count} times
          </span>
          {item.is_template && (
            <Badge 
              variant="secondary" 
              className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs"
            >
              <Bookmark className="h-3 w-3 mr-1" />
              Template
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={handleCopy}
            disabled={copied}
            className="h-8"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onView(item)}
            className="h-8"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(item)}
              className="h-8"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
