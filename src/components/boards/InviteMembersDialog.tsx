import { useState } from 'react';
import { UserPlus, X, Search, ExternalLink, Globe, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useProjectCollaborators } from '@/hooks/useProjectCollaborators';
import { boardKeys } from '@/hooks/useBoardData';
import { InviteExternalCollaboratorDialog } from '@/components/collaborators/InviteExternalCollaboratorDialog';

interface BoardMember {
  id: string;
  user_id: string;
  role: string;
  added_at: string;
}

interface InviteMembersDialogProps {
  boardId: string;
  boardName: string;
  existingMembers: BoardMember[];
  createdBy: string;
}

export function InviteMembersDialog({
  boardId,
  boardName,
  existingMembers,
  createdBy,
}: InviteMembersDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [externalDialogOpen, setExternalDialogOpen] = useState(false);
  const { members: teamMembers, loading: loadingTeam, getDisplayName } = useTeamMembers();
  const {
    collaborators: externalCollaborators,
    isLoading: loadingCollaborators,
    getDisplayName: getCollaboratorName,
    refetch: refetchCollaborators,
  } = useProjectCollaborators(boardId, 'board');

  const existingMemberIds = new Set([...existingMembers.map((m) => m.user_id), createdBy]);
  const availableMembers = teamMembers.filter((m) => !existingMemberIds.has(m.id));

  const filteredMembers = availableMembers.filter((member) => {
    const displayName = getDisplayName(member).toLowerCase();
    return displayName.includes(search.toLowerCase());
  });

  const invalidateMembers = () => {
    queryClient.invalidateQueries({ queryKey: boardKeys.members(boardId) });
    refetchCollaborators();
  };

  const handleAddMember = async (userId: string, role: string = 'member') => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('board_members')
        .insert({
          board_id: boardId,
          user_id: userId,
          role: role as 'viewer' | 'member' | 'admin' | 'owner',
        });

      if (error) throw error;

      toast.success('Member added to board');
      invalidateMembers();

      // Send email notification to the added member
      sendAssignmentNotification({
        assigneeUserId: userId,
        itemName: boardName,
        itemType: 'project',
        itemId: boardId,
      }).catch(console.error);
    } catch (error: unknown) {
      console.error('Error adding member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('board_members').delete().eq('id', memberId);

      if (error) throw error;

      toast.success('Member removed from board');
      invalidateMembers();
    } catch (error: unknown) {
      console.error('Error removing member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('board_members')
        .update({ role: newRole as 'viewer' | 'member' | 'admin' | 'owner' })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member role updated');
      invalidateMembers();
    } catch (error: unknown) {
      console.error('Error updating role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveExternalCollaborator = async (collaboratorId: string, userId: string) => {
    setIsLoading(true);
    try {
      const { error: collabError } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (collabError) throw collabError;

      await supabase
        .from('board_members')
        .delete()
        .eq('board_id', boardId)
        .eq('user_id', userId);

      toast.success('External collaborator removed');
      invalidateMembers();
    } catch (error: unknown) {
      console.error('Error removing collaborator:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove collaborator');
    } finally {
      setIsLoading(false);
    }
  };

  const getMemberName = (userId: string) => {
    const member = teamMembers.find((m) => m.id === userId);
    return member ? getDisplayName(member) : 'Unknown User';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const externalCollaboratorIds = new Set(externalCollaborators.map((c) => c.user_id));

  const handleExternalDialogClose = (nextOpen: boolean) => {
    setExternalDialogOpen(nextOpen);
    if (!nextOpen) {
      refetchCollaborators();
      invalidateMembers();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" type="button" onClick={() => setOpen(true)}>
        <Users className="h-4 w-4 mr-2" />
        Team
      </Button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Board Members</DialogTitle>
          <DialogDescription>
            Invite team members to collaborate on this board
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {existingMembers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Current Members</h4>
              <ScrollArea className="max-h-40">
                <div className="space-y-2">
                  {existingMembers.map((member) => {
                    const name = getMemberName(member.user_id);
                    const isExternal = externalCollaboratorIds.has(member.user_id);
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm">{name}</span>
                            {isExternal && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 w-fit">
                                <Globe className="h-2.5 w-2.5 mr-1" />
                                External
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleUpdateRole(member.id, value)}
                            disabled={isLoading}
                          >
                            <SelectTrigger className="h-8 w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {!loadingCollaborators && externalCollaborators.filter((c) => c.status === 'pending').length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Pending Invitations</h4>
              <ScrollArea className="max-h-32">
                <div className="space-y-2">
                  {externalCollaborators
                    .filter((c) => c.status === 'pending')
                    .map((collaborator) => {
                      const name = getCollaboratorName(collaborator);
                      return (
                        <div
                          key={collaborator.id}
                          className="flex items-center justify-between p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-amber-100 text-amber-700">
                                {getInitials(name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm">{name}</span>
                              <span className="text-[10px] text-muted-foreground">
                                Invited as {collaborator.role}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemoveExternalCollaborator(collaborator.id, collaborator.user_id)}
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Add Members</h4>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <ScrollArea className="max-h-48">
              <div className="space-y-1">
                {loadingTeam ? (
                  <p className="text-sm text-muted-foreground p-2">Loading...</p>
                ) : filteredMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">
                    {search ? 'No members found' : 'All team members have been added'}
                  </p>
                ) : (
                  filteredMembers.map((member) => {
                    const name = getDisplayName(member);
                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleAddMember(member.id, 'member')}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-muted">
                              {getInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{name}</span>
                        </div>
                        <Button variant="ghost" size="sm" disabled={isLoading}>
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">External Collaborators</h4>
            <p className="text-xs text-muted-foreground">
              Invite someone outside your organization to collaborate on this project
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setExternalDialogOpen(true)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Invite External Collaborator
            </Button>
          </div>
        </div>
      </DialogContent>

      <InviteExternalCollaboratorDialog
        open={externalDialogOpen}
        onOpenChange={handleExternalDialogClose}
        projectType="board"
        projectId={boardId}
        projectName={boardName}
      />
    </Dialog>
  );
}
