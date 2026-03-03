import { useMemo } from 'react';
import { useBoardContext } from '@/contexts/BoardContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { BoardMemberRole } from '@/types/boards';

interface BoardPermissions {
  canView: boolean;
  canCreateCards: boolean;
  canEditOwnCards: boolean;
  canEditAnyCard: boolean;
  canDeleteCards: boolean;
  canManageColumns: boolean;
  canManageSettings: boolean;
  canInviteMembers: boolean;
  canDeleteBoard: boolean;
  role: BoardMemberRole | 'owner' | null;
  isLoading: boolean;
}

export function useBoardPermissions(boardId: string): BoardPermissions {
  const { state } = useBoardContext();
  const { board, members } = state;

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const permissions = useMemo<BoardPermissions>(() => {
    if (!currentUser || !board) {
      return {
        canView: false,
        canCreateCards: false,
        canEditOwnCards: false,
        canEditAnyCard: false,
        canDeleteCards: false,
        canManageColumns: false,
        canManageSettings: false,
        canInviteMembers: false,
        canDeleteBoard: false,
        role: null,
        isLoading: true,
      };
    }

    const isOwner = board.created_by === currentUser.id;
    const memberRecord = members.find(m => m.user_id === currentUser.id);
    const memberRole = memberRecord?.role as BoardMemberRole | undefined;

    // Determine effective role
    const effectiveRole: BoardMemberRole | 'owner' | null = isOwner ? 'owner' : memberRole || null;

    // Permission matrix
    const isAdminOrOwner = isOwner || memberRole === 'owner' || memberRole === 'admin';
    const isMember = isAdminOrOwner || memberRole === 'member';
    const isViewer = isMember || memberRole === 'viewer';

    return {
      canView: isViewer,
      canCreateCards: isMember,
      canEditOwnCards: isMember,
      canEditAnyCard: isAdminOrOwner,
      canDeleteCards: isAdminOrOwner,
      canManageColumns: isAdminOrOwner,
      canManageSettings: isAdminOrOwner,
      canInviteMembers: isAdminOrOwner,
      canDeleteBoard: isOwner,
      role: effectiveRole,
      isLoading: false,
    };
  }, [currentUser, board, members]);

  return permissions;
}

// Hook for checking if user can perform a specific action
export function useCanPerformAction(
  action: keyof Omit<BoardPermissions, 'role' | 'isLoading'>,
  boardId: string
): boolean {
  const permissions = useBoardPermissions(boardId);
  return permissions[action];
}
