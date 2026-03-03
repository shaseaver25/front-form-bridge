import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  ChevronDown,
  ChevronRight,
  Mail,
  Calendar as CalendarIcon,
  Link2,
  AlertCircle,
  Inbox
} from "lucide-react";

interface TaskSuggestion {
  id: string;
  suggested_title: string;
  suggested_description: string | null;
  suggested_due_date: string | null;
  suggested_priority: string | null;
  suggested_category: string | null;
  ai_confidence: number;
  ai_reasoning: string | null;
  source_snippet: string | null;
  matched_constituent_id: string | null;
  matched_grant_opportunity_id: string | null;
  status: string;
  created_at: string;
  processed_emails: {
    subject: string;
    sender_name: string | null;
    sender_email: string;
    received_at: string;
  };
}

export default function EmailTaskSuggestionsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<{ category: string; confidence: string }>({
    category: "all",
    confidence: "all",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    title: string;
    due_date: string | null;
    priority: string;
  }>({ title: "", due_date: null, priority: "medium" });

  useEffect(() => {
    loadSuggestions();
  }, []);

  async function loadSuggestions() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_task_suggestions")
        .select(`
          *,
          processed_emails (
            subject,
            sender_name,
            sender_email,
            received_at
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error: unknown) {
      console.error("Error loading suggestions:", error);
      toast.error("Failed to load suggestions");
    } finally {
      setLoading(false);
    }
  }

  async function syncInbox() {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-user-inbox", {});
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(`Found ${data.tasks_found} new task suggestions`);
        loadSuggestions();
      } else {
        toast.error(data?.error || "Sync failed");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to sync inbox");
    } finally {
      setSyncing(false);
    }
  }

  async function approveSuggestion(id: string, edits?: { title?: string; due_date?: string; priority?: string }) {
    try {
      const { data, error } = await supabase.functions.invoke("approve-task-suggestion", {
        body: { suggestion_id: id, edits },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Task created");
        setSuggestions(prev => prev.filter(s => s.id !== id));
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        toast.error(data?.error || "Failed to create task");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to approve");
    }
  }

  async function dismissSuggestion(id: string) {
    try {
      const { data, error } = await supabase.functions.invoke("dismiss-task-suggestion", {
        body: { suggestion_id: id },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Suggestion dismissed");
        setSuggestions(prev => prev.filter(s => s.id !== id));
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to dismiss");
    }
  }

  async function bulkApprove() {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await approveSuggestion(id);
    }
  }

  async function bulkDismiss() {
    try {
      const { data, error } = await supabase.functions.invoke("dismiss-task-suggestion", {
        body: { suggestion_ids: Array.from(selectedIds) },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Dismissed ${data.dismissed} suggestions`);
        loadSuggestions();
        setSelectedIds(new Set());
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to dismiss");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === filteredSuggestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredSuggestions.map(s => s.id)));
    }
  }

  function getConfidenceColor(confidence: number) {
    if (confidence >= 0.8) return "text-green-600 bg-green-50";
    if (confidence >= 0.6) return "text-yellow-600 bg-yellow-50";
    return "text-orange-600 bg-orange-50";
  }

  function getCategoryBadge(category: string | null) {
    const colors: Record<string, string> = {
      grant: "bg-purple-100 text-purple-700",
      donor: "bg-blue-100 text-blue-700",
      meeting: "bg-green-100 text-green-700",
      follow_up: "bg-yellow-100 text-yellow-700",
      general: "bg-gray-100 text-gray-700",
    };
    return colors[category || "general"] || colors.general;
  }

  function getPriorityBadge(priority: string | null) {
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-green-100 text-green-700",
    };
    return colors[priority || "medium"] || colors.medium;
  }

  const filteredSuggestions = suggestions.filter(s => {
    if (filter.category !== "all" && s.suggested_category !== filter.category) return false;
    if (filter.confidence === "high" && (s.ai_confidence || 0) < 0.8) return false;
    if (filter.confidence === "medium" && (s.ai_confidence || 0) < 0.6) return false;
    return true;
  });

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 max-w-4xl">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
          </div>
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" />
              AI Task Suggestions
            </h1>
            <p className="text-muted-foreground">
              Review tasks extracted from your emails
            </p>
          </div>
          <Button onClick={syncInbox} disabled={syncing}>
            {syncing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Inbox className="h-4 w-4 mr-2" />
            )}
            Sync Inbox
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={filter.category} onValueChange={v => setFilter(prev => ({ ...prev, category: v }))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="grant">Grant</SelectItem>
              <SelectItem value="donor">Donor</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filter.confidence} onValueChange={v => setFilter(prev => ({ ...prev, confidence: v }))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Confidence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Confidence</SelectItem>
              <SelectItem value="high">High (80%+)</SelectItem>
              <SelectItem value="medium">Medium+ (60%+)</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant="secondary" className="ml-auto">
            {filteredSuggestions.length} suggestion{filteredSuggestions.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <Card className="p-3 bg-muted/50">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedIds.size === filteredSuggestions.length}
                onCheckedChange={selectAll}
              />
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" onClick={bulkApprove}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve Selected
                </Button>
                <Button size="sm" variant="outline" onClick={bulkDismiss}>
                  <X className="h-4 w-4 mr-1" />
                  Dismiss Selected
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {filteredSuggestions.length === 0 && (
          <Card className="p-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No pending suggestions</h3>
            <p className="text-muted-foreground mt-1">
              When AI finds actionable items in your emails, they'll appear here for review.
            </p>
            <Button className="mt-4" variant="outline" onClick={() => navigate("/settings/email")}>
              <Mail className="h-4 w-4 mr-2" />
              Configure Email Integration
            </Button>
          </Card>
        )}

        {/* Suggestion List */}
        <div className="space-y-3">
          {filteredSuggestions.map(suggestion => (
            <Card key={suggestion.id} className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(suggestion.id)}
                    onCheckedChange={() => toggleSelect(suggestion.id)}
                    className="mt-1"
                  />

                  <div className="flex-1 min-w-0">
                    {/* Title Row */}
                    <div className="flex items-start gap-2">
                      {editingId === suggestion.id ? (
                        <Input
                          value={editValues.title}
                          onChange={e => setEditValues(prev => ({ ...prev, title: e.target.value }))}
                          className="flex-1"
                          autoFocus
                        />
                      ) : (
                        <h3 className="font-medium text-base">{suggestion.suggested_title}</h3>
                      )}
                    </div>

                    {/* Meta Row */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge className={cn("text-xs", getConfidenceColor(suggestion.ai_confidence || 0))}>
                        {Math.round((suggestion.ai_confidence || 0) * 100)}% confidence
                      </Badge>
                      <Badge className={cn("text-xs", getCategoryBadge(suggestion.suggested_category))}>
                        {suggestion.suggested_category || "general"}
                      </Badge>
                      {suggestion.suggested_priority && (
                        <Badge className={cn("text-xs", getPriorityBadge(suggestion.suggested_priority))}>
                          {suggestion.suggested_priority}
                        </Badge>
                      )}
                      {suggestion.suggested_due_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(new Date(suggestion.suggested_due_date), "MMM d")}
                        </span>
                      )}
                      {(suggestion.matched_constituent_id || suggestion.matched_grant_opportunity_id) && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          Linked
                        </span>
                      )}
                    </div>

                    {/* Email Source - Collapsible */}
                    <Collapsible open={expandedIds.has(suggestion.id)}>
                      <CollapsibleTrigger
                        onClick={() => toggleExpand(suggestion.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-foreground"
                      >
                        {expandedIds.has(suggestion.id) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        From: {suggestion.processed_emails?.sender_name || suggestion.processed_emails?.sender_email}
                        {" • "}
                        {suggestion.processed_emails?.subject}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 space-y-3">
                        <div className="bg-muted/50 rounded p-3 text-sm">
                          <p className="font-medium text-xs text-muted-foreground mb-1">Email excerpt:</p>
                          <p className="text-sm italic">"{suggestion.source_snippet}"</p>
                        </div>
                        {suggestion.ai_reasoning && (
                          <div className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <p className="text-muted-foreground">{suggestion.ai_reasoning}</p>
                          </div>
                        )}

                        {/* Edit Fields */}
                        {editingId === suggestion.id && (
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="justify-start text-left font-normal">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {editValues.due_date ? format(new Date(editValues.due_date), "PPP") : "Set due date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={editValues.due_date ? new Date(editValues.due_date) : undefined}
                                  onSelect={date => setEditValues(prev => ({ ...prev, due_date: date?.toISOString() || null }))}
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                            <Select
                              value={editValues.priority}
                              onValueChange={v => setEditValues(prev => ({ ...prev, priority: v }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {editingId === suggestion.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            approveSuggestion(suggestion.id, editValues);
                            setEditingId(null);
                          }}
                        >
                          Save & Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => approveSuggestion(suggestion.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(suggestion.id);
                            setEditValues({
                              title: suggestion.suggested_title,
                              due_date: suggestion.suggested_due_date,
                              priority: suggestion.suggested_priority || "medium",
                            });
                            setExpandedIds(prev => new Set(prev).add(suggestion.id));
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissSuggestion(suggestion.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
