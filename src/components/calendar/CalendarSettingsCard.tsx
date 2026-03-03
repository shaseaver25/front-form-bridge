import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, RefreshCw, Settings, Link2, Check, AlertCircle } from "lucide-react";
import { useCalendarSettings, useUpdateCalendarSettings, useSyncCalendar, CalendarSyncSettings } from "@/hooks/useCalendarSync";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { invokeMicrosoftUserOAuthStart } from '@/lib/supabaseClientHelpers';
import { toast } from "sonner";

export function CalendarSettingsCard() {
  const { data: settings, isLoading: settingsLoading } = useCalendarSettings();
  const updateSettings = useUpdateCalendarSettings();
  const syncCalendar = useSyncCalendar();

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

  const [formData, setFormData] = useState<Partial<CalendarSyncSettings>>({
    is_enabled: true,
    sync_days_ahead: 7,
    auto_create_tasks: true,
    task_lead_time_hours: 24,
    minimum_meeting_duration_minutes: 15,
    exclude_all_day_events: true,
    exclude_recurring: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        is_enabled: settings.is_enabled,
        sync_days_ahead: settings.sync_days_ahead,
        auto_create_tasks: settings.auto_create_tasks,
        task_lead_time_hours: settings.task_lead_time_hours,
        minimum_meeting_duration_minutes: settings.minimum_meeting_duration_minutes,
        exclude_all_day_events: settings.exclude_all_day_events,
        exclude_recurring: settings.exclude_recurring,
      });
    }
  }, [settings]);

  async function handleConnectMicrosoft() {
    try {
      const data = await invokeMicrosoftUserOAuthStart(supabase, {}) as { url?: string } | null;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.warn('Microsoft OAuth started:', data);
      }
    } catch (err: any) {
      if (err?.message === 'auth_required' || err?.code === 'AUTH_REQUIRED') {
        toast.error('Please sign in to connect your Microsoft account.');
        return;
      }
      console.error('Failed to start Microsoft OAuth:', err);
      toast.error('Failed to connect Microsoft account');
    }
  }

  function handleSaveSettings() {
    updateSettings.mutate(formData, {
      onSuccess: () => {
        toast.success("Calendar settings saved");
      },
      onError: (error) => {
        toast.error("Failed to save settings");
        console.error(error);
      },
    });
  }

  function handleSync() {
    syncCalendar.mutate(undefined, {
      onSuccess: () => {
        toast.success("Calendar synced successfully");
      },
      onError: (error) => {
        toast.error("Failed to sync calendar");
        console.error(error);
      },
    });
  }

  const isConnected = !!microsoftConnection;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Sync
        </CardTitle>
        <CardDescription>
          Connect your Microsoft 365 calendar to sync meetings and create prep tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isConnected ? 'bg-green-100' : 'bg-muted'}`}>
              {isConnected ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <Link2 className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium">Microsoft 365</p>
              {isConnected ? (
                <p className="text-sm text-muted-foreground">
                  Connected • Last synced {settings?.last_sync_at 
                    ? formatDistanceToNow(new Date(settings.last_sync_at), { addSuffix: true })
                    : 'never'}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Not connected</p>
              )}
            </div>
          </div>
          {!isConnected && (
            <Button onClick={handleConnectMicrosoft}>
              <Link2 className="h-4 w-4 mr-2" />
              Connect
            </Button>
          )}
        </div>

        {isConnected && (
          <>
            <Separator />

            {/* Sync Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sync-enabled">Enable Calendar Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync your calendar events
                  </p>
                </div>
                <Switch
                  id="sync-enabled"
                  checked={formData.is_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sync-days">Days to Sync Ahead</Label>
                  <Input
                    id="sync-days"
                    type="number"
                    min={1}
                    max={30}
                    value={formData.sync_days_ahead}
                    onChange={(e) => setFormData({ ...formData, sync_days_ahead: parseInt(e.target.value) || 7 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead-time">Prep Task Lead Time (hours)</Label>
                  <Input
                    id="lead-time"
                    type="number"
                    min={1}
                    max={168}
                    value={formData.task_lead_time_hours}
                    onChange={(e) => setFormData({ ...formData, task_lead_time_hours: parseInt(e.target.value) || 24 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-duration">Minimum Meeting Duration (minutes)</Label>
                  <Input
                    id="min-duration"
                    type="number"
                    min={5}
                    max={120}
                    value={formData.minimum_meeting_duration_minutes}
                    onChange={(e) => setFormData({ ...formData, minimum_meeting_duration_minutes: parseInt(e.target.value) || 15 })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-tasks">Auto-Create Prep Tasks</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically create preparation tasks for meetings
                  </p>
                </div>
                <Switch
                  id="auto-tasks"
                  checked={formData.auto_create_tasks}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_create_tasks: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="exclude-allday">Exclude All-Day Events</Label>
                  <p className="text-sm text-muted-foreground">
                    Don't create tasks for all-day events
                  </p>
                </div>
                <Switch
                  id="exclude-allday"
                  checked={formData.exclude_all_day_events}
                  onCheckedChange={(checked) => setFormData({ ...formData, exclude_all_day_events: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="exclude-recurring">Exclude Recurring Events</Label>
                  <p className="text-sm text-muted-foreground">
                    Don't create tasks for recurring meetings
                  </p>
                </div>
                <Switch
                  id="exclude-recurring"
                  checked={formData.exclude_recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, exclude_recurring: checked })}
                />
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleSaveSettings} disabled={updateSettings.isPending}>
                <Settings className="h-4 w-4 mr-2" />
                {updateSettings.isPending ? "Saving..." : "Save Settings"}
              </Button>
              <Button variant="outline" onClick={handleSync} disabled={syncCalendar.isPending}>
                <RefreshCw className={`h-4 w-4 mr-2 ${syncCalendar.isPending ? 'animate-spin' : ''}`} />
                {syncCalendar.isPending ? "Syncing..." : "Sync Now"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
