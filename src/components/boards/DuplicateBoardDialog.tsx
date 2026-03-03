import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Copy } from 'lucide-react';
import { useDuplicateBoard } from '@/hooks/useBoardTemplates';

interface DuplicateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  boardName: string;
}

export function DuplicateBoardDialog({
  open,
  onOpenChange,
  boardId,
  boardName,
}: DuplicateBoardDialogProps) {
  const navigate = useNavigate();
  const [newName, setNewName] = useState(`${boardName} (Copy)`);
  const [titleSuffix, setTitleSuffix] = useState('');
  const [options, setOptions] = useState({
    includeDescriptions: true,
    includeSubtasks: true,
    includeLabels: true,
    includeAutomations: true,
    includeAssignees: false,
  });

  const duplicateBoard = useDuplicateBoard();

  const toggleOption = (key: keyof typeof options) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDuplicate = async () => {
    const result = await duplicateBoard.mutateAsync({
      boardId,
      newName,
      titleSuffix: titleSuffix.trim() || undefined,
      options,
    });
    onOpenChange(false);
    navigate(`/projects/${result.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicate Board</DialogTitle>
          <DialogDescription>
            Create a copy of this board with all its columns and cards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-board-name">New Board Name</Label>
            <Input
              id="new-board-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new board name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title-suffix">
              Append to Card Titles (optional)
            </Label>
            <Input
              id="title-suffix"
              value={titleSuffix}
              onChange={(e) => setTitleSuffix(e.target.value)}
              placeholder="e.g., [Board Member Name]"
            />
            <p className="text-xs text-muted-foreground">
              This text will be added to the end of each card title
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-muted-foreground text-sm">Include in copy:</Label>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-descriptions"
                  checked={options.includeDescriptions}
                  onCheckedChange={() => toggleOption('includeDescriptions')}
                />
                <Label htmlFor="include-descriptions" className="text-sm font-normal cursor-pointer">
                  Card descriptions
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-subtasks"
                  checked={options.includeSubtasks}
                  onCheckedChange={() => toggleOption('includeSubtasks')}
                />
                <Label htmlFor="include-subtasks" className="text-sm font-normal cursor-pointer">
                  Subtasks
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-automations"
                  checked={options.includeAutomations}
                  onCheckedChange={() => toggleOption('includeAutomations')}
                />
                <Label htmlFor="include-automations" className="text-sm font-normal cursor-pointer">
                  Automations
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-assignees"
                  checked={options.includeAssignees}
                  onCheckedChange={() => toggleOption('includeAssignees')}
                />
                <Label htmlFor="include-assignees" className="text-sm font-normal cursor-pointer">
                  Card assignees
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={!newName.trim() || duplicateBoard.isPending}
          >
            {duplicateBoard.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Duplicating...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
