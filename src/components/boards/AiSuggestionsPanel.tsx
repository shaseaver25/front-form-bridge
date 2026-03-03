import { useState } from 'react';
import { X, Sparkles, Plus, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { SuggestedCard, boardAiService } from '@/services/boardAiService';
import { useBoardContext } from '@/contexts/BoardContext';
import { toast } from '@/hooks/use-toast';

interface AiSuggestionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  urgent: 'bg-destructive/10 text-destructive',
};

export function AiSuggestionsPanel({ isOpen, onClose }: AiSuggestionsPanelProps) {
  const { state, dispatch } = useBoardContext();
  const { board, columns, cards } = state;
  
  const [suggestions, setSuggestions] = useState<SuggestedCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);

  const fetchSuggestions = async () => {
    if (!board) return;
    
    setIsLoading(true);
    try {
      const result = await boardAiService.getSuggestions(
        board,
        columns,
        cards
      );
      setSuggestions(result);
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

  const addSuggestion = async (suggestion: SuggestedCard, index: number) => {
    const targetColumn = columns.find(
      col => col.title.toLowerCase() === suggestion.columnTitle.toLowerCase()
    );
    
    if (!targetColumn) {
      toast({
        title: 'Column not found',
        description: `Could not find column "${suggestion.columnTitle}"`,
        variant: 'destructive',
      });
      return;
    }

    setAddingIndex(index);
    try {
      await dispatch.createCard(targetColumn.id, {
        headline: suggestion.headline,
        description: suggestion.description,
        priority: suggestion.priority,
      });
      
      // Remove from suggestions
      setSuggestions(prev => prev.filter((_, i) => i !== index));
      
      toast({
        title: 'Task added',
        description: `"${suggestion.headline}" added to ${suggestion.columnTitle}`,
      });
    } catch (error) {
      toast({
        title: 'Failed to add task',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setAddingIndex(null);
    }
  };

  const addAllSuggestions = async () => {
    for (let i = 0; i < suggestions.length; i++) {
      await addSuggestion(suggestions[i], i);
    }
  };

  // Fetch suggestions when panel opens
  if (isOpen && suggestions.length === 0 && !isLoading) {
    fetchSuggestions();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">AI Suggestions</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Analyzing your board...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Sparkles className="h-8 w-8 mb-4 opacity-50" />
            <p className="text-center">No suggestions yet.</p>
            <Button variant="outline" size="sm" onClick={fetchSuggestions} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Suggestions
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-sm">{suggestion.headline}</h3>
                  <Badge className={cn('text-xs', priorityColors[suggestion.priority])}>
                    {suggestion.priority}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {suggestion.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    → {suggestion.columnTitle}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => addSuggestion(suggestion, index)}
                    disabled={addingIndex !== null}
                  >
                    {addingIndex === index ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {suggestions.length > 0 && (
        <div className="p-4 border-t space-y-2">
          <Button className="w-full" onClick={addAllSuggestions} disabled={addingIndex !== null}>
            <Plus className="h-4 w-4 mr-2" />
            Add All ({suggestions.length})
          </Button>
          <Button variant="outline" className="w-full" onClick={fetchSuggestions} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}
