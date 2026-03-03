import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FirefliesMeeting {
  id: string;
  title: string;
  date: string;
  duration: number;
  organizer_email: string;
  participants: string[];
  hasTranscript: boolean;
  actionItemsCount: number;
  isImported: boolean;
}

interface FirefliesSettings {
  id: string;
  api_key_configured: boolean;
  auto_import_enabled: boolean;
  only_host_meetings: boolean;
  last_sync_at: string | null;
  connected_email: string | null;
}

export function useFirefliesIntegration() {
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState<string | null>(null);

  // Fetch connection status and settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["fireflies-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("fireflies_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching Fireflies settings:", error);
        return null;
      }

      return data as FirefliesSettings | null;
    },
  });

  // Check connection status
  const checkConnectionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("fireflies-sync", {
        body: { action: "check_connection" },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.connected) {
        toast({
          title: "Connected to Fireflies",
          description: `Connected as ${data.email}`,
        });
        queryClient.invalidateQueries({ queryKey: ["fireflies-settings"] });
      } else {
        toast({
          title: "Connection failed",
          description: data.error || "Please check your API key",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Connection error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch meetings from Fireflies
  const { data: meetings, isLoading: isLoadingMeetings, refetch: refetchMeetings } = useQuery({
    queryKey: ["fireflies-meetings"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fireflies-sync", {
        body: { action: "fetch_meetings" },
      });

      if (error) {
        if (data?.needsApiKey) {
          return { meetings: [], needsApiKey: true };
        }
        throw error;
      }

      return data as { meetings: FirefliesMeeting[]; needsApiKey?: boolean };
    },
    enabled: settings?.api_key_configured === true,
  });

  // Import a specific meeting
  const importMeetingMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      setIsImporting(meetingId);
      const { data, error } = await supabase.functions.invoke("fireflies-sync", {
        body: { action: "import_meeting", meetingId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Meeting imported",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["fireflies-meetings"] });
      queryClient.invalidateQueries({ queryKey: ["voice-recordings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsImporting(null);
    },
  });

  // Import all unimported meetings
  const importAllMutation = useMutation({
    mutationFn: async () => {
      const unimportedMeetings = meetings?.meetings.filter(m => !m.isImported && m.hasTranscript) || [];
      let imported = 0;
      let failed = 0;

      for (const meeting of unimportedMeetings) {
        try {
          setIsImporting(meeting.id);
          await supabase.functions.invoke("fireflies-sync", {
            body: { action: "import_meeting", meetingId: meeting.id },
          });
          imported++;
        } catch {
          failed++;
        }
      }

      return { imported, failed, total: unimportedMeetings.length };
    },
    onSuccess: (data) => {
      toast({
        title: "Sync complete",
        description: `Imported ${data.imported} of ${data.total} meetings${data.failed > 0 ? ` (${data.failed} failed)` : ""}`,
      });
      queryClient.invalidateQueries({ queryKey: ["fireflies-meetings"] });
      queryClient.invalidateQueries({ queryKey: ["voice-recordings"] });
    },
    onSettled: () => {
      setIsImporting(null);
    },
  });

  // Update settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<FirefliesSettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("fireflies_settings")
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "organization_id,user_id"
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fireflies-settings"] });
    },
  });

  return {
    settings,
    isLoadingSettings,
    meetings: meetings?.meetings || [],
    needsApiKey: meetings?.needsApiKey,
    isLoadingMeetings,
    isImporting,
    checkConnection: checkConnectionMutation.mutate,
    isCheckingConnection: checkConnectionMutation.isPending,
    importMeeting: importMeetingMutation.mutate,
    importAllMeetings: importAllMutation.mutate,
    isImportingAll: importAllMutation.isPending,
    updateSettings: updateSettingsMutation.mutate,
    refetchMeetings,
  };
}
