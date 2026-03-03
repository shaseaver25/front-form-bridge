import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Json } from "@/integrations/supabase/types";

export interface Activity {
  id: string;
  record_type: string;
  record_id: string;
  activity_type: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  field_name?: string;
  old_value?: unknown;
  new_value?: unknown;
  description: string;
  created_at: string;
}

export const useActivityStream = (recordType: string, recordId: string) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from("record_activities")
        .select("*")
        .eq("record_type", recordType)
        .eq("record_id", recordId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setActivities(data);
      }
      setLoading(false);
    };

    fetchActivities();

    // Subscribe to real-time updates
    const activityChannel = supabase
      .channel(`activities:${recordType}:${recordId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "record_activities",
          filter: `record_id=eq.${recordId}`,
        },
        (payload) => {
          const newActivity = payload.new as Activity;
          setActivities((prev) => [newActivity, ...prev]);
        }
      )
      .subscribe();

    setChannel(activityChannel);

    return () => {
      if (activityChannel) {
        activityChannel.unsubscribe();
      }
    };
  }, [recordType, recordId]);

  const createActivity = async (
    activityType: string,
    description: string,
    fieldName?: string,
    oldValue?: unknown,
    newValue?: unknown
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const insertData = {
      record_type: recordType,
      record_id: recordId,
      activity_type: activityType,
      user_id: user.id,
      user_name: user.email?.split("@")[0] || "Unknown User",
      user_avatar: user.user_metadata?.avatar_url,
      field_name: fieldName,
      old_value: oldValue as Json | null,
      new_value: newValue as Json | null,
      description,
    };
    const { error } = await supabase.from("record_activities").insert(insertData);

    if (error) {
      console.error("Error creating activity:", error);
    }
  };

  return { activities, loading, createActivity };
};
