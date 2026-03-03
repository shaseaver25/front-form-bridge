import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to subscribe to real-time updates for card subtasks, comments, and activity
 */
export function useRealtimeCardDetails(cardId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!cardId) return;

    // Subscribe to subtasks changes
    const subtasksChannel = supabase
      .channel(`subtasks-${cardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_card_subtasks',
          filter: `card_id=eq.${cardId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['card-details', cardId] });
        }
      )
      .subscribe();

    // Subscribe to comments changes
    const commentsChannel = supabase
      .channel(`comments-${cardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_card_comments',
          filter: `card_id=eq.${cardId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['card-details', cardId] });
        }
      )
      .subscribe();

    // Subscribe to activity changes
    const activityChannel = supabase
      .channel(`activity-${cardId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'board_card_activity',
          filter: `card_id=eq.${cardId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['card-details', cardId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subtasksChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(activityChannel);
    };
  }, [cardId, queryClient]);
}
