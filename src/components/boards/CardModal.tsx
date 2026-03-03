import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  X,
  Check,
  Ban,
  Trash2,
  MessageSquare,
  History,
  Plus,
  Sparkles,
  Loader2,
  GripVertical,
  ChevronDown,
  Timer,
  Clock,
  Play,
  Square,
  Link2,
  Search,
  Pencil,
  Copy,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useBoardContext } from "@/contexts/BoardContext";
import { CardDetailsForm } from "./CardDetailsForm";
import { CommentItem } from "./CommentItem";
import { QuestionForField } from "./QuestionForField";
import { TimeLogModal } from "./TimeLogModal";
import { TimerIndicator } from "./TimerIndicator";
import { BoardCard, BoardColumn, BoardCardWithDetails } from "@/types/boards";
import { useTimeTracking, formatMinutesAsHours } from "@/hooks/useTimeTracking";
import {
  useCardDetails,
  useCardDependencies,
  useAddDependency,
  useRemoveDependency,
} from "@/hooks/useBoardData";
import { useRealtimeCardDetails } from "@/hooks/useRealtimeCardDetails";
import { toast } from "sonner";

type CardDependency = {
  id: string;
  depends_on_card_id: string;
  depends_on_card: { id: string; headline: string; column_id: string; completed_at?: any } | null;
};

interface CardModalProps {
  card: BoardCardWithDetails;

  columns: BoardColumn[];
  isOpen: boolean;
  onClose: () => void;
}

