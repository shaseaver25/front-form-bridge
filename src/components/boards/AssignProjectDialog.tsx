import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Search, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { sendAssignmentNotification } from '@/hooks/useAssignmentNotification';
import { useProjectCollaborators } from '@/hooks/useProjectCollaborators';

interface AssignProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  currentAssignee?: string | null;
}

interface TeamMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  full_name: string | null;
  isExternal?: boolean;
}

export function AssignProjectDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  currentAssignee
}: AssignProjectDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch project collaborators (external)
  const { 
    collaborators, 
    isLoading: loadingCollaborators,
    getDisplayName: getCollaboratorName 
  } = useProjectCollaborators(projectId, 'board');

  // Fetch all team members
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['team-members-for-assignment', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, avatar_url')
        .order('first_name');
      
      if (error) throw error;
      return data?.map(m => ({
        ...m,
        full_name: [m.first_name, m.last_name].filter(Boolean).join(' ') || null,
        isExternal: false
      })) as TeamMember[];
    },
    enabled: open
  });

  // Combine team members with external collaborators
  const allAssignableMembers: TeamMember[] = [
    ...(teamMembers || []),
    ...collaborators
      .filter(c => c.status === 'accepted' || c.status === 'pending')
      .filter(c => !teamMembers?.some(m => m.id === c.user_id)) // Don't duplicate
      .map(c => ({
        id: c.user_id,
        first_name: c.user_profile?.first_name || null,
        last_name: c.user_profile?.last_name || null,
        avatar_url: null,
        full_name: getCollaboratorName(c),
        isExternal: true
      }))
  ];

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: async (userId: string | null) => {
      const { error } = await supabase
        .from('boards')
        .update({ assigned_to: userId, updated_at: new Date().toISOString() })
        .eq('id', projectId);
      
      if (error) throw error;
      
      // Send notification if assigning to someone (not unassigning)
      if (userId && userId !== currentAssignee) {
        sendAssignmentNotification({
          assigneeUserId: userId,
          itemName: projectName,
          itemType: 'project',
          itemId: projectId,
        }).catch(console.error); // Fire and forget
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Project assignment updated');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error assigning project:', error);
      toast.error('Failed to assign project');
    }
  });

  const filteredMembers = allAssignableMembers?.filter((member) =>
    member.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isLoaderVisible = isLoading || loadingCollaborators;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Assign Project</DialogTitle>
          <DialogDescription>
            Select a team member to own "{projectName}"
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[300px] -mx-6 px-6">
          <div className="space-y-1">
            {/* Unassign option */}
            <button
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left",
                !currentAssignee && "bg-muted"
              )}
              onClick={() => assignMutation.mutate(null)}
              disabled={assignMutation.isPending}
            >
              <div className="w-8 h-8 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm text-muted-foreground">Unassigned</span>
              {!currentAssignee && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </button>

            {isLoaderVisible ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Loading team members...
              </div>
            ) : filteredMembers?.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No team members found
              </div>
            ) : (
              filteredMembers?.map((member) => (
                <button
                  key={member.id}
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left",
                    currentAssignee === member.id && "bg-muted"
                  )}
                  onClick={() => assignMutation.mutate(member.id)}
                  disabled={assignMutation.isPending}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={cn(
                      "text-xs",
                      member.isExternal && "bg-amber-100 text-amber-700"
                    )}>
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-medium">{member.full_name || 'Unknown'}</span>
                    {member.isExternal && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        <Globe className="h-2.5 w-2.5 mr-1" />
                        External
                      </Badge>
                    )}
                  </div>
                  {currentAssignee === member.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
