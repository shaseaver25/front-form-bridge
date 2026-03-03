import { useActivityStream, Activity } from '@/hooks/useActivityStream';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText,
  MessageSquare,
  Edit,
  Upload,
  Plus,
  Trash2,
  Activity as ActivityIcon,
} from 'lucide-react';

interface ActivityStreamProps {
  recordType: string;
  recordId: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'field_update':
      return <Edit className="h-4 w-4" />;
    case 'comment':
      return <MessageSquare className="h-4 w-4" />;
    case 'status_change':
      return <ActivityIcon className="h-4 w-4" />;
    case 'file_upload':
      return <Upload className="h-4 w-4" />;
    case 'created':
      return <Plus className="h-4 w-4" />;
    case 'deleted':
      return <Trash2 className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getActivityBadgeVariant = (type: string) => {
  switch (type) {
    case 'field_update':
      return 'default';
    case 'comment':
      return 'secondary';
    case 'status_change':
      return 'default';
    case 'file_upload':
      return 'outline';
    default:
      return 'secondary';
  }
};

export const ActivityStream = ({ recordType, recordId }: ActivityStreamProps) => {
  const { activities, loading } = useActivityStream(recordType, recordId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Stream</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading activities...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Activity Stream</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="space-y-4 p-6">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activities yet
              </p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 animate-fade-in"
                >
                  <Avatar className="h-8 w-8">
                    {activity.user_avatar ? (
                      <AvatarImage src={activity.user_avatar} alt={activity.user_name} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {activity.user_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={getActivityBadgeVariant(activity.activity_type)}
                        className="h-6 gap-1"
                      >
                        {getActivityIcon(activity.activity_type)}
                        <span className="text-xs">{activity.activity_type.replace('_', ' ')}</span>
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">{activity.user_name}</span>{' '}
                      {activity.description}
                    </p>
                    {activity.field_name && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">{activity.field_name}:</span>{' '}
                        {activity.old_value && (
                          <>
                            <span className="line-through">{JSON.stringify(activity.old_value)}</span>
                            {' → '}
                          </>
                        )}
                        {activity.new_value && (
                          <span className="font-medium">{JSON.stringify(activity.new_value)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
