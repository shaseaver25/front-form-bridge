import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Comment {
  id: string;
  record_type: string;
  record_id: string;
  field_name?: string;
  parent_comment_id?: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  mentions: string[];
  reactions: Record<string, string[]>;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export const useComments = (recordType: string, recordId: string, fieldName?: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const fetchComments = async () => {
      let query = supabase
        .from('comments')
        .select('*')
        .eq('record_type', recordType)
        .eq('record_id', recordId)
        .order('created_at', { ascending: true });

      if (fieldName) {
        query = query.eq('field_name', fieldName);
      } else {
        query = query.is('field_name', null);
      }

      const { data, error } = await query;

      if (!error && data) {
        setComments(data as Comment[]);
      }
      setLoading(false);
    };

    fetchComments();

    // Subscribe to real-time updates
    const commentChannel = supabase
      .channel(`comments:${recordType}:${recordId}${fieldName ? `:${fieldName}` : ''}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `record_id=eq.${recordId}`,
        },
        (payload) => {
          const newComment = payload.new as Comment;
          setComments((prev) => [...prev, newComment]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `record_id=eq.${recordId}`,
        },
        (payload) => {
          const updatedComment = payload.new as Comment;
          setComments((prev) =>
            prev.map((c) => (c.id === updatedComment.id ? updatedComment : c))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `record_id=eq.${recordId}`,
        },
        (payload) => {
          const deletedComment = payload.old as Comment;
          setComments((prev) => prev.filter((c) => c.id !== deletedComment.id));
        }
      )
      .subscribe();

    setChannel(commentChannel);

    return () => {
      if (commentChannel) {
        commentChannel.unsubscribe();
      }
    };
  }, [recordType, recordId, fieldName]);

  const addComment = async (content: string, parentId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('comments').insert({
      record_type: recordType,
      record_id: recordId,
      field_name: fieldName,
      parent_comment_id: parentId,
      user_id: user.id,
      user_name: user.email?.split('@')[0] || 'Unknown User',
      user_avatar: user.user_metadata?.avatar_url,
      content,
      mentions: [],
      reactions: {},
      is_resolved: false,
    });

    if (error) {
      console.error('Error adding comment:', error);
    }
  };

  const updateComment = async (commentId: string, content: string) => {
    const { error } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', commentId);

    if (error) {
      console.error('Error updating comment:', error);
    }
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const toggleReaction = async (commentId: string, emoji: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    const reactions = { ...comment.reactions };
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    if (reactions[emoji].includes(user.id)) {
      reactions[emoji] = reactions[emoji].filter((id) => id !== user.id);
    } else {
      reactions[emoji].push(user.id);
    }

    // Remove empty reaction arrays
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }

    const { error } = await supabase
      .from('comments')
      .update({ reactions })
      .eq('id', commentId);

    if (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const resolveComment = async (commentId: string, resolved: boolean) => {
    const { error } = await supabase
      .from('comments')
      .update({ is_resolved: resolved })
      .eq('id', commentId);

    if (error) {
      console.error('Error resolving comment:', error);
    }
  };

  return {
    comments,
    loading,
    addComment,
    updateComment,
    deleteComment,
    toggleReaction,
    resolveComment,
  };
};
