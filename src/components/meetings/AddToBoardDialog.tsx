import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranscriptTasks } from '@/hooks/useTranscriptTasks';
import type { MeetingTranscriptTask } from '@/hooks/useMeetingTranscripts';

interface AddToBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: MeetingTranscriptTask;
}

export function AddToBoardDialog({ open, onOpenChange, task }: AddToBoardDialogProps) {
  const { approveTask, isApproving } = useTranscriptTasks();
  
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');

  // Fetch boards
  const { data: boards = [] } = useQuery({
    queryKey: ['boards-for-dialog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boards')
        .select('id, name')
        .eq('is_archived', false)
        .eq('is_template', false)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  // Fetch columns for selected board
  const { data: columns = [] } = useQuery({
    queryKey: ['board-columns-for-dialog', selectedBoardId],
    queryFn: async () => {
      if (!selectedBoardId) return [];
      
      const { data, error } = await supabase
        .from('board_columns')
        .select('id, title')
        .eq('board_id', selectedBoardId)
        .order('position');

      if (error) throw error;
      return data;
    },
    enabled: !!selectedBoardId,
  });

  const handleSubmit = async () => {
    if (!selectedBoardId || !selectedColumnId) return;

    await approveTask({
      taskId: task.id,
      dueDate: task.due_date || undefined,
      priority: task.priority,
      boardId: selectedBoardId,
      columnId: selectedColumnId,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Project Board</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">{task.task_text}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="board-select">Select Board</Label>
            <Select value={selectedBoardId} onValueChange={(v) => {
              setSelectedBoardId(v);
              setSelectedColumnId('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a board" />
              </SelectTrigger>
              <SelectContent>
                {boards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBoardId && (
            <div className="space-y-2">
              <Label htmlFor="column-select">Select Column</Label>
              <Select value={selectedColumnId} onValueChange={setSelectedColumnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedBoardId || !selectedColumnId || isApproving}
          >
            {isApproving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add to Board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
