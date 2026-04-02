import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TrendingUp, DollarSign, Info } from "lucide-react";
import type { TaskROIEstimate } from "@/hooks/useTaskROIEstimate";
import { cn } from "@/lib/utils";

interface TaskROIBadgeProps {
  estimate: TaskROIEstimate;
  taskTitle?: string;
}

export function TaskROIBadge({ estimate, taskTitle }: TaskROIBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 50) return "bg-blue-100 text-blue-800 border-blue-200";
    if (score >= 25) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getConfidenceDots = (confidence: string) => {
    switch (confidence) {
      case "high": return "●●●";
      case "medium": return "●●○";
      default: return "●○○";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn("gap-1 cursor-help", getScoreColor(estimate.roiScore))}
            >
              <TrendingUp className="h-3 w-3" />
              {estimate.roiScore}
              {estimate.potentialValue > 0 && (
                <>
                  <span className="mx-0.5">·</span>
                  <DollarSign className="h-3 w-3" />
                  {estimate.potentialValue >= 1000 
                    ? `${(estimate.potentialValue / 1000).toFixed(0)}k`
                    : estimate.potentialValue}
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Click info icon for details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              ROI Calculation Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {taskTitle && (
              <div className="text-sm text-muted-foreground border-b pb-3">
                <span className="font-medium text-foreground">Task:</span> {taskTitle}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">ROI Score</p>
                <p className={cn(
                  "text-2xl font-bold",
                  estimate.roiScore >= 75 ? "text-green-600" :
                  estimate.roiScore >= 50 ? "text-blue-600" :
                  estimate.roiScore >= 25 ? "text-yellow-600" : "text-gray-600"
                )}>
                  {estimate.roiScore}<span className="text-sm font-normal text-muted-foreground">/100</span>
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Potential Value</p>
                <p className="text-2xl font-bold text-foreground">
                  ${estimate.potentialValue.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Confidence</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getConfidenceDots(estimate.confidence)}</span>
                  <span className="text-sm capitalize">{estimate.confidence}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Suggested Priority</p>
                <Badge className={cn("capitalize", getPriorityColor(estimate.suggestedPriority))}>
                  {estimate.suggestedPriority}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">AI Analysis</p>
              <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-3 rounded-md">
                {estimate.reasoning}
              </p>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              <p className="font-medium mb-1">How ROI is calculated:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Task category and historical success rates</li>
                <li>Connected job placement fees</li>
                <li>Contact engagement history</li>
                <li>Task urgency and priority</li>
                <li>Estimated time investment</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
