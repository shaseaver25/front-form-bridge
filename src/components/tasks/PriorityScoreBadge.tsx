import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPriorityScoreColor, type PriorityEstimate } from "@/types/priority-types";
import { useState } from "react";

interface PriorityScoreBadgeProps {
  estimate: PriorityEstimate;
  taskTitle?: string;
  algorithmType?: "nonprofit" | "for_profit";
}

export function PriorityScoreBadge({ estimate, taskTitle, algorithmType = "nonprofit" }: PriorityScoreBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getConfidenceDots = (conf: string) => {
    if (conf === "high") return "●●●";
    if (conf === "medium") return "●●○";
    return "●○○";
  };

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={cn("gap-1 cursor-help", getPriorityScoreColor(estimate.priorityScore))}>
              <TrendingUp className="h-3 w-3" />
              {estimate.priorityScore}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Priority Score: {estimate.priorityScore}/100</p>
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
              Priority Calculation ({algorithmType === "nonprofit" ? "Nonprofit" : "For-Profit"})
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {taskTitle && (
              <div className="text-sm text-muted-foreground border-b pb-3">
                <span className="font-medium text-foreground">Task:</span> {taskTitle}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Score</p>
                <p className={cn("text-2xl font-bold", estimate.priorityScore >= 71 ? "text-green-600" : estimate.priorityScore >= 41 ? "text-yellow-600" : "text-red-600")}>
                  {estimate.priorityScore}<span className="text-sm font-normal">/100</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Confidence</p>
                <p className="text-lg">{getConfidenceDots(estimate.confidenceLevel)} {estimate.confidenceLevel}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground uppercase">AI Reasoning</p>
              <p className="text-sm bg-muted/50 p-3 rounded-md">{estimate.priorityReasoning}</p>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              <p className="font-medium mb-1">Algorithm: {algorithmType === "nonprofit" ? "Nonprofit ROI Model" : "Product/Startup Model"}</p>
              {algorithmType === "nonprofit" ? (
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Task category success rates</li>
                  <li>Grant connection value</li>
                  <li>Constituent giving history</li>
                  <li>Urgency & effort ratio</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Beta launch criticality</li>
                  <li>User impact scope</li>
                  <li>Blocking dependencies</li>
                  <li>Strategic & revenue value</li>
                </ul>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
