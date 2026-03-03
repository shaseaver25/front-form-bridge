import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FieldLock {
  id: string;
  record_type: string;
  record_id: string;
  field_name: string;
  locked_by: string;
  locked_at: string;
  expires_at: string;
}

export const useFieldLock = (recordType: string, recordId: string) => {
  const [locks, setLocks] = useState<Map<string, FieldLock>>(new Map());
  const [myLocks, setMyLocks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchLocks = async () => {
      // Clean up expired locks first
      await supabase.rpc('cleanup_expired_locks');

      const { data, error } = await supabase
        .from('record_locks')
        .select('*')
        .eq('record_type', recordType)
        .eq('record_id', recordId);

      if (!error && data) {
        const lockMap = new Map<string, FieldLock>();
        data.forEach((lock) => {
          lockMap.set(lock.field_name, lock as FieldLock);
        });
        setLocks(lockMap);
      }
    };

    fetchLocks();

    // Poll for lock updates every 5 seconds
    const interval = setInterval(fetchLocks, 5000);

    return () => clearInterval(interval);
  }, [recordType, recordId]);

  const acquireLock = useCallback(
    async (fieldName: string): Promise<boolean> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Try to acquire lock
      const { error } = await supabase.from('record_locks').insert({
        record_type: recordType,
        record_id: recordId,
        field_name: fieldName,
        locked_by: user.id,
      });

      if (!error) {
        setMyLocks((prev) => new Set(prev).add(fieldName));
        return true;
      }

      console.error('Failed to acquire lock:', error);
      return false;
    },
    [recordType, recordId]
  );

  const releaseLock = useCallback(
    async (fieldName: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('record_locks')
        .delete()
        .eq('record_type', recordType)
        .eq('record_id', recordId)
        .eq('field_name', fieldName)
        .eq('locked_by', user.id);

      setMyLocks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fieldName);
        return newSet;
      });
    },
    [recordType, recordId]
  );

  const refreshLock = useCallback(
    async (fieldName: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('record_locks')
        .update({
          expires_at: new Date(Date.now() + 30000).toISOString(),
        })
        .eq('record_type', recordType)
        .eq('record_id', recordId)
        .eq('field_name', fieldName)
        .eq('locked_by', user.id);
    },
    [recordType, recordId]
  );

  const isFieldLocked = useCallback(
    (fieldName: string): boolean => {
      return locks.has(fieldName);
    },
    [locks]
  );

  const isFieldLockedByMe = useCallback(
    (fieldName: string): boolean => {
      return myLocks.has(fieldName);
    },
    [myLocks]
  );

  const getFieldLock = useCallback(
    (fieldName: string): FieldLock | undefined => {
      return locks.get(fieldName);
    },
    [locks]
  );

  return {
    acquireLock,
    releaseLock,
    refreshLock,
    isFieldLocked,
    isFieldLockedByMe,
    getFieldLock,
  };
};
