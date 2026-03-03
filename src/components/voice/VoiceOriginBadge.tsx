import { Badge } from "@/components/ui/badge";
import { Mic } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

interface VoiceOriginBadgeProps {
  eventName?: string | null;
  createdAt?: string;
}

export function VoiceOriginBadge({ eventName, createdAt }: VoiceOriginBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className="bg-primary/10 text-primary border-primary/20 gap-1"
          >
            <Mic className="w-3 h-3" />
            Created via Voice
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {eventName && <span>From: {eventName}</span>}
            {createdAt && (
              <span className="block text-muted-foreground">
                {format(new Date(createdAt), "MMM d, yyyy 'at' h:mm a")}
              </span>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
