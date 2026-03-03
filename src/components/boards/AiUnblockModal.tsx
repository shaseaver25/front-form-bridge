import { useState, useEffect } from 'react';
import { Lightbulb, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { boardAiService, UnblockSuggestion } from '@/services/boardAiService';
import { BoardCard } from '@/types/boards';
import { toast } from '@/hooks/use-toast';

interface AiUnblockModalProps {
  card: BoardCard;
  cards: BoardCard[];
  isOpen: boolean;
  onClose: () => void;
}

export function AiUnblockModal({ card, cards, isOpen, onClose }: AiUnblockModalProps) {
  const [suggestion, setSuggestion] = useState<UnblockSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const result = await boardAiService.getUnblockSuggestion(card, cards);
      setSuggestion(result);
    } catch (error) {
      toast({
        title: 'Failed to get suggestions',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !suggestion) {
      fetchSuggestions();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Unblock Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Blocked Task Info */}
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="font-medium text-sm">{card.headline}</p>
            {card.blocked_reason && (
              <p className="text-sm text-muted-foreground mt-1">
                Reason: {card.blocked_reason}
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analyzing blockers...</p>
            </div>
          ) : suggestion ? (
            <ScrollArea className="max-h-80">
              <div className="space-y-4">
                {/* Suggestions */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Suggestions</h4>
                  <ul className="space-y-2">
                    {suggestion.suggestions.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 p-2 bg-muted/50 rounded-md text-sm"
                      >
                        <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Next Steps */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Next Steps</h4>
                  <ul className="space-y-2">
                    {suggestion.nextSteps.map((step, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 p-2 bg-primary/5 rounded-md text-sm"
                      >
                        <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No suggestions available.</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={fetchSuggestions} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
