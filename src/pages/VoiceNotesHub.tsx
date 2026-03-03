import { useState, useEffect } from "react";
import { FeatureGate } from "@/components/FeatureGate";
import { VoiceUpgradePrompt } from "@/components/voice/VoiceUpgradePrompt";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Mic,
  Plus,
  Users,
  ListTodo,
  FileText,
  Search,
  Calendar,
  Video,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVoiceNotes } from "@/hooks/useVoiceNotes";
import { VoiceRecordingCard } from "@/components/voice/VoiceRecordingCard";
import { TeamActivityTab } from "@/components/voice/TeamActivityTab";
import { NotificationPermissionBanner } from "@/components/voice/NotificationPermissionBanner";
import { VoiceEmptyState } from "@/components/voice/VoiceEmptyState";
import { FirefliesMeetingsTab } from "@/components/voice/FirefliesMeetingsTab";
import { MeetingUpload } from "@/components/voice/MeetingUpload";
import { format, isToday, parseISO } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { useVoiceNotifications } from "@/hooks/useVoiceNotifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function VoiceNotesHub() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("recordings");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { notifyTaskCompleted } = useVoiceNotifications();

  const { recordings, isLoadingRecordings, stats, isLoadingStats, nextSteps, isLoadingNextSteps } =
    useVoiceNotes({
      status: statusFilter,
      search: searchQuery || undefined,
    });

  // Check for due/overdue tasks and notify
  useEffect(() => {
    if (nextSteps.length > 0) {
      nextSteps.forEach((step: any) => {
        if (step.due_date && step.status === "pending") {
          const dueDate = parseISO(step.due_date);
          if (isToday(dueDate)) {
            // Could trigger notification here
          }
        }
      });
    }
  }, [nextSteps]);

  const completeTaskMutation = useMutation({
    mutationFn: async (stepId: string) => {
      const { error } = await supabase
        .from("voice_next_steps")
        .update({ status: "completed" })
        .eq("id", stepId);
      if (error) throw error;
    },
    onSuccess: (_, stepId) => {
      const step = nextSteps.find((s: any) => s.id === stepId);
      toast.success(`Task completed: ${step?.title || "Follow-up"}`);
      notifyTaskCompleted(step?.title || "Follow-up task");
      queryClient.invalidateQueries({ queryKey: ["voice-notes"] });
      queryClient.invalidateQueries({ queryKey: ["voice-next-steps"] });
    },
    onError: () => {
      toast.error("Failed to complete task");
    },
  });

  const handleMarkComplete = async (stepId: string) => {
    completeTaskMutation.mutate(stepId);
  };

  return (
    <Layout>
      <FeatureGate feature="voice_notes" fallback={<VoiceUpgradePrompt />}>
        <div className="container mx-auto py-6 px-4 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Voice Notes</h1>
              <p className="text-muted-foreground mt-1">
                Capture and manage networking contacts
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Meeting
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg p-0 overflow-hidden">
                  <MeetingUpload 
                    onComplete={() => {
                      setUploadDialogOpen(false);
                      queryClient.invalidateQueries({ queryKey: ["voice-notes"] });
                      toast.success("Meeting saved to CRM");
                    }}
                    onCancel={() => setUploadDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
              <Button
                onClick={() => navigate("/voice-notes/record")}
                className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Recording
              </Button>
            </div>
          </div>

          {/* Notification Permission Banner */}
          <NotificationPermissionBanner />

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Recordings This Week</CardDescription>
                <CardTitle className="text-2xl">
                  {isLoadingStats ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    stats?.recordingsThisWeek || 0
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mic className="w-4 h-4" />
                  <span>Voice notes</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Contacts Created</CardDescription>
                <CardTitle className="text-2xl">
                  {isLoadingStats ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    stats?.contactsCreated || 0
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>From voice notes</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Next Steps</CardDescription>
                <CardTitle className="text-2xl">
                  {isLoadingStats ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    stats?.pendingNextSteps || 0
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ListTodo className="w-4 h-4" />
                  <span>Assigned to you</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Notes Added</CardDescription>
                <CardTitle className="text-2xl">
                  {isLoadingStats ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    stats?.notesAddedThisWeek || 0
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>This week</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="recordings">Recent Recordings</TabsTrigger>
              <TabsTrigger value="meetings" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Meeting Transcripts
              </TabsTrigger>
              <TabsTrigger value="next-steps">
                My Next Steps
                {stats?.pendingNextSteps ? (
                  <Badge variant="secondary" className="ml-2">
                    {stats.pendingNextSteps}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="team">Team Activity</TabsTrigger>
            </TabsList>

            {/* Recent Recordings Tab */}
            <TabsContent value="recordings">
              {/* Filters */}
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transcripts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Recordings List */}
              {isLoadingRecordings ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-16 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : recordings.length === 0 ? (
                <Card>
                  <CardContent className="py-0">
                    <VoiceEmptyState 
                      type="no-recordings" 
                      action={
                        <Button
                          onClick={() => navigate("/voice-notes/record")}
                          className="bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90"
                        >
                          <Mic className="w-4 h-4 mr-2" />
                          Start Recording
                        </Button>
                      }
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {recordings.map((recording) => (
                    <VoiceRecordingCard key={recording.id} recording={recording} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* My Next Steps Tab */}
            <TabsContent value="next-steps">
              {isLoadingNextSteps ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="py-4">
                        <Skeleton className="h-5 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : nextSteps.length === 0 ? (
                <Card>
                  <CardContent className="py-0">
                    <VoiceEmptyState type="no-next-steps" />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {nextSteps.map((step) => (
                    <Card key={step.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={step.status === "completed"}
                            onCheckedChange={() => handleMarkComplete(step.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{step.title}</p>
                            {step.contact && (
                              <p className="text-sm text-muted-foreground">
                                Related to: {(step.contact as { first_name?: string; last_name?: string })?.first_name} {(step.contact as { first_name?: string; last_name?: string })?.last_name}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              {step.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    Due {format(new Date(step.due_date), "MMM d, yyyy")}
                                  </span>
                                </div>
                              )}
                              <Badge
                                variant="outline"
                                className={
                                  step.priority === "high"
                                    ? "border-red-200 text-red-600"
                                    : step.priority === "medium"
                                    ? "border-yellow-200 text-yellow-600"
                                    : "border-gray-200 text-gray-600"
                                }
                              >
                                {step.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Meeting Transcripts Tab (Fireflies) */}
            <TabsContent value="meetings">
              <FirefliesMeetingsTab />
            </TabsContent>

            {/* Team Activity Tab */}
            <TabsContent value="team">
              <TeamActivityTab />
            </TabsContent>
          </Tabs>
        </div>
      </FeatureGate>
    </Layout>
  );
}
