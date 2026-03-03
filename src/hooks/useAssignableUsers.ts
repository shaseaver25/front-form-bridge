import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AssignableUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export function useAssignableUsers(boardId?: string) {
  return useQuery({
    queryKey: ['assignable-users', boardId],
    queryFn: async (): Promise<AssignableUser[]> => {
      // Get all active users from user_profiles
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .eq('is_active', true)
        .order('first_name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function getDisplayName(user: AssignableUser): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  if (user.first_name) return user.first_name;
  if (user.last_name) return user.last_name;
  if (user.email) return user.email;
  return 'Unknown User';
}
