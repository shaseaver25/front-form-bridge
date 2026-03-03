import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { boardKeys } from './keys';

export function useStartTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId }: { cardId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('board_time_logs')
        .insert({
          card_id: cardId,
          user_id: user.id,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.all });
    },
  });
}

export function useStopTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId }: { cardId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find active timer
      const { data: activeTimer } = await supabase
        .from('board_time_logs')
        .select('*')
        .eq('card_id', cardId)
        .eq('user_id', user.id)
        .is('ended_at', null)
        .single();

      if (!activeTimer) throw new Error('No active timer found');

      const endedAt = new Date();
      const startedAt = new Date(activeTimer.started_at);
      const durationMinutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);

      const { data, error } = await supabase
        .from('board_time_logs')
        .update({
          ended_at: endedAt.toISOString(),
          duration_minutes: durationMinutes,
        })
        .eq('id', activeTimer.id)
        .select()
        .single();

      if (error) throw error;

      // Update card actual_hours
      const { data: card } = await supabase
        .from('board_cards')
        .select('actual_hours')
        .eq('id', cardId)
        .single();

      const currentHours = card?.actual_hours || 0;
      const newHours = currentHours + (durationMinutes / 60);

      await supabase
        .from('board_cards')
        .update({ actual_hours: newHours })
        .eq('id', cardId);

      // Log activity
      await supabase
        .from('board_card_activity')
        .insert({
          card_id: cardId,
          user_id: user.id,
          activity_type: 'time_logged',
          details: { minutes: durationMinutes },
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.all });
    },
  });
}

export function useLogTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      cardId, 
      minutes, 
      notes 
    }: { 
      cardId: string; 
      minutes: number; 
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const now = new Date();
      const startedAt = new Date(now.getTime() - minutes * 60000);

      const { data, error } = await supabase
        .from('board_time_logs')
        .insert({
          card_id: cardId,
          user_id: user.id,
          started_at: startedAt.toISOString(),
          ended_at: now.toISOString(),
          duration_minutes: minutes,
          notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Update card actual_hours
      const { data: card } = await supabase
        .from('board_cards')
        .select('actual_hours')
        .eq('id', cardId)
        .single();

      const currentHours = card?.actual_hours || 0;
      const newHours = currentHours + (minutes / 60);

      await supabase
        .from('board_cards')
        .update({ actual_hours: newHours })
        .eq('id', cardId);

      // Log activity
      await supabase
        .from('board_card_activity')
        .insert({
          card_id: cardId,
          user_id: user.id,
          activity_type: 'time_logged',
          details: { minutes },
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.all });
    },
  });
}
