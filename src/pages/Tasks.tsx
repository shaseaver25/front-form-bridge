import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedTaskList } from "@/components/tasks/UnifiedTaskList";
import { TaskROIDashboard } from "@/components/tasks/TaskROIDashboard";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, ListTodo, RefreshCw, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { TaskFilters as TaskFiltersType } from "@/types/unified-tasks";

export default function Tasks() {
  const [filters, setFilters] = useState<TaskFiltersType>({
    status: "all",
    source: "all",
    assignee: "all",
    category: "all",
    dateRange: "all",
    search: "",
  });
  const [myTasksFilters, setMyTasksFilters] = useState<TaskFiltersType>({
    status: "all",
    source: "all",
    assignee: "all",
    category: "all",
    dateRange: "all",
    search: "",
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        setMyTasksFilters(prev => ({ ...prev, assignee: user.id }));
      }
    };
    fetchUser();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-unified-tasks");
      
      if (error) throw error;
      
      toast({
        title: "Sync Complete",
        description: data.message || "Tasks synced successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["unified-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-roi"] });
    } catch (err) {
      toast({
        title: "Sync Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">
              Unified view of all tasks with ROI tracking
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync All Sources"}
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        <Tabs defaultValue="my-tasks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-tasks" className="gap-2">
              <UserCheck className="h-4 w-4" />
              My Tasks
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <ListTodo className="h-4 w-4" />
              All Tasks
            </TabsTrigger>
            <TabsTrigger value="roi" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              ROI Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-tasks" className="space-y-4">
            <TaskFilters 
              filters={myTasksFilters} 
              onChange={(newFilters) => setMyTasksFilters({ ...newFilters, assignee: currentUserId || "all" })} 
              hideAssigneeFilter 
            />
            <UnifiedTaskList filters={myTasksFilters} />
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <TaskFilters filters={filters} onChange={setFilters} />
            <UnifiedTaskList filters={filters} />
          </TabsContent>

          <TabsContent value="roi">
            <TaskROIDashboard />
          </TabsContent>
        </Tabs>

        <CreateTaskDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog} 
        />
      </div>
    </Layout>
  );
}