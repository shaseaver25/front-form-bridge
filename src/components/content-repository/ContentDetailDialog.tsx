import { useState } from "react";
import { format } from "date-fns";
import { Copy, Check, Pencil, Trash2, Bookmark } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ContentItem, useIncrementUseCount, useDeleteContent } from "@/hooks/useContentRepository";
import { CONTENT_TYPE_LABELS, CONTENT_TYPE_COLORS } from "./ContentTypeFilter";
import { toast } from "sonner";

interface ContentDetailDialogProps {
  item: ContentItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (item: ContentItem) => void;
  currentUserId?: string;
}

export function ContentDetailDialog({
  item,
  open,
  onOpenChange,
  onEdit,
  currentUserId,
}: ContentDetailDialogProps) {
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const incrementUseCount = useIncrementUseCount();
  const deleteContent = useDeleteContent();
  
  if (!item) return null;
  
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

  const handleDelete = async () => {
    try {
      await deleteContent.mutateAsync(item.id);
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(item);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4 pr-8">
              <DialogTitle className="text-2xl font-bold">{item.title}</DialogTitle>
              <Badge
                className={cn(
                  "shrink-0",
                  CONTENT_TYPE_COLORS[item.content_type] || CONTENT_TYPE_COLORS.other
                )}
                variant="secondary"
              >
                {CONTENT_TYPE_LABELS[item.content_type] || "Other"}
              </Badge>
            </div>
            {item.is_template && (
              <Badge
                variant="secondary"
                className="w-fit bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              >
                <Bookmark className="h-3 w-3 mr-1" />
                Template
              </Badge>
            )}
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {item.content}
                </p>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {format(new Date(item.created_at), "MMM d, yyyy")}
                </div>
                <div>
                  <span className="font-medium">Last used:</span>{" "}
                  {item.last_used_at
                    ? format(new Date(item.last_used_at), "MMM d, yyyy")
                    : "Never"}
                </div>
                <div>
                  <span className="font-medium">Times used:</span> {item.use_count}
                </div>
                {item.category && (
                  <div>
                    <span className="font-medium">Category:</span> {item.category}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2 sm:gap-0">
            {canEdit && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button onClick={handleCopy} disabled={copied} size="lg">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{item.title}"? This action cannot be undone.
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
    </>
  );
}
