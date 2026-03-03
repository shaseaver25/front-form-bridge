import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  LayoutGrid, 
  Plus, 
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCreateBoard } from "@/hooks/useBoardData";

interface GrantProjectBoardProps {
  grantId: string;
  grantTitle: string;
  funderName?: string;
  deadline?: string | null;
  amount?: number | null;
}

interface BoardWithStats {
  id: string;
  name: string;
  theme_color: string;
  totalCards: number;
  completedCards: number;
  overdueCards: number;
}

export function GrantProjectBoard({ 
  grantId, 
  grantTitle, 
  funderName, 
  deadline, 
  amount 
}: GrantProjectBoardProps) {
  const navigate = useNavigate();
  const createBoard = useCreateBoard();
  const [linkedBoard, setLinkedBoard] = useState<BoardWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchLinkedBoard();
  }, [grantId]);

  const fetchLinkedBoard = async () => {
    setLoading(true);
    
    // Find board linked to this grant
    const { data: boards, error } = await supabase
      .from('boards')
      .select('id, name, theme_color')
      .eq('linked_grant_id', grantId)
      .eq('is_archived', false)
      .limit(1);

    if (error) {
      console.error('Failed to fetch linked board:', error);
    }

    const board = boards?.[0];

    if (board) {
      // Get card stats
      const { data: cards } = await supabase
        .from('board_cards')
        .select('id, completed_at, due_date')
        .eq('board_id', board.id);

      const now = new Date();
      const totalCards = cards?.length || 0;
      const completedCards = cards?.filter(c => c.completed_at).length || 0;
      const overdueCards = cards?.filter(c => 
        c.due_date && !c.completed_at && new Date(c.due_date) < now
      ).length || 0;

      setLinkedBoard({
        ...board,
        totalCards,
        completedCards,
        overdueCards,
      });
    } else {
      setLinkedBoard(null);
    }

    setLoading(false);
  };

  const handleCreateBoard = async () => {
    setCreating(true);
    try {
      console.warn('Creating board for grant:', grantId, grantTitle);
      
      const result = await createBoard.mutateAsync({
        name: `${grantTitle} - Project Board`,
        board_type: 'grant_application',
        description: funderName ? `Project board for ${funderName} grant application` : undefined,
      });

      console.warn('Board created:', result);

      // Link board to grant
      const { error: linkError } = await supabase
        .from('boards')
        .update({ linked_grant_id: grantId })
        .eq('id', result.id);

      if (linkError) {
        console.error('Error linking board to grant:', linkError);
        throw linkError;
      }

      // Create grant-specific columns - delete existing first
      const { error: deleteError } = await supabase
        .from('board_columns')
        .delete()
        .eq('board_id', result.id);

      if (deleteError) {
        console.error('Error deleting default columns:', deleteError);
      }

      const grantColumns = [
        { board_id: result.id, title: 'Research', position: 0, column_type: 'backlog' as const },
        { board_id: result.id, title: 'Draft', position: 1, column_type: 'in_progress' as const },
        { board_id: result.id, title: 'Review', position: 2, column_type: 'review' as const },
        { board_id: result.id, title: 'Submit', position: 3, column_type: 'todo' as const },
        { board_id: result.id, title: 'Report', position: 4, column_type: 'done' as const, is_done_column: true },
      ];

      const { error: columnsError } = await supabase.from('board_columns').insert(grantColumns);
      
      if (columnsError) {
        console.error('Error creating columns:', columnsError);
      }

      toast.success("Project board created");
      fetchLinkedBoard();
      navigate(`/projects/${result.id}`);
    } catch (error: unknown) {
      console.error('Failed to create board:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create board");
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Project Board
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!linkedBoard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Project Board
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <LayoutGrid className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-4">
              No project board linked to this grant yet.
            </p>
            <Button onClick={handleCreateBoard} disabled={creating}>
              <Plus className="w-4 h-4 mr-2" />
              {creating ? 'Creating...' : 'Create Project Board'}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Track grant application tasks, deadlines, and team collaboration
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = linkedBoard.totalCards > 0 
    ? Math.round((linkedBoard.completedCards / linkedBoard.totalCards) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            Project Board
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate(`/projects/${linkedBoard.id}`)}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Open Board
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Board Name */}
        <div 
          className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate(`/projects/${linkedBoard.id}`)}
        >
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: `var(--${linkedBoard.theme_color || 'primary'})` }}
            />
            <span className="font-medium">{linkedBoard.name}</span>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Clock className="w-3 h-3" />
            </div>
            <p className="text-2xl font-bold">{linkedBoard.totalCards}</p>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/5">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <CheckCircle2 className="w-3 h-3" />
            </div>
            <p className="text-2xl font-bold text-primary">{linkedBoard.completedCards}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className={`text-center p-3 rounded-lg ${linkedBoard.overdueCards > 0 ? 'bg-destructive/5' : 'bg-muted/50'}`}>
            <div className={`flex items-center justify-center gap-1 mb-1 ${linkedBoard.overdueCards > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              <AlertCircle className="w-3 h-3" />
            </div>
            <p className={`text-2xl font-bold ${linkedBoard.overdueCards > 0 ? 'text-destructive' : ''}`}>
              {linkedBoard.overdueCards}
            </p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
