import { useState } from 'react';
import { Calendar, Loader2, CheckCircle2, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { boardAiService, SprintPlan } from '@/services/boardAiService';
import { useBoardContext } from '@/contexts/BoardContext';
import { toast } from '@/hooks/use-toast';

interface AiSprintPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSprintPlanningModal({ isOpen, onClose }: AiSprintPlanningModalProps) {
  const { state, dispatch } = useBoardContext();
  const { board, columns, cards } = state;
  
  const [teamCapacity, setTeamCapacity] = useState(40);
  const [plan, setPlan] = useState<SprintPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  // Get backlog cards (first column typically)
  const backlogColumn = columns[0];
  const backlogCards = cards.filter(c => c.column_id === backlogColumn?.id);

  const generatePlan = async () => {
    if (!board) return;
    
    setIsLoading(true);
    try {
      const result = await boardAiService.getSprintPlan(board, backlogCards, teamCapacity);
      setPlan(result);
      setSelectedCards(result.selectedCardIds || []);
    } catch (error) {
      toast({
        title: 'Failed to generate plan',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startSprint = async () => {
    // Move selected cards to "In Progress" column
    const inProgressColumn = columns.find(
      c => c.title.toLowerCase().includes('progress') || c.title.toLowerCase().includes('doing')
    );
    
    if (!inProgressColumn) {
      toast({
        title: 'No "In Progress" column found',
        description: 'Create an "In Progress" column first',
        variant: 'destructive',
      });
      return;
    }

    for (const cardId of selectedCards) {
      await dispatch.moveCard(cardId, inProgressColumn.id, 0);
    }

    toast({
      title: 'Sprint started',
      description: `Moved ${selectedCards.length} cards to ${inProgressColumn.title}`,
    });
    
    onClose();
  };

  const toggleCardSelection = (cardId: string) => {
    setSelectedCards(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            AI Sprint Planning
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Capacity Input */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="capacity">Team Capacity (hours)</Label>
              <Input
                id="capacity"
                type="number"
                value={teamCapacity}
                onChange={(e) => setTeamCapacity(parseInt(e.target.value) || 40)}
                min={1}
                max={200}
              />
            </div>
            <Button onClick={generatePlan} disabled={isLoading || backlogCards.length === 0}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Generate Plan
            </Button>
          </div>

          {backlogCards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No cards in backlog to plan.</p>
            </div>
          ) : plan ? (
            <ScrollArea className="flex-1">
              <div className="space-y-4">
                {/* Plan Overview */}
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h4 className="font-medium mb-2">Sprint Plan</h4>
                  <p className="text-sm text-muted-foreground">{plan.plan}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {selectedCards.length} tasks selected
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      ~{plan.estimatedHours} hours
                    </span>
                  </div>
                </div>

                {/* Card Selection */}
                <div>
                  <h4 className="font-medium mb-2">Select Tasks for Sprint</h4>
                  <div className="space-y-2">
                    {backlogCards.map((card) => (
                      <div
                        key={card.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedCards.includes(card.id)
                            ? 'bg-primary/10 border-primary/30'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleCardSelection(card.id)}
                      >
                        <Checkbox
                          checked={selectedCards.includes(card.id)}
                          onCheckedChange={() => toggleCardSelection(card.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{card.headline}</p>
                          {card.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {card.description}
                            </p>
                          )}
                        </div>
                        {plan.selectedCardIds.includes(card.id) && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                            AI Recommended
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Calendar className="h-12 w-12 mb-4 opacity-30" />
              <p>Set your team capacity and generate a sprint plan.</p>
              <p className="text-sm mt-1">{backlogCards.length} cards in backlog</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {plan && selectedCards.length > 0 && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={startSprint}>
              Start Sprint ({selectedCards.length} tasks)
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
