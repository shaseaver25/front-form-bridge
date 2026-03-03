import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceUser {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  viewing_since: string;
  is_editing: boolean;
}

export const usePresence = (recordType: string, recordId: string) => {
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const presenceChannel = supabase.channel(`presence:${recordType}:${recordId}`);

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const users: PresenceUser[] = [];
          
          Object.keys(state).forEach((key) => {
            const presences = state[key] as { [key: string]: unknown }[];
            if (presences && presences.length > 0) {
              const presence = presences[0] as unknown as PresenceUser;
              users.push(presence);
            }
          });
          
          setActiveUsers(users);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          console.warn('User joined:', newPresences);
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          console.warn('User left:', leftPresences);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: user.id,
              user_name: user.email?.split('@')[0] || 'Unknown User',
              user_avatar: user.user_metadata?.avatar_url,
              viewing_since: new Date().toISOString(),
              is_editing: false,
            });
          }
        });

      setChannel(presenceChannel);
    };

    setupPresence();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [recordType, recordId]);

  const updatePresence = async (updates: Partial<PresenceUser>) => {
    if (channel) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await channel.track({
        user_id: user.id,
        user_name: user.email?.split('@')[0] || 'Unknown User',
        user_avatar: user.user_metadata?.avatar_url,
        viewing_since: new Date().toISOString(),
        is_editing: false,
        ...updates,
      });
    }
  };

  return { activeUsers, updatePresence };
};
