import { useState } from 'react';
import { Sparkles, ListTodo, Loader2, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useBoardContext } from '@/contexts/BoardContext';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ParsedTask {
  headline: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  columnTitle: string;
  selected: boolean;
}

export function AiAgendaParser() {
  const { state, dispatch } = useBoardContext();
  const { columns } = state;
  const [isOpen, setIsOpen] = useState(false);
  const [agendaText, setAgendaText] = useState('');
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleParseAgenda = async () => {
    if (!agendaText.trim()) {
      toast.error('Please enter a list or agenda to parse');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('board-ai-assistant', {
        body: {
          operation: 'parse_agenda',
          context: {
            agendaText: agendaText.trim(),
            columns: columns.map(c => ({ id: c.id, title: c.title })),
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const tasks = Array.isArray(data.result) ? data.result : data.result?.tasks || [];
      setParsedTasks(tasks.map((t: Omit<ParsedTask, 'selected'>) => ({ ...t, selected: true })));
      toast.success(`Parsed ${tasks.length} tasks from your agenda`);
    } catch (error) {
      console.error('Error parsing agenda:', error);
      toast.error('Failed to parse agenda. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTaskSelection = (index: number) => {
    setParsedTasks(prev => 
      prev.map((task, i) => 
        i === index ? { ...task, selected: !task.selected } : task
      )
    );
  };

  const selectAll = () => {
    setParsedTasks(prev => prev.map(task => ({ ...task, selected: true })));
  };

  const deselectAll = () => {
    setParsedTasks(prev => prev.map(task => ({ ...task, selected: false })));
  };

  const handleAddSelectedTasks = async () => {
    const selectedTasks = parsedTasks.filter(t => t.selected);
    if (selectedTasks.length === 0) {
      toast.error('Please select at least one task to add');
      return;
    }

    setIsAdding(true);
    try {
      for (const task of selectedTasks) {
        // Find matching column or use first column
        const targetColumn = columns.find(
          c => c.title.toLowerCase().includes(task.columnTitle.toLowerCase())
        ) || columns.find(c => 
          c.column_type === 'todo' || c.title.toLowerCase().includes('to do')
        ) || columns[0];

        if (targetColumn) {
          await dispatch.createCard(targetColumn.id, {
            headline: task.headline,
            description: task.description,
            priority: task.priority,
          });
        }
      }

      toast.success(`Added ${selectedTasks.length} tasks to the board`);
      setParsedTasks([]);
      setAgendaText('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding tasks:', error);
      toast.error('Failed to add some tasks');
    } finally {
      setIsAdding(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const selectedCount = parsedTasks.filter(t => t.selected).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ListTodo className="h-4 w-4" />
          <span className="hidden sm:inline">Parse Agenda</span>
          <Sparkles className="h-3 w-3 text-primary" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="absolute right-4 top-16 z-50 w-[400px] md:w-[500px]">
        <Card className="shadow-lg border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Agenda Parser
            </CardTitle>
            <CardDescription>
              Paste a meeting agenda, to-do list, or notes and AI will create tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsedTasks.length === 0 ? (
              <>
                <Textarea
                  placeholder={`Paste your agenda or list here...\n\nExample:\n- Review Q4 budget proposal\n- Schedule meeting with foundation\n- Update donor database\n- Prepare grant report (urgent)\n- Follow up with Sarah about event`}
                  value={agendaText}
                  onChange={(e) => setAgendaText(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleParseAgenda} 
                    disabled={isLoading || !agendaText.trim()}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Parse & Generate Tasks
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setAgendaText('');
                      setIsOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedCount} of {parsedTasks.length} selected
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      <Check className="h-3 w-3 mr-1" />
                      All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={deselectAll}>
                      <X className="h-3 w-3 mr-1" />
                      None
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {parsedTasks.map((task, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                          task.selected 
                            ? 'bg-primary/5 border-primary/30' 
                            : 'bg-muted/30 border-transparent opacity-60'
                        }`}
                        onClick={() => toggleTaskSelection(index)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.selected}
                            onCheckedChange={() => toggleTaskSelection(index)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{task.headline}</span>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getPriorityColor(task.priority)}`}
                              >
                                {task.priority}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              → {task.columnTitle}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleAddSelectedTasks}
                    disabled={isAdding || selectedCount === 0}
                    className="flex-1"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add {selectedCount} Task{selectedCount !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setParsedTasks([]);
                    }}
                  >
                    Back
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