// Simple debounce hook
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function CardModal({ card, columns, isOpen, onClose }: CardModalProps) {
  const { state, dispatch } = useBoardContext();
  const { members, cards } = state;

  // Fetch live card details (subtasks, comments, activity)
  const { data: cardDetailsData } = useCardDetails(card.id);

  // Subscribe to real-time updates
  useRealtimeCardDetails(card.id);

  // Fetch dependencies
  const { data: dependenciesData } = useCardDependencies(card.id);
  const addDependencyMutation = useAddDependency();
  const removeDependencyMutation = useRemoveDependency();

  // Get current user ID for comment ownership
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        setCurrentUserId(data.user?.id);
      });
    });
  }, []);

  // Local state for form
  const [headline, setHeadline] = useState(card.headline);
  const [description, setDescription] = useState(card.description || "");
  const [columnId, setColumnId] = useState(card.column_id);
  const [isBlocked, setIsBlocked] = useState(card.is_blocked || false);
  const [blockedReason, setBlockedReason] = useState(card.blocked_reason || "");
  const [questionFor, setQuestionFor] = useState<string | null>(card.question_for || null);
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTimeLogOpen, setIsTimeLogOpen] = useState(false);
  const [dependencySearch, setDependencySearch] = useState("");
  const [dependencyPopoverOpen, setDependencyPopoverOpen] = useState(false);
  const [cardDetails, setCardDetails] = useState<
    Partial<BoardCard> & { linked_board_id?: string | null }
  >({
    assigned_to: card.assigned_to,
    due_date: card.due_date,
    priority: card.priority,
    estimated_hours: card.estimated_hours,
    actual_hours: card.actual_hours,
    linked_contact_id: card.linked_contact_id,
    linked_grant_id: card.linked_grant_id,
    linked_donation_id: card.linked_donation_id,
    linked_board_id: card.linked_board_id || null,
  });

  const { activeTimer, elapsedTime, startTimer, stopTimer, logTime } = useTimeTracking();

  // Debounce headline and description
  const debouncedHeadline = useDebounceValue(headline, 500);
  const debouncedDescription = useDebounceValue(description, 500);
  const debouncedDetails = useDebounceValue(cardDetails, 500);

  // Save on debounced changes
  useEffect(() => {
    if (debouncedHeadline !== card.headline) {
      handleSave({ headline: debouncedHeadline });
    }
  }, [debouncedHeadline]);

  useEffect(() => {
    if (debouncedDescription !== (card.description || "")) {
      handleSave({ description: debouncedDescription });
    }
  }, [debouncedDescription]);

  useEffect(() => {
    const hasChanges = Object.entries(debouncedDetails).some(
      ([key, value]) => value !== card[key as keyof BoardCard]
    );
    if (hasChanges) {
      handleSave(debouncedDetails);
    }
  }, [debouncedDetails]);

  const handleSave = useCallback(
    async (updates: Partial<BoardCard>) => {
      setIsSaving(true);
      try {
        await dispatch.updateCard(card.id, updates);
      } finally {
        setIsSaving(false);
      }
    },
    [card.id, dispatch]
  );

  const handleColumnChange = async (newColumnId: string) => {
    setColumnId(newColumnId);
    await dispatch.moveCard(card.id, newColumnId, 0);
  };

  const handleToggleBlock = async () => {
    const newIsBlocked = !isBlocked;
    setIsBlocked(newIsBlocked);
    await handleSave({
      is_blocked: newIsBlocked,
      blocked_reason: newIsBlocked ? blockedReason : null,
    });
  };

  const handleMarkComplete = async () => {
    const doneColumn = columns.find((col) => col.is_done_column);
    if (doneColumn) {
      await dispatch.moveCard(card.id, doneColumn.id, 0);
      onClose();
    }
  };

  const handleDelete = async () => {
    await dispatch.deleteCard(card.id);
    onClose();
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    await dispatch.addSubtask(card.id, newSubtask.trim());
    setNewSubtask("");
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await dispatch.addComment(card.id, newComment.trim());
    setNewComment("");
  };

  // Use live data from the query
  const subtasks = cardDetailsData?.subtasks || [];
  const comments = cardDetailsData?.comments || [];
  const activity = cardDetailsData?.activity || [];

  const subtaskProgress =
    subtasks.length > 0
      ? (subtasks.filter((s) => s.is_completed).length / subtasks.length) * 100
      : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          {/* Left Column - Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <Input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="text-xl font-semibold border-none p-0 h-auto focus-visible:ring-0"
                    placeholder="Card title..."
                  />
                  <div className="flex items-center gap-2">
                    <Select value={columnId} onValueChange={handleColumnChange}>
                      <SelectTrigger className="w-auto h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((col) => (
                          <SelectItem key={col.id} value={col.id}>
                            {col.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isSaving && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Saving...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Description</h3>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description..."
                    className="min-h-[100px] resize-none"
                  />
                </div>

                {/* Blocked Alert */}
                {isBlocked && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive font-medium">
                      <Ban className="h-4 w-4" />
                      Card is Blocked
                    </div>
                    <Input
                      value={blockedReason}
                      onChange={(e) => setBlockedReason(e.target.value)}
                      onBlur={() => handleSave({ blocked_reason: blockedReason })}
                      placeholder="Reason for blocking..."
                      className="mt-2 bg-background"
                    />
                  </div>
                )}

                {/* Question For - Show when card is in a "Questions" column */}
                {columns
                  .find((c) => c.id === columnId)
                  ?.title.toLowerCase()
                  .includes("question") && (
                  <QuestionForField
                    cardId={card.id}
                    cardHeadline={headline}
                    boardId={card.board_id}
                    questionFor={questionFor}
                    onChange={(userId) => {
                      setQuestionFor(userId);
                      handleSave({ question_for: userId });
                    }}
                    isLoading={isSaving}
                  />
                )}

                {/* Subtasks */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Subtasks</h3>
                    {subtasks.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {subtasks.filter((s) => s.is_completed).length}/{subtasks.length}
                      </span>
                    )}
                  </div>

                  {subtasks.length > 0 && <Progress value={subtaskProgress} className="h-1.5" />}

                  <div className="space-y-2">
                    {subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2 group">
                        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
                        <Checkbox
                          checked={subtask.is_completed || false}
                          onCheckedChange={() =>
                            dispatch.toggleSubtask(
                              card.id,
                              subtask.id,
                              subtask.is_completed || false
                            )
                          }
                        />
                        <span
                          className={cn(
                            "flex-1 text-sm",
                            subtask.is_completed && "line-through text-muted-foreground"
                          )}
                        >
                          {subtask.text}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => dispatch.deleteSubtask(card.id, subtask.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      placeholder="Add a subtask..."
                      onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleAddSubtask}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Comments & Activity</h3>
                    {comments.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {comments.length}
                      </Badge>
                    )}
                  </div>

                  {/* Comment Input */}
                  <div className="flex gap-2 p-3 bg-muted/50 rounded-lg">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="min-h-[60px] resize-none flex-1 bg-background"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <div className="flex flex-col gap-1">
                      <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                        Send
                      </Button>
                      <span className="text-xs text-muted-foreground text-center">⌘↵</span>
                    </div>
                  </div>

                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="h-8">
                      <TabsTrigger value="all" className="text-xs">
                        All
                      </TabsTrigger>
                      <TabsTrigger value="comments" className="text-xs">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Comments
                      </TabsTrigger>
                      <TabsTrigger value="history" className="text-xs">
                        <History className="h-3 w-3 mr-1" />
                        History
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-3 space-y-3">
                      {comments.length === 0 && activity.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No activity yet
                        </p>
                      ) : (
                        <>
                          {comments.map((comment) => (
                            <CommentItem
                              key={comment.id}
                              comment={comment}
                              currentUserId={currentUserId}
                              onEdit={(commentId, content) =>
                                dispatch.updateComment(card.id, commentId, content)
                              }
                              onDelete={(commentId) => dispatch.deleteComment(card.id, commentId)}
                            />
                          ))}
                        </>
                      )}
                    </TabsContent>

                    <TabsContent value="comments" className="mt-3 space-y-3">
                      {comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No comments yet
                        </p>
                      ) : (
                        comments.map((comment) => (
                          <CommentItem
                            key={comment.id}
                            comment={comment}
                            currentUserId={currentUserId}
                            onEdit={(commentId, content) =>
                              dispatch.updateComment(card.id, commentId, content)
                            }
                            onDelete={(commentId) => dispatch.deleteComment(card.id, commentId)}
                          />
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="history" className="mt-3 space-y-3">
                      {activity.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No history yet
                        </p>
                      ) : (
                        activity.map((item) => (
                          <div key={item.id} className="flex gap-3 text-sm">
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                              <History className="h-3 w-3" />
                            </div>
                            <div className="flex-1">
                              <p className="text-muted-foreground">{item.activity_type}</p>
                              <span className="text-xs text-muted-foreground">
                                {item.created_at &&
                                  format(new Date(item.created_at), "MMM d, h:mm a")}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>

                  {(comments.length > 5 || activity.length > 5) && (
                    <Button variant="ghost" size="sm" className="w-full">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Summarize with AI
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right Column - Sidebar */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l bg-muted/30">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {/* Quick Actions */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleMarkComplete}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>

                    <Button
                      variant={isBlocked ? "destructive" : "outline"}
                      className="w-full justify-start"
                      onClick={handleToggleBlock}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      {isBlocked ? "Unblock Card" : "Block Card"}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => dispatch.duplicateCard(card.id, true)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate with Subtasks
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Card
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Card</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{card.headline}"? This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Time Tracking */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Time Tracking
                  </h3>

                  <div className="text-sm">
                    <span className="text-muted-foreground">Total logged: </span>
                    <span className="font-medium">
                      {card.actual_hours
                        ? formatMinutesAsHours(Math.round(card.actual_hours * 60))
                        : "0m"}
                    </span>
                  </div>

                  {activeTimer?.cardId === card.id ? (
                    <TimerIndicator elapsedSeconds={elapsedTime} onStop={stopTimer} />
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => startTimer(card.id)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Timer
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsTimeLogOpen(true)}>
                        <Timer className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Properties */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Properties</h3>
                  <CardDetailsForm
                    card={cardDetails}
                    members={members}
                    currentBoardId={card.board_id}
                    onChange={(updates) => setCardDetails((prev) => ({ ...prev, ...updates }))}
                    onAiEstimate={() => dispatch.getAiTimeEstimate(card.id)}
                    isLoading={isSaving}
                  />
                </div>

                {/* Dependencies */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Dependencies</h3>

                  {/* List existing dependencies */}
                  {dependenciesData?.dependsOn && dependenciesData.dependsOn.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Depends on:</p>
                      {dependenciesData.dependsOn.map((dep: any) => (
                        <div
                          key={dep.id}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-md group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate">
                              {dep.depends_on_card?.headline}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                            onClick={() =>
                              removeDependencyMutation.mutate({
                                dependencyId: dep.id,
                                cardId: card.id,
                                dependsOnCardId: dep.depends_on_card_id,
                              })
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No dependencies yet</div>
                  )}

                  {/* Add dependency button with popover */}
                  <Popover open={dependencyPopoverOpen} onOpenChange={setDependencyPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Dependency
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-2" align="start">
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search cards..."
                            value={dependencySearch}
                            onChange={(e) => setDependencySearch(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                        <ScrollArea className="max-h-48">
                          <div className="space-y-1">
                            {cards
                              .filter(
                                (c) =>
                                  c.id !== card.id &&
                                  c.headline
                                    .toLowerCase()
                                    .includes(dependencySearch.toLowerCase()) &&
                                   !(dependenciesData?.dependsOn as any[])?.some(
                                    (d: any) => d.depends_on_card_id === c.id
                                   )
                              )
                              .slice(0, 10)
                              .map((c) => (
                                <Button
                                  key={c.id}
                                  variant="ghost"
                                  className="w-full justify-start h-auto py-2 text-left"
                                  onClick={() => {
                                    addDependencyMutation.mutate(
                                      {
                                        cardId: card.id,
                                        dependsOnCardId: c.id,
                                      },
                                      {
                                        onSuccess: () => {
                                          toast.success("Dependency added");
                                          setDependencySearch("");
                                          setDependencyPopoverOpen(false);
                                        },
                                        onError: () => {
                                          toast.error("Failed to add dependency");
                                        },
                                      }
                                    );
                                  }}
                                >
                                  <span className="text-sm truncate">{c.headline}</span>
                                </Button>
                              ))}
                            {cards.filter(
                              (c) =>
                                c.id !== card.id &&
                                c.headline.toLowerCase().includes(dependencySearch.toLowerCase()) &&
                                !(dependenciesData?.dependsOn as any[])?.some(
                                  (d: any) => d.depends_on_card_id === c.id
                                )
                            ).length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-2">
                                No cards found
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button variant="ghost" size="sm" className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Suggest Dependencies
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>

      <TimeLogModal
        isOpen={isTimeLogOpen}
        onClose={() => setIsTimeLogOpen(false)}
        onSave={(minutes, notes) => logTime(card.id, minutes, notes)}
        cardHeadline={card.headline}
      />
    </Dialog>
  );
}
