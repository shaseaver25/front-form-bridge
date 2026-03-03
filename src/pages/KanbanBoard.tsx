import { useParams, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import { BoardProvider } from "@/contexts/BoardContext";
import { KanbanBoardView } from "@/components/boards/KanbanBoardView";
import { useBoardsAccess } from "@/hooks/useBoardsAccess";
import { BoardsUpgradePrompt } from "@/components/boards/BoardsUpgradePrompt";

export default function KanbanBoard() {
  const { boardId } = useParams();
  const { hasAccess, isLoading } = useBoardsAccess();

  if (!boardId) {
    return <Navigate to="/projects" replace />;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!hasAccess) {
    return (
      <Layout>
        <div className="p-8">
          <BoardsUpgradePrompt />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <TooltipProvider>
        <BoardProvider boardId={boardId}>
          <div className="h-[calc(100vh-4rem)]">
            <KanbanBoardView />
          </div>
        </BoardProvider>
      </TooltipProvider>
    </Layout>
  );
}
