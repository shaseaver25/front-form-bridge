import Layout from "@/components/Layout";
import { CalendarSettingsCard, UpcomingMeetingsPanel } from "@/components/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CheckCircle2, Clock } from "lucide-react";
import { useCalendarEvents, useCalendarSettings } from "@/hooks/useCalendarSync";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function CalendarPage() {
  const { data: events } = useCalendarEvents();
  const { data: settings } = useCalendarSettings();

  const { data: microsoftConnection } = useQuery({
    queryKey: ["microsoft-connection"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("user_microsoft_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      return data;
    },
  });

  const isConnected = !!microsoftConnection;
  const upcomingCount = events?.length || 0;
  const prepTasksCreated = events?.filter((e) => e.prep_task_created).length || 0;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-muted-foreground mt-1">
              Sync your Microsoft 365 calendar and manage meeting prep tasks
            </p>
          </div>
          {isConnected && (
            <div className="flex gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{upcomingCount}</p>
                    <p className="text-xs text-muted-foreground">Upcoming meetings</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {prepTasksCreated}/{upcomingCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Prep tasks created</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        <Tabs defaultValue="meetings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="meetings">Upcoming Meetings</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="meetings">
            <UpcomingMeetingsPanel showViewAll={false} limit={50} />
          </TabsContent>

          <TabsContent value="settings">
            <CalendarSettingsCard />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
