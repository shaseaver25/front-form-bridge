import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Bot, Settings, RefreshCw, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function LMSSettings() {
  const { data: lmsConfigs, isLoading } = useQuery({
    queryKey: ["lms-configurations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_configurations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: syncStats } = useQuery({
    queryKey: ["lms-sync-stats"],
    queryFn: async () => {
      const stats = await Promise.all(
        (lmsConfigs || []).map(async (config) => {
          const [students, courses, enrollments] = await Promise.all([
            supabase.from("lms_students").select("id", { count: "exact", head: true }).eq("lms_config_id", config.id),
            supabase.from("lms_courses").select("id", { count: "exact", head: true }).eq("lms_config_id", config.id),
            supabase.from("lms_enrollments").select("id", { count: "exact", head: true }).eq("lms_config_id", config.id).eq("status", "active"),
          ]);

          return {
            configId: config.id,
            students: students.count || 0,
            courses: courses.count || 0,
            activeEnrollments: enrollments.count || 0,
          };
        })
      );

      return stats.reduce((acc, stat) => {
        acc[stat.configId] = stat;
        return acc;
      }, {} as Record<string, any>);
    },
    enabled: !!lmsConfigs?.length,
  });

  const handleSyncNow = async (configId: string) => {
    toast.info("Sync started", {
      description: "This may take a few minutes...",
    });
    // TODO: Implement sync logic via edge function
  };

  const getLMSIcon = (lmsName: string) => {
    if (lmsName.toLowerCase().includes("stem")) {
      return <GraduationCap className="h-6 w-6" />;
    }
    return <Bot className="h-6 w-6" />;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">LMS Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect and manage Learning Management System integrations for Full STEM and The Ai Whisperers
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {lmsConfigs?.map((config) => {
          const stats = syncStats?.[config.id];
          const lastSync = config.last_sync_at
            ? formatDistanceToNow(new Date(config.last_sync_at), { addSuffix: true })
            : "Never";

          return (
            <Card key={config.id} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {getLMSIcon(config.lms_name)}
                    </div>
                    <div>
                      <CardTitle>{config.lms_name}</CardTitle>
                      <CardDescription className="mt-1">
                        {config.lms_type.charAt(0).toUpperCase() + config.lms_type.slice(1)}
                      </CardDescription>
                    </div>
                  </div>
                  {config.is_active ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Inactive
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Last synced {lastSync}
                </div>

                {stats && (
                  <div className="grid grid-cols-3 gap-4 py-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.students}</div>
                      <div className="text-xs text-muted-foreground">Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.courses}</div>
                      <div className="text-xs text-muted-foreground">Courses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.activeEnrollments}</div>
                      <div className="text-xs text-muted-foreground">Active</div>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleSyncNow(config.id)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!lmsConfigs?.length && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No LMS Integrations</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Connect your Learning Management Systems to sync student data, track enrollments, and measure program outcomes.
            </p>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
