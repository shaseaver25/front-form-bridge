import { supabase } from '@/integrations/supabase/client';

interface SendAssignmentNotificationParams {
  assigneeUserId: string;
  itemName: string;
  itemType: 'project' | 'task';
  projectName?: string;
  itemId?: string;
}

export async function sendAssignmentNotification({
  assigneeUserId,
  itemName,
  itemType,
  projectName,
  itemId,
}: SendAssignmentNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current user as the assigner
    const { data: { user } } = await supabase.auth.getUser();
    
    // Don't send notification if assigning to yourself
    if (user?.id === assigneeUserId) {
      console.warn('Skipping notification - user is assigning to themselves');
      return { success: true };
    }

    const { data, error } = await supabase.functions.invoke('send-assignment-notification', {
      body: {
        assignee_user_id: assigneeUserId,
        item_name: itemName,
        item_type: itemType,
        project_name: projectName,
        assigned_by_user_id: user?.id,
        item_id: itemId,
      },
    });

    if (error) {
      console.error('Failed to send assignment notification:', error);
      return { success: false, error: error.message };
    }

    console.warn('Assignment notification sent successfully');
    return { success: true };
  } catch (err) {
    console.error('Error sending assignment notification:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
