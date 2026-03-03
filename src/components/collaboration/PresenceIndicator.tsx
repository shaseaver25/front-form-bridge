import { usePresence, PresenceUser } from '@/hooks/usePresence';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { Users } from 'lucide-react';

interface PresenceIndicatorProps {
  recordType: string;
  recordId: string;
}

export const PresenceIndicator = ({ recordType, recordId }: PresenceIndicatorProps) => {
  const { activeUsers } = usePresence(recordType, recordId);

  const visibleUsers = activeUsers.slice(0, 5);
  const additionalCount = activeUsers.length - 5;

  if (activeUsers.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>Just you</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <div className="flex -space-x-2">
          {visibleUsers.map((user) => (
            <Tooltip key={user.user_id}>
              <TooltipTrigger>
                <Avatar className="h-8 w-8 border-2 border-background">
                  {user.user_avatar ? (
                    <AvatarImage src={user.user_avatar} alt={user.user_name} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.user_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                  {user.is_editing && (
                    <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 border border-background" />
                  )}
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p className="font-medium">{user.user_name}</p>
                  <p className="text-muted-foreground">
                    Viewing since {formatDistanceToNow(new Date(user.viewing_since))} ago
                  </p>
                  {user.is_editing && (
                    <p className="text-green-600 font-medium">Currently editing</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          {additionalCount > 0 && (
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    +{additionalCount}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{additionalCount} more users</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
