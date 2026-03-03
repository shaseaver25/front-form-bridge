import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";

export interface TeamActivityItem {
  id: string;
  type: "recording" | "contact_created" | "note_added" | "task_completed";
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  timestamp: string;
  title: string;
  description: string;
  metadata: {
    event_name?: string;
    contact_name?: string;
    organization?: string;
    task_title?: string;
    recording_id?: string;
    contact_id?: string;
  };
}

export interface TeamStats {
  recordingsThisMonth: number;
  contactsThisMonth: number;
  followupsCompleted: number;
  mostActiveUser: { name: string; count: number } | null;
}

export interface RecentVoiceContact {
  id: string;
  name: string;
  organization: string | null;
  added_by: string;
  added_at: string;
  event_name: string | null;
}

interface TeamActivityFilter {
  userId?: string;
  activityType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export function useTeamActivity(filter?: TeamActivityFilter) {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  // Fetch team activity feed
  const activityQuery = useQuery({
    queryKey: ["team-activity", filter],
    queryFn: async () => {
      const activities: TeamActivityItem[] = [];

      // Get recordings with user info
      let recordingsQuery = supabase
        .from("voice_recordings")
        .select(`
          id,
          created_at,
          event_name,
          user_id
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (filter?.userId && filter.userId !== "all") {
        recordingsQuery = recordingsQuery.eq("user_id", filter.userId);
      }
      if (filter?.dateFrom) {
        recordingsQuery = recordingsQuery.gte("created_at", filter.dateFrom.toISOString());
      }
      if (filter?.dateTo) {
        recordingsQuery = recordingsQuery.lte("created_at", filter.dateTo.toISOString());
      }

      const { data: recordings } = await recordingsQuery;

      if (recordings && (!filter?.activityType || filter.activityType === "recordings" || filter.activityType === "all")) {
        for (const r of recordings) {
          // Get user profile
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("first_name, last_name")
            .eq("id", r.user_id)
            .single();

          activities.push({
            id: `recording-${r.id}`,
            type: "recording",
            user_id: r.user_id,
            user_name: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Unknown",
            user_avatar: null,
            timestamp: r.created_at,
            title: "Recorded a voice note",
            description: r.event_name || "Voice note",
            metadata: {
              event_name: r.event_name || undefined,
              recording_id: r.id,
            },
          });
        }
      }

      // Get contact updates with related recording info
      if (!filter?.activityType || filter.activityType === "contact_created" || filter.activityType === "note_added" || filter.activityType === "all") {
        let contactsQuery = supabase
          .from("voice_contact_updates")
          .select(`
            id,
            created_at,
            update_type,
            contact_id,
            recording_id
          `)
          .order("created_at", { ascending: false })
          .limit(50);

        if (filter?.dateFrom) {
          contactsQuery = contactsQuery.gte("created_at", filter.dateFrom.toISOString());
        }
        if (filter?.dateTo) {
          contactsQuery = contactsQuery.lte("created_at", filter.dateTo.toISOString());
        }

        const { data: contactUpdates } = await contactsQuery;

        if (contactUpdates) {
          for (const cu of contactUpdates) {
            // Get the recording to find the user
            const { data: recording } = await supabase
              .from("voice_recordings")
              .select("user_id, event_name")
              .eq("id", cu.recording_id)
              .single();

            if (filter?.userId && filter.userId !== "all" && recording?.user_id !== filter.userId) {
              continue;
            }

            // Get user profile
            const { data: profile } = recording?.user_id 
              ? await supabase.from("user_profiles").select("first_name, last_name").eq("id", recording.user_id).single()
              : { data: null };

            // Get constituent info
            const { data: constituent } = await supabase
              .from("constituents")
              .select("first_name, last_name, employer")
              .eq("id", cu.contact_id)
              .single();

            const activityType = cu.update_type === "created" 
              ? "contact_created" 
              : cu.update_type === "note_added" 
              ? "note_added" 
              : null;

            if (activityType && (!filter?.activityType || filter.activityType === activityType || filter.activityType === "all")) {
              const contactName = constituent 
                ? `${constituent.first_name || ""} ${constituent.last_name || ""}`.trim() 
                : "Unknown";
              
              activities.push({
                id: `contact-${cu.id}`,
                type: activityType,
                user_id: recording?.user_id || "",
                user_name: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Unknown",
                user_avatar: null,
                timestamp: cu.created_at,
                title: activityType === "contact_created" ? `Created contact: ${contactName}` : `Added note to ${contactName}`,
                description: constituent?.employer || "",
                metadata: {
                  contact_name: contactName,
                  organization: constituent?.employer || undefined,
                  event_name: recording?.event_name || undefined,
                  contact_id: cu.contact_id,
                },
              });
            }
          }
        }
      }

      // Get completed tasks
      if (!filter?.activityType || filter.activityType === "task_completed" || filter.activityType === "all") {
        let tasksQuery = supabase
          .from("voice_next_steps")
          .select(`
            id,
            completed_at,
            title,
            assigned_to
          `)
          .eq("status", "completed")
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(50);

        if (filter?.userId && filter.userId !== "all") {
          tasksQuery = tasksQuery.eq("assigned_to", filter.userId);
        }
        if (filter?.dateFrom) {
          tasksQuery = tasksQuery.gte("completed_at", filter.dateFrom.toISOString());
        }
        if (filter?.dateTo) {
          tasksQuery = tasksQuery.lte("completed_at", filter.dateTo.toISOString());
        }

        const { data: completedTasks } = await tasksQuery;

        if (completedTasks) {
          for (const t of completedTasks) {
            const { data: profile } = await supabase
              .from("user_profiles")
              .select("first_name, last_name")
              .eq("id", t.assigned_to)
              .single();

            activities.push({
              id: `task-${t.id}`,
              type: "task_completed",
              user_id: t.assigned_to,
              user_name: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Unknown",
              user_avatar: null,
              timestamp: t.completed_at || "",
              title: `Completed: ${t.title}`,
              description: "",
              metadata: {
                task_title: t.title,
              },
            });
          }
        }
      }

      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return activities.slice(0, 50);
    },
    staleTime: 30 * 1000,
  });

  // Fetch team stats
  const statsQuery = useQuery({
    queryKey: ["team-stats"],
    queryFn: async () => {
      // Recordings this month
      const { count: recordingsCount } = await supabase
        .from("voice_recordings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      // Contacts this month
      const { count: contactsCount } = await supabase
        .from("voice_contact_updates")
        .select("*", { count: "exact", head: true })
        .eq("update_type", "created")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      // Followups completed
      const { count: followupsCount } = await supabase
        .from("voice_next_steps")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("completed_at", monthStart.toISOString())
        .lte("completed_at", monthEnd.toISOString());

      // Most active user
      const { data: activeUsers } = await supabase
        .from("voice_recordings")
        .select("user_id")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      let mostActiveUser: { name: string; count: number } | null = null;
      if (activeUsers && activeUsers.length > 0) {
        const userCounts: Record<string, number> = {};
        activeUsers.forEach((r) => {
          userCounts[r.user_id] = (userCounts[r.user_id] || 0) + 1;
        });

        const topUserId = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0];
        if (topUserId) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("first_name, last_name")
            .eq("id", topUserId[0])
            .single();

          if (profile) {
            mostActiveUser = {
              name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
              count: topUserId[1],
            };
          }
        }
      }

      const stats: TeamStats = {
        recordingsThisMonth: recordingsCount || 0,
        contactsThisMonth: contactsCount || 0,
        followupsCompleted: followupsCount || 0,
        mostActiveUser,
      };

      return stats;
    },
    staleTime: 60 * 1000,
  });

  // Fetch recently added contacts via voice
  const recentContactsQuery = useQuery({
    queryKey: ["recent-voice-contacts"],
    queryFn: async () => {
      const { data: updates } = await supabase
        .from("voice_contact_updates")
        .select(`
          id,
          created_at,
          contact_id,
          recording_id
        `)
        .eq("update_type", "created")
        .order("created_at", { ascending: false })
        .limit(12);

      if (!updates) return [];

      const contacts: RecentVoiceContact[] = [];

      for (const cu of updates) {
        // Get constituent
        const { data: constituent } = await supabase
          .from("constituents")
          .select("id, first_name, last_name, employer")
          .eq("id", cu.contact_id)
          .single();

        // Get recording for user and event info
        const { data: recording } = await supabase
          .from("voice_recordings")
          .select("user_id, event_name")
          .eq("id", cu.recording_id)
          .single();

        // Get user profile
        const { data: profile } = recording?.user_id
          ? await supabase.from("user_profiles").select("first_name, last_name").eq("id", recording.user_id).single()
          : { data: null };

        contacts.push({
          id: constituent?.id || cu.id,
          name: constituent ? `${constituent.first_name || ""} ${constituent.last_name || ""}`.trim() : "Unknown",
          organization: constituent?.employer || null,
          added_by: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : "Unknown",
          added_at: cu.created_at,
          event_name: recording?.event_name || null,
        });
      }

      return contacts;
    },
    staleTime: 30 * 1000,
  });

  // Fetch team members for filter
  const teamMembersQuery = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name")
        .order("first_name");

      return (data || []).map((u) => ({
        id: u.id,
        name: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    activities: activityQuery.data || [],
    isLoadingActivities: activityQuery.isLoading,
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
    recentContacts: recentContactsQuery.data || [],
    isLoadingContacts: recentContactsQuery.isLoading,
    teamMembers: teamMembersQuery.data || [],
    refetch: () => {
      activityQuery.refetch();
      statsQuery.refetch();
      recentContactsQuery.refetch();
    },
  };
}
