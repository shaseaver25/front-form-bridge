import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { boardKeys } from './useBoardData';
import { toast } from 'sonner';

interface ActiveTimer {
  cardId: string;
  startTime: Date;
  logId: string;
}

interface UseTimeTrackingReturn {
  activeTimer: ActiveTimer | null;
  elapsedTime: number; // seconds, updates every second
  startTimer: (cardId: string) => Promise<void>;
  stopTimer: () => Promise<void>;
  logTime: (cardId: string, minutes: number, notes?: string) => Promise<void>;
  getCardTimeLogs: (cardId: string) => Promise<TimeLog[]>;
}

interface TimeLog {
  id: string;
  card_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
}

export function useTimeTracking(): UseTimeTrackingReturn {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const queryClient = useQueryClient();

  // Check for existing active timer on mount
  useEffect(() => {
    const checkActiveTimer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: activeLog } = await supabase
        .from('board_time_logs')
        .select('*')
        .eq('user_id', user.id)
        .is('ended_at', null)
        .limit(1)
        .single();

      if (activeLog) {
        setActiveTimer({
          cardId: activeLog.card_id,
          startTime: new Date(activeLog.started_at),
          logId: activeLog.id,
        });
      }
    };

    checkActiveTimer();
  }, []);

  // Update elapsed time every second when timer is active
  useEffect(() => {
    if (!activeTimer) {
      setElapsedTime(0);
      return;
    }

    const updateElapsed = () => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - activeTimer.startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  const startTimer = useCallback(async (cardId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in to track time');
      return;
    }

    // Stop any existing timer first
    if (activeTimer) {
      await stopTimer();
    }

    const { data, error } = await supabase
      .from('board_time_logs')
      .insert({
        card_id: cardId,
        user_id: user.id,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to start timer');
      console.error(error);
      return;
    }

    setActiveTimer({
      cardId,
      startTime: new Date(data.started_at),
      logId: data.id,
    });
    toast.success('Timer started');
  }, [activeTimer]);

  const stopTimer = useCallback(async () => {
    if (!activeTimer) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const endedAt = new Date();
    const durationMinutes = Math.round((endedAt.getTime() - activeTimer.startTime.getTime()) / 60000);

    const { error } = await supabase
      .from('board_time_logs')
      .update({
        ended_at: endedAt.toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq('id', activeTimer.logId);

    if (error) {
      toast.error('Failed to stop timer');
      console.error(error);
      return;
    }

    // Update card actual_hours
    const { data: card } = await supabase
      .from('board_cards')
      .select('actual_hours')
      .eq('id', activeTimer.cardId)
      .single();

    const currentHours = card?.actual_hours || 0;
    const newHours = currentHours + (durationMinutes / 60);

    await supabase
      .from('board_cards')
      .update({ actual_hours: newHours })
      .eq('id', activeTimer.cardId);

    // Log activity
    await supabase
      .from('board_card_activity')
      .insert({
        card_id: activeTimer.cardId,
        user_id: user.id,
        activity_type: 'time_logged',
        details: { minutes: durationMinutes },
      });

    setActiveTimer(null);
    setElapsedTime(0);
    queryClient.invalidateQueries({ queryKey: boardKeys.all });
    toast.success(`Timer stopped: ${durationMinutes} minutes logged`);
  }, [activeTimer, queryClient]);

  const logTime = useCallback(async (cardId: string, minutes: number, notes?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in to log time');
      return;
    }

    const startedAt = new Date(Date.now() - minutes * 60000);
    const endedAt = new Date();

    const { error } = await supabase
      .from('board_time_logs')
      .insert({
        card_id: cardId,
        user_id: user.id,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_minutes: minutes,
        notes,
      });

    if (error) {
      toast.error('Failed to log time');
      console.error(error);
      return;
    }

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
        details: { minutes, notes },
      });

    queryClient.invalidateQueries({ queryKey: boardKeys.all });
    toast.success(`${minutes} minutes logged`);
  }, [queryClient]);

  const getCardTimeLogs = useCallback(async (cardId: string): Promise<TimeLog[]> => {
    const { data, error } = await supabase
      .from('board_time_logs')
      .select('*')
      .eq('card_id', cardId)
      .order('started_at', { ascending: false });

    if (error) {
      console.error(error);
      return [];
    }

    return data as TimeLog[];
  }, []);

  return {
    activeTimer,
    elapsedTime,
    startTimer,
    stopTimer,
    logTime,
    getCardTimeLogs,
  };
}

// Helper function to format seconds as HH:MM:SS
export function formatElapsedTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Helper function to format minutes as Xh Ym
export function formatMinutesAsHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  }
  return `${mins}m`;
}
