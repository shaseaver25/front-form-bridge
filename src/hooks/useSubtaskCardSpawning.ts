import { supabase } from '@/integrations/supabase/client';

interface SubtaskForSpawn {
  id: string;
  text: string;
  position: number;
  is_completed: boolean | null;
  spawned_card_id: string | null;
}

/**
 * Check if a column is a "Progress" type column
 */
export function isProgressColumn(column: { title: string; column_type: string | null }): boolean {
  const title = column.title.toLowerCase();
  return (
    column.column_type === 'in_progress' ||
    title.includes('progress') ||
    title.includes('in progress') ||
    title.includes('doing') ||
    title.includes('working')
  );
}

/**
 * Spawn subtasks as visible cards when a parent card moves to a Progress column
 */
export async function spawnSubtaskCards({
  cardId,
  boardId,
  toColumnId,
  userId,
}: {
  cardId: string;
  boardId: string;
  toColumnId: string;
  userId: string;
}): Promise<{ spawned: number }> {
  // Check if destination column is a "Progress" column
  const { data: toColumn } = await supabase
    .from('board_columns')
    .select('title, column_type')
    .eq('id', toColumnId)
    .single();

  if (!toColumn || !isProgressColumn(toColumn)) {
    return { spawned: 0 };
  }

  // Get incomplete subtasks that haven't been spawned yet
  const { data: subtasks, error: subtasksError } = await supabase
    .from('board_card_subtasks')
    .select('id, text, position, is_completed, spawned_card_id')
    .eq('card_id', cardId)
    .is('spawned_card_id', null)
    .order('position');

  if (subtasksError || !subtasks || subtasks.length === 0) {
    return { spawned: 0 };
  }

  // Filter only incomplete subtasks
  const incompleteSubtasks = subtasks.filter(s => !s.is_completed) as SubtaskForSpawn[];
  
  if (incompleteSubtasks.length === 0) {
    return { spawned: 0 };
  }

  // Get the parent card's headline for reference
  const { data: parentCard } = await supabase
    .from('board_cards')
    .select('headline, priority')
    .eq('id', cardId)
    .single();

  // Get max position in the target column
  const { data: existingCards } = await supabase
    .from('board_cards')
    .select('position')
    .eq('column_id', toColumnId)
    .order('position', { ascending: false })
    .limit(1);

  let nextPosition = (existingCards?.[0]?.position ?? -1) + 1;

  // Create cards for each incomplete subtask
  for (const subtask of incompleteSubtasks) {
    const { data: newCard, error: cardError } = await supabase
      .from('board_cards')
      .insert({
        board_id: boardId,
        column_id: toColumnId,
        headline: subtask.text,
        description: `Subtask from: ${parentCard?.headline || 'Parent Card'}`,
        created_by: userId,
        position: nextPosition,
        priority: parentCard?.priority || 'medium',
        parent_subtask_id: subtask.id,
      })
      .select()
      .single();

    if (cardError) {
      console.error('Failed to spawn subtask card:', cardError);
      continue;
    }

    // Link the spawned card back to the subtask
    await supabase
      .from('board_card_subtasks')
      .update({ spawned_card_id: newCard.id })
      .eq('id', subtask.id);

    // Log activity
    await supabase
      .from('board_card_activity')
      .insert({
        card_id: newCard.id,
        user_id: userId,
        activity_type: 'created',
        details: { spawned_from_subtask: true, parent_card_id: cardId },
      });

    nextPosition++;
  }

  return { spawned: incompleteSubtasks.length };
}

/**
 * Sync a spawned card's completion status back to its parent subtask
 */
export async function syncSpawnedCardToSubtask({
  cardId,
  isCompleted,
  userId,
}: {
  cardId: string;
  isCompleted: boolean;
  userId: string;
}): Promise<void> {
  // Get the card's parent_subtask_id
  const { data: card } = await supabase
    .from('board_cards')
    .select('parent_subtask_id')
    .eq('id', cardId)
    .single();

  if (!card?.parent_subtask_id) {
    return;
  }

  // Update the parent subtask
  await supabase
    .from('board_card_subtasks')
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq('id', card.parent_subtask_id);
}
