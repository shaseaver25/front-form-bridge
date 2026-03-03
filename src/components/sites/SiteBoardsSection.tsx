import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Link2, ExternalLink, Kanban, Unlink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface SiteBoardsSectionProps {
  siteId: string;
  siteName: string;
}

export function SiteBoardsSection({ siteId, siteName }: SiteBoardsSectionProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState("");

  // Fetch boards linked to this site
  const { data: linkedBoards, isLoading } = useQuery({
    queryKey: ["site-boards", siteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boards")
        .select("id, name, description, created_at, board_type")
        .eq("linked_site_id", siteId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all boards not linked to any site (for linking)
  const { data: availableBoards } = useQuery({
    queryKey: ["unlinked-boards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boards")
        .select("id, name")
        .is("linked_site_id", null)
        .eq("is_archived", false)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createBoard = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("boards")
        .insert({
          name,
          created_by: user.id,
          linked_site_id: siteId,
          board_type: "general",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["site-boards", siteId] });
      toast.success("Board created");
      setIsCreateOpen(false);
      setNewBoardName("");
      navigate(`/boards/${data.id}`);
    },
    onError: () => {
      toast.error("Failed to create board");
    },
  });

  const linkBoard = useMutation({
    mutationFn: async (boardId: string) => {
      const { error } = await supabase
        .from("boards")
        .update({ linked_site_id: siteId })
        .eq("id", boardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-boards", siteId] });
      queryClient.invalidateQueries({ queryKey: ["unlinked-boards"] });
      toast.success("Board linked to site");
      setIsLinkOpen(false);
      setSelectedBoardId("");
    },
    onError: () => {
      toast.error("Failed to link board");
    },
  });

  const unlinkBoard = useMutation({
    mutationFn: async (boardId: string) => {
      const { error } = await supabase
        .from("boards")
        .update({ linked_site_id: null })
        .eq("id", boardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-boards", siteId] });
      queryClient.invalidateQueries({ queryKey: ["unlinked-boards"] });
      toast.success("Board unlinked");
    },
    onError: () => {
      toast.error("Failed to unlink board");
    },
  });

  const handleCreate = () => {
    if (!newBoardName.trim()) return;
    createBoard.mutate(newBoardName.trim());
  };

  const handleLink = () => {
    if (!selectedBoardId) return;
    linkBoard.mutate(selectedBoardId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Kanban className="h-5 w-5" />
            Kanban Boards
          </CardTitle>
          <CardDescription>Project boards for this site</CardDescription>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Board</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Board Name</Label>
                  <Input
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder={`e.g., ${siteName} Onboarding`}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!newBoardName.trim() || createBoard.isPending}
                  >
                    {createBoard.isPending ? "Creating..." : "Create & Open"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!availableBoards?.length}>
                <Link2 className="mr-2 h-4 w-4" />
                Link Existing
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Link Existing Board</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Board</Label>
                  <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a board" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBoards?.map((board) => (
                        <SelectItem key={board.id} value={board.id}>
                          {board.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsLinkOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleLink}
                    disabled={!selectedBoardId || linkBoard.isPending}
                  >
                    {linkBoard.isPending ? "Linking..." : "Link Board"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!linkedBoards?.length ? (
          <EmptyState
            type="no-data"
            entityName="Board"
            onAction={() => setIsCreateOpen(true)}
            actionLabel="Create Board"
          />
        ) : (
          <div className="space-y-3">
            {linkedBoards.map((board) => (
              <div
                key={board.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Kanban className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{board.name}</p>
                    {board.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {board.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created {format(new Date(board.created_at!), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/boards/${board.id}`)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Unlink Board</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the board from this site. The board will not be deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => unlinkBoard.mutate(board.id)}>
                          Unlink
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
