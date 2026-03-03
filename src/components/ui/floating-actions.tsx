import { Eye, Pencil, Trash2, MoreVertical, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FloatingActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onMore?: () => void;
  archiveLabel?: string;
  className?: string;
}

export function FloatingActions({ onView, onEdit, onDelete, onArchive, onMore, archiveLabel = "Archive", className }: FloatingActionsProps) {
  return (
    <div className={cn("absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200", className)} onClick={(e) => e.stopPropagation()}>
      <TooltipProvider delayDuration={100}>
        {onView && (
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={onView}><Eye className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>View</p></TooltipContent></Tooltip>
        )}
        {onEdit && (
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={onEdit}><Pencil className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Edit</p></TooltipContent></Tooltip>
        )}
        {onArchive && (
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-orange-500/10 hover:text-orange-600" onClick={onArchive}><Archive className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>{archiveLabel}</p></TooltipContent></Tooltip>
        )}
        {onDelete && (
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Delete</p></TooltipContent></Tooltip>
        )}
        {onMore && (
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={onMore}><MoreVertical className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>More</p></TooltipContent></Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}