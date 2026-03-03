import { FeatureGate } from "@/components/FeatureGate";
import { VoiceUpgradePrompt } from "@/components/voice/VoiceUpgradePrompt";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ListTodo, CheckCircle2, Calendar, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVoiceNotes } from "@/hooks/useVoiceNotes";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function VoiceNextSteps() {
  const navigate = useNavigate();
  const { nextSteps, isLoadingNextSteps, refetch } = useVoiceNotes();

  const pendingTasks = nextSteps.filter((step: any) => step.status === "pending");

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("voice_next_steps")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task marked as complete");
      refetch();
    },
    onError: () => {
      toast.error("Failed to complete task");
    },
  });

  const handleMarkComplete = (taskId: string) => {
    completeTaskMutation.mutate(taskId);
  };

  return (
    <Layout>
      <FeatureGate 
        feature="voice_notes" 
        fallback={<VoiceUpgradePrompt />}
      >
        <div className="container mx-auto py-6 px-4 max-w-4xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/voice-notes')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Voice Notes
          </Button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Next Steps</h1>
              <p className="text-muted-foreground mt-1">
                Follow-up tasks extracted from your voice recordings
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="w-5 h-5" />
                Pending Tasks ({pendingTasks.length})
              </CardTitle>
              <CardDescription>
                Tasks that need your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingNextSteps ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Skeleton className="h-5 w-5 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No pending tasks</p>
                  <p className="text-sm">Tasks from your voice recordings will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => handleMarkComplete(task.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{task.description}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                          {task.contact && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {task.contact.first_name} {task.contact.last_name}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(task.due_date), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </FeatureGate>
    </Layout>
  );
}
