import { PresenceIndicator } from './PresenceIndicator';
import { Button } from '@/components/ui/button';
import { MessageSquare, Activity as ActivityIcon } from 'lucide-react';

interface CollaborationToolbarProps {
  recordType: string;
  recordId: string;
  onShowActivity: () => void;
  onShowComments: () => void;
}

export const CollaborationToolbar = ({
  recordType,
  recordId,
  onShowActivity,
  onShowComments,
}: CollaborationToolbarProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-card">
      <PresenceIndicator recordType={recordType} recordId={recordId} />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onShowActivity}>
          <ActivityIcon className="h-4 w-4 mr-2" />
          Activity
        </Button>
        <Button variant="outline" size="sm" onClick={onShowComments}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Comments
        </Button>
      </div>
    </div>
  );
};
