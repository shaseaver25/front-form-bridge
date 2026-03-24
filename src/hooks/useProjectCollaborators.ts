import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectCollaborator {
  id: string;
  user_id: string;
  project_type: string;
  project_id: string;
  role: string | null;
  status: string | null;
  invited_at: string | null;
  access_expires_at: string | null;
  user_profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    user_type: string | null;
  } | null;
}

export const useProjectCollaborators = (projectId: string, projectType: string = 'board') => {
  const { data: collaborators, isLoading, error, refetch } = useQuery({
    queryKey: ['project-collaborators', projectId, projectType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_collaborators')
        .select(`
          id,
          user_id,
          project_type,
          project_id,
          role,
          status,
          invited_at,
          access_expires_at
        `)
        .eq('project_id', projectId)
        .eq('project_type', projectType);

      if (error) throw error;

      // Fetch user profiles for each collaborator
      const userIds = (data || []).map(c => c.user_id);
      
      if (userIds.length === 0) {
        return [];
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return (data || []).map(collab => ({
        ...collab,
        user_profile: profileMap.get(collab.user_id) || null
      })) as ProjectCollaborator[];
    },
    enabled: !!projectId
  });

  const getDisplayName = (collaborator: ProjectCollaborator): string => {
    if (collaborator.user_profile?.first_name || collaborator.user_profile?.last_name) {
      return [collaborator.user_profile.first_name, collaborator.user_profile.last_name]
        .filter(Boolean)
        .join(' ');
    }
    return 'External User';
  };

  const isExternalCollaborator = (collaborator: ProjectCollaborator): boolean => {
    return collaborator.user_profile?.user_type === 'external_collaborator';
  };

  return {
    collaborators: collaborators || [],
    isLoading,
    error,
    refetch,
    getDisplayName,
    isExternalCollaborator
  };
};
