import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CalendarSyncSettings {
  id: string;
  user_id: string;
  is_enabled: boolean;
  sync_days_ahead: number;
  auto_create_tasks: boolean;
  task_lead_time_hours: number;
  minimum_meeting_duration_minutes: number;
  exclude_all_day_events: boolean;
  exclude_recurring: boolean;
  exclude_categories: string[] | null;
  include_only_categories: string[] | null;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  microsoft_event_id: string;
  subject: string;
  body_preview: string | null;
  body_html: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  is_online_meeting: boolean;
  online_meeting_url: string | null;
  organizer_name: string | null;
  organizer_email: string | null;
  attendees: Array<{ name: string; email: string; response_status: string }>;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  importance: string | null;
  sensitivity: string | null;
  categories: string[] | null;
  prep_task_created: boolean;
  prep_task_id: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface MeetingAttendeeMatch {
  id: string;
  calendar_event_id: string;
  attendee_email: string;
  attendee_name: string | null;
  constituent_id: string | null;
  match_confidence: string;
  created_at: string;
}

export function useCalendarSettings() {
  return useQuery({
    queryKey: ["calendar-sync-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("calendar_sync_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as CalendarSyncSettings | null;
    },
  });
}

export function useUpdateCalendarSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: Partial<CalendarSyncSettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("calendar_sync_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("calendar_sync_settings")
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("calendar_sync_settings")
          .insert({ user_id: user.id, ...settings });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-sync-settings"] });
      toast({ title: "Settings saved", description: "Calendar sync settings updated." });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    },
  });
}

export function useCalendarEvents(limit?: number) {
  return useQuery({
    queryKey: ["calendar-events", limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id)
        .gt("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CalendarEvent[];
    },
  });
}

export function useCalendarEvent(eventId: string | null) {
  return useQuery({
    queryKey: ["calendar-event", eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;
      return data as CalendarEvent;
    },
    enabled: !!eventId,
  });
}

export function useMeetingAttendees(eventId: string | null) {
  return useQuery({
    queryKey: ["meeting-attendees", eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from("meeting_attendee_matches")
        .select(`
          *,
          constituents (
            id,
            first_name,
            last_name,
            primary_email,
            title,
            employer
          )
        `)
        .eq("calendar_event_id", eventId);

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}

export function useSyncCalendar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("microsoft-calendar-sync", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-sync-settings"] });
      toast({
        title: "Calendar synced",
        description: `${data.new_events} new events, ${data.updated_events} updated.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to sync calendar",
        variant: "destructive",
      });
    },
  });
}

export function useCreatePrepTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (calendarEventId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Generate the prep task
      const generateResponse = await supabase.functions.invoke("generate-meeting-prep-task", {
        body: { calendar_event_id: calendarEventId },
      });

      if (generateResponse.error) throw generateResponse.error;

      const taskData = generateResponse.data;

      // Get the calendar event for meeting context
      const { data: event } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("id", calendarEventId)
        .single();

      if (!event) throw new Error("Event not found");

      // Format attendees
      const attendeesRaw = event.attendees as Array<{ name: string; email: string }> | null;
      const attendees = attendeesRaw || [];
      const attendeeNames = attendees
        .slice(0, 5)
        .map((a) => a.name)
        .join(", ");

      // Create the task
      const { data: newTask, error: taskError } = await supabase
        .from("tasks")
        .insert({
          title: taskData.title,
          description: taskData.description,
          assigned_to: session.user.id,
          created_by: session.user.id,
          due_date: taskData.suggested_due_date,
          status: "pending",
          source_type: "calendar",
          source_calendar_event_id: calendarEventId,
          meeting_time: event.start_time,
          meeting_attendees: attendeeNames,
          meeting_context: taskData.description,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Update the calendar event
      await supabase
        .from("calendar_events")
        .update({
          prep_task_created: true,
          prep_task_id: newTask.id,
        })
        .eq("id", calendarEventId);

      return newTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({
        title: "Prep task created",
        description: "Meeting preparation task has been added to your tasks.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create prep task",
        variant: "destructive",
      });
    },
  });
}

export function useLinkAttendeeToConstituent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      matchId,
      constituentId,
    }: {
      matchId: string;
      constituentId: string;
    }) => {
      const { error } = await supabase
        .from("meeting_attendee_matches")
        .update({
          constituent_id: constituentId,
          match_confidence: "manual",
        })
        .eq("id", matchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-attendees"] });
      toast({
        title: "Attendee linked",
        description: "Attendee has been linked to the constituent record.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to link attendee",
        variant: "destructive",
      });
    },
  });
}

export function useConstituentMeetings(constituentId: string | null) {
  return useQuery({
    queryKey: ["constituent-meetings", constituentId],
    queryFn: async () => {
      if (!constituentId) return [];

      const { data, error } = await supabase
        .from("meeting_attendee_matches")
        .select(`
          calendar_event_id,
          calendar_events (
            id,
            subject,
            start_time,
            end_time,
            location,
            is_online_meeting,
            attendees
          )
        `)
        .eq("constituent_id", constituentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Extract and deduplicate events
      const events = data
        ?.filter((m) => m.calendar_events)
        .map((m) => m.calendar_events as unknown as CalendarEvent)
        .filter((e, i, arr) => arr.findIndex((x) => x?.id === e?.id) === i);

      return events || [];
    },
    enabled: !!constituentId,
  });
}
