import { useState, useEffect } from 'react';
import { HelpCircle, User } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTeamMembers, TeamMember } from '@/hooks/useTeamMembers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuestionForFieldProps {
  cardId: string;
  cardHeadline: string;
  boardId: string;
  questionFor: string | null;
  onChange: (userId: string | null) => void;
  isLoading?: boolean;
}

export function QuestionForField({
  cardId,
  cardHeadline,
  boardId,
  questionFor,
  onChange,
  isLoading,
}: QuestionForFieldProps) {
  const { members, getDisplayName, getMemberById } = useTeamMembers();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleChange = async (value: string) => {
    const newValue = value === 'none' ? null : value;
    onChange(newValue);

    // Send notification to the selected person
    if (newValue && currentUserId && newValue !== currentUserId) {
      try {
        // Get current user's name
        const currentUser = getMemberById(currentUserId);
        const currentUserName = currentUser ? getDisplayName(currentUser) : 'Someone';

        await supabase.from('notifications').insert({
          user_id: newValue,
          type: 'task_question',
          title: 'Question on task',
          message: `${currentUserName} has a question about "${cardHeadline}"`,
          link: `/boards/${boardId}?card=${cardId}`,
          read: false,
        });

        toast.success('Notification sent');
      } catch (err) {
        console.error('Failed to send notification:', err);
      }
    }
  };

  const selectedMember = questionFor ? getMemberById(questionFor) : null;

  return (
    <div className="space-y-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
      <Label className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
        <HelpCircle className="h-4 w-4" />
        Question For
      </Label>
      <p className="text-xs text-muted-foreground mb-2">
        Select a team member to notify about your question
      </p>
      <Select
        value={questionFor || 'none'}
        onValueChange={handleChange}
        disabled={isLoading}
      >
        <SelectTrigger>
          <SelectValue>
            {selectedMember ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-amber-500/20 text-amber-700">
                    {getInitials(getDisplayName(selectedMember))}
                  </AvatarFallback>
                </Avatar>
                <span>{getDisplayName(selectedMember)}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Select team member...</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              No one selected
            </div>
          </SelectItem>
          {members
            .filter(m => m.id !== currentUserId)
            .map((member) => (
              <SelectItem key={member.id} value={member.id}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {getInitials(getDisplayName(member))}
                    </AvatarFallback>
                  </Avatar>
                  <span>{getDisplayName(member)}</span>
                </div>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
