import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DensityToggleProps {
  value: "comfortable" | "compact";
  onChange: (value: "comfortable" | "compact") => void;
  className?: string;
}

export function DensityToggle({ value, onChange, className }: DensityToggleProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("inline-flex items-center rounded-md border bg-background p-1", className)}>
        <Tooltip><TooltipTrigger asChild><Button variant={value === "comfortable" ? "secondary" : "ghost"} size="sm" className="h-8 w-8 p-0" onClick={() => onChange("comfortable")}><LayoutGrid className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Comfortable View</p></TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><Button variant={value === "compact" ? "secondary" : "ghost"} size="sm" className="h-8 w-8 p-0" onClick={() => onChange("compact")}><List className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Compact View</p></TooltipContent></Tooltip>
      </div>
    </TooltipProvider>
  );
}