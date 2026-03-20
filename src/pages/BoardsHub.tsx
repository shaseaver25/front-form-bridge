import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { NewBoardModal } from "@/components/boards";
import { CreateFromTemplateDialog } from "@/components/boards/CreateFromTemplateDialog";
import { AssignProjectDialog } from "@/components/boards/AssignProjectDialog";
import { supabase } from "@/integrations/supabase/client";
import { useBoardsAccess } from "@/hooks/useBoardsAccess";
import { BoardsUpgradePrompt } from "@/components/boards/BoardsUpgradePrompt";
import { useDeleteBoard } from "@/hooks/useBoardData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Plus, Search, Kanban, Users, LayoutGrid, Archive, MoreVertical, Link, Calendar, Trash2, LayoutTemplate, UserPlus, Flag, AlertTriangle, ArrowUp, ArrowDown, Circle, CalendarDays, Lightbulb, Landmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow, format, isPast, isToday, isTomorrow, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type BoardPriority = 'low' | 'medium' | 'high' | 'urgent';

const priorityConfig: Record<BoardPriority, { label: string; icon: React.ReactNode; color: string }> = {
  low: { label: 'Low', icon: <ArrowDown className="w-4 h-4" />, color: 'text-emerald-600' },
  medium: { label: 'Medium', icon: <Circle className="w-4 h-4" />, color: 'text-amber-600' },
  high: { label: 'High', icon: <ArrowUp className="w-4 h-4" />, color: 'text-orange-600' },
  urgent: { label: 'Urgent', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-600' },
};

type BoardFilter = "all" | "my-boards" | "ideas" | "board-of-directors" | "archived";

export default function BoardsHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasAccess, isLoading: accessLoading } = useBoardsAccess();
  const [filter, setFilter] = useState<BoardFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<{ id: string; name: string } | null>(null);
  const [boardToAssign, setBoardToAssign] = useState<{ id: string; name: string; assignedTo: string | null } | null>(null);
  const [showCreateFromTemplate, setShowCreateFromTemplate] = useState(false);
  const isNewRoute = location.pathname === "/projects/new";
  const deleteBoard = useDeleteBoard();
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Mutation to update board priority
  const updateBoardPriority = useMutation({
    mutationFn: async ({ boardId, priority }: { boardId: string; priority: BoardPriority }) => {
      const { error } = await supabase
        .from('boards')
        .update({ priority })
        .eq('id', boardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', filter] });
      toast.success('Priority updated');
    },
    onError: () => {
      toast.error('Failed to update priority');
    }
  });

  // Mutation to update board end date
  const updateBoardEndDate = useMutation({
    mutationFn: async ({ boardId, endDate }: { boardId: string; endDate: string | null }) => {
      const { error } = await supabase
        .from('boards')
        .update({ end_date: endDate })
        .eq('id', boardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', filter] });
      toast.success('End date updated');
    },
    onError: () => {
      toast.error('Failed to update end date');
    }
  });

  // Fetch user profiles for displaying assignee names
  const { data: userProfiles } = useQuery({
    queryKey: ['user-profiles-minimal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name');
      if (error) throw error;
      return data;
    },
    enabled: hasAccess
  });

  const getUserName = (userId: string | null) => {
    if (!userId) return null;
    const user = userProfiles?.find(u => u.id === userId);
    if (!user) return null;
    return [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Unknown';
  };

  const getUserInitials = (userId: string | null) => {
    if (!userId) return null;
    const user = userProfiles?.find(u => u.id === userId);
    if (!user) return '?';
    return [user.first_name?.[0], user.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';
  };

  const { data: boards, isLoading: boardsLoading } = useQuery({
    queryKey: ["boards", filter],
    queryFn: async () => {
      let query = supabase
        .from("boards")
        .select(`
          *,
          board_columns(id),
          board_cards!board_cards_board_id_fkey(id),
          board_members(id, user_id)
        `)
        .order("updated_at", { ascending: false });

      if (filter === "archived") {
        query = query.eq("is_archived", true);
      } else {
        query = query.eq("is_archived", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: hasAccess,
  });

  const filteredBoards = boards?.filter((board) => {
    const matchesSearch = board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      board.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || board.board_type === typeFilter;
    
    // For "ideas" filter, only show boards without an assigned owner
    if (filter === "ideas") {
      return matchesSearch && matchesType && !board.assigned_to;
    }
    // For "my-boards" filter, show boards where user is assigned, is creator, or is a member
    if (filter === "my-boards") {
      const isMine = board.assigned_to === currentUserId ||
        board.created_by === currentUserId ||
        board.board_members?.some((m: any) => m.user_id === currentUserId);
      return matchesSearch && matchesType && isMine;
    }
    // For "all" filter, show every non-archived board
    if (filter === "all") {
      return matchesSearch && matchesType;
    }
    
    return matchesSearch && matchesType;
  });

  const boardTypes = [
    { value: "general", label: "General" },
    { value: "grant_application", label: "Grant Application" },
    { value: "event", label: "Event" },
    { value: "campaign", label: "Campaign" },
    { value: "program", label: "Program" },
  ];

  const themeColors: Record<string, string> = {
    teal: "border-l-teal-500",
    blue: "border-l-blue-500",
    purple: "border-l-purple-500",
    orange: "border-l-orange-500",
    pink: "border-l-pink-500",
    green: "border-l-green-500",
  };

  if (accessLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
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
      <NewBoardModal
        open={isNewRoute}
        onOpenChange={(open) => {
          if (!open && location.pathname === "/projects/new") {
            navigate("/projects");
          }
        }}
      />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground">Manage your work visually</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowCreateFromTemplate(true)}>
              <LayoutTemplate className="w-4 h-4 mr-2" />
              From Template
            </Button>
            <Button variant="outline" onClick={() => navigate("/projects/templates")}>
              Manage Templates
            </Button>
            <Button onClick={() => navigate("/projects/new")}>
              <Plus className="w-4 h-4 mr-2" />
              New Board
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as BoardFilter)}>
            <TabsList>
              <TabsTrigger value="all">
                <LayoutGrid className="w-4 h-4 mr-2" />
                All
              </TabsTrigger>
              <TabsTrigger value="my-boards">
                <Users className="w-4 h-4 mr-2" />
                My Boards
              </TabsTrigger>
              <TabsTrigger value="ideas">
                <Lightbulb className="w-4 h-4 mr-2" />
                Ideas
              </TabsTrigger>
              <TabsTrigger value="archived">
                <Archive className="w-4 h-4 mr-2" />
                Archived
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {typeFilter ? boardTypes.find(t => t.value === typeFilter)?.label : "All Types"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTypeFilter(null)}>All Types</DropdownMenuItem>
              {boardTypes.map((type) => (
                <DropdownMenuItem key={type.value} onClick={() => setTypeFilter(type.value)}>
                  {type.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Board Grid */}
        {boardsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredBoards && filteredBoards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBoards.map((board) => {
              const isIdea = !board.assigned_to;
              return (
              <Card
                key={board.id}
                className={cn(
                  "cursor-pointer hover:shadow-md transition-shadow group border-l-4",
                  isIdea 
                    ? "bg-amber-50 dark:bg-amber-950/40 border-l-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60" 
                    : themeColors[board.theme_color] || themeColors.teal
                )}
                onClick={() => navigate(`/projects/${board.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{board.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8 transition-all",
                              isIdea 
                                ? "text-amber-600 bg-amber-200/50 hover:bg-amber-200" 
                                : "opacity-0 group-hover:opacity-100 hover:text-amber-600 hover:bg-amber-100"
                            )}
                            onClick={async (e) => {
                              e.stopPropagation();
                              const newAssignedTo = isIdea ? currentUserId : null;
                              const { error } = await supabase
                                .from('boards')
                                .update({ assigned_to: newAssignedTo })
                                .eq('id', board.id);
                              if (error) {
                                toast.error('Failed to update board');
                              } else {
                                queryClient.invalidateQueries({ queryKey: ['boards', filter] });
                                toast.success(isIdea ? 'Assigned to you' : 'Marked as idea');
                              }
                            }}
                          >
                            <Lightbulb className={cn("w-4 h-4", isIdea && "fill-amber-400")} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isIdea ? 'Assign to me' : 'Mark as idea'}
                        </TooltipContent>
                      </Tooltip>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/projects/${board.id}`); }}>
                          <Kanban className="w-4 h-4 mr-2" />
                          Open Board
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/projects/${board.id}/calendar`); }}>
                          <Calendar className="w-4 h-4 mr-2" />
                          Calendar View
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                            <Flag className="w-4 h-4 mr-2" />
                            Set Priority
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {(Object.keys(priorityConfig) as BoardPriority[]).map((priority) => (
                              <DropdownMenuItem
                                key={priority}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateBoardPriority.mutate({ boardId: board.id, priority });
                                }}
                                className={cn(priorityConfig[priority].color, board.priority === priority && 'bg-muted')}
                              >
                                {priorityConfig[priority].icon}
                                <span className="ml-2">{priorityConfig[priority].label}</span>
                                {board.priority === priority && <span className="ml-auto">✓</span>}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setBoardToAssign({ id: board.id, name: board.name, assignedTo: board.assigned_to });
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Assign Owner
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={async (e) => { 
                            e.stopPropagation();
                            const newAssignedTo = isIdea ? currentUserId : null;
                            const { error } = await supabase
                              .from('boards')
                              .update({ assigned_to: newAssignedTo })
                              .eq('id', board.id);
                            if (error) {
                              toast.error('Failed to update board');
                            } else {
                              queryClient.invalidateQueries({ queryKey: ['boards', filter] });
                              toast.success(isIdea ? 'Board assigned to you' : 'Marked as idea');
                            }
                          }}
                          className={isIdea ? "" : "text-amber-600 focus:text-amber-600"}
                        >
                          <Lightbulb className={cn("w-4 h-4 mr-2", isIdea ? "" : "fill-amber-200")} />
                          {isIdea ? 'Assign to Me' : 'Mark as Idea'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setBoardToDelete({ id: board.id, name: board.name });
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </div>
                  {board.description && (
                    <CardDescription className="line-clamp-2">{board.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Kanban className="w-4 h-4" />
                      <span>{board.board_cards?.length || 0} cards</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{board.board_members?.length || 0} members</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="capitalize">
                        {board.board_type?.replace("_", " ")}
                      </Badge>
                      {board.volunteers_needed && (
                        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 gap-1">
                          <Users className="w-3 h-3" />
                          Volunteers Needed
                        </Badge>
                      )}
                      {board.priority && board.priority !== 'medium' && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs px-1.5 py-0 gap-1",
                            board.priority === 'urgent' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                            board.priority === 'high' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                            board.priority === 'low' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          )}
                        >
                          {priorityConfig[board.priority as BoardPriority]?.icon}
                          {priorityConfig[board.priority as BoardPriority]?.label}
                        </Badge>
                      )}
                      {board.linked_grant_id && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Link className="w-3 h-3" />
                          Linked
                        </div>
                      )}
                    </div>
                    {board.assigned_to ? (
                      <Tooltip>
                        <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button
                            className="flex items-center gap-1.5 hover:bg-muted rounded-md px-1.5 py-0.5 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBoardToAssign({ id: board.id, name: board.name, assignedTo: board.assigned_to });
                            }}
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[10px]">
                                {getUserInitials(board.assigned_to)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground max-w-[80px] truncate">
                              {getUserName(board.assigned_to)}
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Assigned to {getUserName(board.assigned_to)}</p>
                          <p className="text-xs text-muted-foreground">Click to reassign</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <button
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBoardToAssign({ id: board.id, name: board.name, assignedTo: null });
                        }}
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Assign
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(board.updated_at), { addSuffix: true })}
                    </p>
                    <Popover>
                      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button
                          className={cn(
                            "flex items-center gap-1 text-xs transition-colors rounded-md px-1.5 py-0.5",
                            board.end_date 
                              ? (() => {
                                  const date = parseISO(board.end_date);
                                  if (isPast(date) && !isToday(date)) return "text-destructive bg-destructive/10";
                                  if (isToday(date)) return "text-amber-600 bg-amber-100 dark:bg-amber-900/30";
                                  if (isTomorrow(date)) return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
                                  return "text-muted-foreground hover:bg-muted";
                                })()
                              : "text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100"
                          )}
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          {board.end_date ? (
                            <span>
                              {(() => {
                                const date = parseISO(board.end_date);
                                if (isPast(date) && !isToday(date)) return 'Overdue';
                                if (isToday(date)) return 'Due today';
                                if (isTomorrow(date)) return 'Due tomorrow';
                                return format(date, 'MMM d');
                              })()}
                            </span>
                          ) : (
                            <span>Set end date</span>
                          )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end" onClick={(e) => e.stopPropagation()}>
                        <CalendarComponent
                          mode="single"
                          selected={board.end_date ? parseISO(board.end_date) : undefined}
                          onSelect={(date) => {
                            const dateStr = date ? format(date, 'yyyy-MM-dd') : null;
                            updateBoardEndDate.mutate({ boardId: board.id, endDate: dateStr });
                          }}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                        {board.end_date && (
                          <div className="border-t p-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full text-muted-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateBoardEndDate.mutate({ boardId: board.id, endDate: null as string | null });
                              }}
                            >
                              Clear date
                            </Button>
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                <Kanban className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No project boards yet</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-4">
                Create your first board to start organizing work visually.
              </p>
              <Button onClick={() => navigate("/projects/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Board
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!boardToDelete} onOpenChange={(open) => !open && setBoardToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{boardToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the board and all its cards, columns, and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (boardToDelete) {
                  deleteBoard.mutate(boardToDelete.id, {
                    onSuccess: () => {
                      toast.success("Board deleted");
                      setBoardToDelete(null);
                    },
                    onError: () => {
                      toast.error("Failed to delete board");
                    },
                  });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create from Template Dialog */}
      <CreateFromTemplateDialog
        open={showCreateFromTemplate}
        onOpenChange={setShowCreateFromTemplate}
      />

      {/* Assign Project Dialog */}
      {boardToAssign && (
        <AssignProjectDialog
          open={!!boardToAssign}
          onOpenChange={(open) => !open && setBoardToAssign(null)}
          projectId={boardToAssign.id}
          projectName={boardToAssign.name}
          currentAssignee={boardToAssign.assignedTo}
        />
      )}
    </Layout>
  );
}
