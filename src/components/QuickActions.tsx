import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";

interface QuickActionsProps {
  onLogInteraction: (type: string) => void;
}

const QuickActions = ({ onLogInteraction }: QuickActionsProps) => {
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-muted-foreground">Quick Actions</p>
          <Button
            size="sm"
            variant="default"
            onClick={() => onLogInteraction("")}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Log Interaction
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
