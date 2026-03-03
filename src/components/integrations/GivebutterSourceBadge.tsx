import { Badge } from "@/components/ui/badge";
import { Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GivebutterSourceBadgeProps {
  transactionId?: string;
  showLink?: boolean;
  feeCovered?: number | null;
  className?: string;
}

export function GivebutterSourceBadge({ 
  transactionId, 
  showLink = false,
  feeCovered,
  className 
}: GivebutterSourceBadgeProps) {
  const badge = (
    <Badge 
      variant="outline" 
      className={`bg-pink-500/10 text-pink-600 border-pink-500/20 ${className}`}
    >
      <Heart className="h-3 w-3 mr-1 fill-current" />
      Givebutter
    </Badge>
  );

  if (showLink && transactionId) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {badge}
              {feeCovered && feeCovered > 0 && (
                <Badge variant="secondary" className="text-xs">
                  +${feeCovered.toFixed(2)} tip
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://givebutter.com/dashboard/transactions/${transactionId}`, "_blank");
                }}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>View in Givebutter Dashboard</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {badge}
      {feeCovered && feeCovered > 0 && (
        <Badge variant="secondary" className="text-xs">
          +${feeCovered.toFixed(2)} tip
        </Badge>
      )}
    </div>
  );
}
