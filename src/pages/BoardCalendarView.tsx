import { useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useBoardsAccess } from "@/hooks/useBoardsAccess";
import { BoardsUpgradePrompt } from "@/components/boards/BoardsUpgradePrompt";
import { Skeleton } from "@/components/ui/skeleton";

export default function BoardCalendarView() {
  const { boardId } = useParams();
  const { hasAccess, isLoading } = useBoardsAccess();

  if (isLoading) {
    return (
      <Layout>
        <Skeleton className="h-96 w-full" />
      </Layout>
    );
  }

  if (!hasAccess) {
    return (
      <Layout>
        <BoardsUpgradePrompt />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Calendar View</h1>
        <p className="text-muted-foreground">Board ID: {boardId}</p>
        {/* Calendar implementation will go here */}
      </div>
    </Layout>
  );
}
