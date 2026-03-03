import { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Send, Check, X } from 'lucide-react';

interface CommentThreadProps {
  recordType: string;
  recordId: string;
  fieldName?: string;
}

export const CommentThread = ({ recordType, recordId, fieldName }: CommentThreadProps) => {
  const {
    comments,
    loading,
    addComment,
    toggleReaction,
    resolveComment,
  } = useComments(recordType, recordId, fieldName);

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    await addComment(newComment);
    setNewComment('');
    setIsSubmitting(false);
  };

  const unresolvedComments = comments.filter((c) => !c.is_resolved && !c.parent_comment_id);
  const resolvedComments = comments.filter((c) => c.is_resolved && !c.parent_comment_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments {fieldName && `on ${fieldName}`}
          {unresolvedComments.length > 0 && (
            <Badge variant="secondary">{unresolvedComments.length} unresolved</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Comment
            </Button>
          </div>
        </form>

        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Loading comments...
              </p>
            ) : unresolvedComments.length === 0 && resolvedComments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <>
                {unresolvedComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-3 p-3 rounded-lg border bg-card animate-fade-in"
                  >
                    <Avatar className="h-8 w-8">
                      {comment.user_avatar ? (
                        <AvatarImage src={comment.user_avatar} alt={comment.user_name} />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {comment.user_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm">{comment.user_name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {formatDistanceToNow(new Date(comment.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        {fieldName && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resolveComment(comment.id, true)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                      <p className="text-sm">{comment.content}</p>
                      <div className="flex gap-2">
                        {['👍', '❤️', '😊', '🎉'].map((emoji) => {
                          const reactions = comment.reactions[emoji] || [];
                          const count = reactions.length;
                          return (
                            <Button
                              key={emoji}
                              variant="outline"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => toggleReaction(comment.id, emoji)}
                            >
                              {emoji} {count > 0 && count}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {resolvedComments.length > 0 && (
                  <>
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Resolved Comments
                      </p>
                    </div>
                    {resolvedComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex gap-3 p-3 rounded-lg border bg-muted/50 opacity-60"
                      >
                        <Avatar className="h-8 w-8">
                          {comment.user_avatar ? (
                            <AvatarImage src={comment.user_avatar} alt={comment.user_name} />
                          ) : (
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {comment.user_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-sm">{comment.user_name}</span>
                              <Badge variant="secondary" className="ml-2">
                                <Check className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resolveComment(comment.id, false)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Unresolve
                            </Button>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
