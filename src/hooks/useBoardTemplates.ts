import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface BoardTemplateData {
  columns: Array<{
    title: string;
    type: string;
    isDoneColumn: boolean;
  }>;
  cards: Array<{
    headline: string;
    description: string | null;
    priority: string;
    columnTitle: string;
    subtasks: string[];
  }>;
  automations: Array<{
    name: string;
    trigger_type: string;
    trigger_config: Record<string, unknown>;
    action_type: string;
    action_config: Record<string, unknown>;
  }>;
}

export interface BoardTemplate {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  template_data: BoardTemplateData | Json;
  category: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useBoardTemplates(category?: string) {
  return useQuery({
    queryKey: ['board-templates', category],
    queryFn: async () => {
      let query = supabase
        .from('board_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as BoardTemplate[];
    },
  });
}

export function useBoardTemplatesAdmin() {
  return useQuery({
    queryKey: ['board-templates-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('board_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as BoardTemplate[];
    },
  });
}

export function useSaveAsTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      name,
      description,
      category,
      includeAssignees,
    }: {
      boardId: string;
      name: string;
      description: string;
      category: string;
      includeAssignees: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch board data
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (boardError) throw boardError;

      // Fetch columns
      const { data: columns, error: colError } = await supabase
        .from('board_columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position');

      if (colError) throw colError;

      // Fetch cards with subtasks
      const { data: cards, error: cardsError } = await supabase
        .from('board_cards')
        .select(`
          *,
          board_card_subtasks(text, position)
        `)
        .eq('board_id', boardId)
        .order('position');

      if (cardsError) throw cardsError;

      // Fetch automations
      const { data: automations, error: autoError } = await supabase
        .from('board_automations')
        .select('*')
        .eq('board_id', boardId);

      if (autoError) throw autoError;

      // Build column map for referencing
      const columnMap: Record<string, string> = {};
      columns.forEach(col => {
        columnMap[col.id] = col.title;
      });

      // Build template data
      const templateData: BoardTemplateData = {
        columns: columns.map(col => ({
          title: col.title,
          type: col.column_type || 'custom',
          isDoneColumn: col.is_done_column || false,
        })),
        cards: cards.map(card => {
          const subtasks = Array.isArray(card.board_card_subtasks) 
            ? card.board_card_subtasks as Array<{ text: string; position: number }>
            : [];
          return {
            headline: card.headline,
            description: card.description,
            priority: card.priority || 'medium',
            columnTitle: columnMap[card.column_id] || '',
            subtasks: subtasks
              .sort((a, b) => a.position - b.position)
              .map((s) => s.text),
          };
        }),
        automations: automations.map(auto => ({
          name: auto.name,
          trigger_type: auto.trigger_type,
          trigger_config: auto.trigger_config as Record<string, unknown>,
          action_type: auto.action_type,
          action_config: auto.action_config as Record<string, unknown>,
        })),
      };

      // Create the template
      const { data: template, error: templateError } = await supabase
        .from('board_templates')
        .insert({
          name,
          description: description || null,
          category,
          template_data: templateData as unknown as Json,
          created_by: user.id,
        })
        .select()
        .single();

      if (templateError) throw templateError;
      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-templates'] });
      toast.success('Template saved successfully!');
    },
    onError: (error) => {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      updates,
    }: {
      templateId: string;
      updates: Partial<Pick<BoardTemplate, 'name' | 'description' | 'category' | 'is_active'>>;
    }) => {
      const { data, error } = await supabase
        .from('board_templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-templates'] });
      queryClient.invalidateQueries({ queryKey: ['board-templates-admin'] });
      toast.success('Template updated');
    },
    onError: () => {
      toast.error('Failed to update template');
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('board_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-templates'] });
      queryClient.invalidateQueries({ queryKey: ['board-templates-admin'] });
      toast.success('Template deleted');
    },
    onError: () => {
      toast.error('Failed to delete template');
    },
  });
}

export function useCreateBoardFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      boardName,
      memberIds,
    }: {
      templateId: string;
      boardName: string;
      memberIds?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch template
      const { data: template, error: templateError } = await supabase
        .from('board_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      const templateData = template.template_data as unknown as BoardTemplateData;

      // Create board
      const boardType = template.category === 'training' ? 'general' : 
                        template.category === 'onboarding' ? 'general' :
                        template.category === 'project' ? 'general' :
                        (template.category as 'general' | 'grant_application' | 'event' | 'campaign' | 'program');
      
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .insert({
          name: boardName,
          description: template.description,
          board_type: boardType,
          created_by: user.id,
          template_id: templateId,
        })
        .select()
        .single();

      if (boardError) throw boardError;

      // Add owner
      await supabase.from('board_members').insert({
        board_id: board.id,
        user_id: user.id,
        role: 'owner' as const,
      });

      // Add additional members
      if (memberIds?.length) {
        for (const userId of memberIds) {
          await supabase.from('board_members').insert({
            board_id: board.id,
            user_id: userId,
            role: 'member' as const,
          });
        }
      }

      // Create columns
      const columnMap: Record<string, string> = {};
      for (let i = 0; i < templateData.columns.length; i++) {
        const col = templateData.columns[i];
        const columnType = col.type as 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'custom';
        const { data: column, error: colError } = await supabase
          .from('board_columns')
          .insert({
            board_id: board.id,
            title: col.title,
            column_type: columnType,
            is_done_column: col.isDoneColumn,
            position: i,
          })
          .select()
          .single();

        if (colError) throw colError;
        columnMap[col.title] = column.id;
      }

      // Create cards
      const cardPositions: Record<string, number> = {};
      for (const card of templateData.cards) {
        const columnId = columnMap[card.columnTitle];
        if (!columnId) continue;

        const position = cardPositions[columnId] || 0;
        cardPositions[columnId] = position + 1;

        const cardPriority = card.priority as 'low' | 'medium' | 'high' | 'urgent';
        const { data: newCard, error: cardError } = await supabase
          .from('board_cards')
          .insert({
            board_id: board.id,
            column_id: columnId,
            headline: card.headline,
            description: card.description,
            priority: cardPriority,
            position,
            created_by: user.id,
          })
          .select()
          .single();

        if (cardError) throw cardError;

        // Create subtasks
        if (card.subtasks?.length) {
          for (let i = 0; i < card.subtasks.length; i++) {
            await supabase.from('board_card_subtasks').insert({
              card_id: newCard.id,
              text: card.subtasks[i],
              position: i,
            });
          }
        }
      }

      // Create automations
      for (const auto of templateData.automations || []) {
        const triggerType = auto.trigger_type as 'card_moved' | 'card_created' | 'due_date_approaching' | 'card_completed';
        const actionType = auto.action_type as 'assign_user' | 'set_priority' | 'add_label' | 'notify' | 'move_card';
        await supabase.from('board_automations').insert({
          board_id: board.id,
          name: auto.name,
          trigger_type: triggerType,
          trigger_config: auto.trigger_config as Json,
          action_type: actionType,
          action_config: auto.action_config as Json,
        });
      }

      return board;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Board created from template!');
    },
    onError: (error) => {
      console.error('Error creating board from template:', error);
      toast.error('Failed to create board');
    },
  });
}

export function useDuplicateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      newName,
      titleSuffix,
      options,
    }: {
      boardId: string;
      newName: string;
      titleSuffix?: string;
      options: {
        includeDescriptions: boolean;
        includeSubtasks: boolean;
        includeLabels: boolean;
        includeAutomations: boolean;
        includeAssignees: boolean;
      };
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch original board
      const { data: originalBoard, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (boardError) throw boardError;

      // Fetch columns
      const { data: columns, error: colError } = await supabase
        .from('board_columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position');

      if (colError) throw colError;

      // Fetch cards with subtasks
      const { data: cards, error: cardsError } = await supabase
        .from('board_cards')
        .select(`
          *,
          board_card_subtasks(*)
        `)
        .eq('board_id', boardId)
        .order('position');

      if (cardsError) throw cardsError;

      // Fetch automations if needed
      let automations: Array<{
        name: string;
        trigger_type: string;
        trigger_config: unknown;
        action_type: string;
        action_config: unknown;
      }> = [];
      if (options.includeAutomations) {
        const { data: autoData } = await supabase
          .from('board_automations')
          .select('*')
          .eq('board_id', boardId);
        automations = autoData || [];
      }

      // Create new board
      const { data: newBoard, error: newBoardError } = await supabase
        .from('boards')
        .insert({
          name: newName,
          description: originalBoard.description,
          board_type: originalBoard.board_type,
          theme_color: originalBoard.theme_color,
          created_by: user.id,
        })
        .select()
        .single();

      if (newBoardError) throw newBoardError;

      // Add owner
      await supabase.from('board_members').insert({
        board_id: newBoard.id,
        user_id: user.id,
        role: 'owner',
      });

      // Create columns
      const columnMap: Record<string, string> = {};
      for (const col of columns) {
        const { data: newCol, error: newColError } = await supabase
          .from('board_columns')
          .insert({
            board_id: newBoard.id,
            title: col.title,
            column_type: col.column_type,
            is_done_column: col.is_done_column,
            position: col.position,
            wip_limit: col.wip_limit,
          })
          .select()
          .single();

        if (newColError) throw newColError;
        columnMap[col.id] = newCol.id;
      }

      // Create cards
      for (const card of cards) {
        const newColumnId = columnMap[card.column_id];
        if (!newColumnId) continue;

        const headline = titleSuffix 
          ? `${card.headline} ${titleSuffix}` 
          : card.headline;

        const { data: newCard, error: cardError } = await supabase
          .from('board_cards')
          .insert({
            board_id: newBoard.id,
            column_id: newColumnId,
            headline,
            description: options.includeDescriptions ? card.description : null,
            priority: card.priority,
            position: card.position,
            estimated_hours: card.estimated_hours,
            assigned_to: options.includeAssignees ? card.assigned_to : null,
            created_by: user.id,
          })
          .select()
          .single();

        if (cardError) throw cardError;

        // Create subtasks
        const cardSubtasks = Array.isArray(card.board_card_subtasks) 
          ? card.board_card_subtasks as Array<{ text: string; position: number }>
          : [];
        if (options.includeSubtasks && cardSubtasks.length > 0) {
          for (const s of cardSubtasks) {
            await supabase.from('board_card_subtasks').insert({
              card_id: newCard.id,
              text: s.text,
              position: s.position,
            });
          }
        }
      }

      // Create automations
      if (options.includeAutomations) {
        for (const auto of automations) {
          const triggerType = auto.trigger_type as 'card_moved' | 'card_created' | 'due_date_approaching' | 'card_completed';
          const actionType = auto.action_type as 'assign_user' | 'set_priority' | 'add_label' | 'notify' | 'move_card';
          await supabase.from('board_automations').insert({
            board_id: newBoard.id,
            name: auto.name,
            trigger_type: triggerType,
            trigger_config: auto.trigger_config as Json,
            action_type: actionType,
            action_config: auto.action_config as Json,
          });
        }
      }

      return newBoard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Board duplicated successfully!');
    },
    onError: (error) => {
      console.error('Error duplicating board:', error);
      toast.error('Failed to duplicate board');
    },
  });
}

export function useBulkCreateFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      names,
    }: {
      templateId: string;
      names: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch template
      const { data: template, error: templateError } = await supabase
        .from('board_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;

      const templateData = template.template_data as unknown as BoardTemplateData;
      const createdBoards: Array<{ id: string; name: string }> = [];

      for (const name of names) {
        const boardName = `${name}'s Training`;

        // Create board
        const { data: board, error: boardError } = await supabase
          .from('boards')
          .insert({
            name: boardName,
            description: template.description,
            board_type: 'general' as const,
            created_by: user.id,
            template_id: templateId,
          })
          .select()
          .single();

        if (boardError) {
          console.error(`Failed to create board for ${name}:`, boardError);
          continue;
        }

        // Add owner
        await supabase.from('board_members').insert({
          board_id: board.id,
          user_id: user.id,
          role: 'owner' as const,
        });

        // Create columns
        const columnMap: Record<string, string> = {};
        for (let i = 0; i < templateData.columns.length; i++) {
          const col = templateData.columns[i];
          const columnType = col.type as 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'custom';
          const { data: column } = await supabase
            .from('board_columns')
            .insert({
              board_id: board.id,
              title: col.title,
              column_type: columnType,
              is_done_column: col.isDoneColumn,
              position: i,
            })
            .select()
            .single();

          if (column) columnMap[col.title] = column.id;
        }

        // Create cards
        const cardPositions: Record<string, number> = {};
        for (const card of templateData.cards) {
          const columnId = columnMap[card.columnTitle];
          if (!columnId) continue;

          const position = cardPositions[columnId] || 0;
          cardPositions[columnId] = position + 1;

          const cardPriority = card.priority as 'low' | 'medium' | 'high' | 'urgent';
          const { data: newCard } = await supabase
            .from('board_cards')
            .insert({
              board_id: board.id,
              column_id: columnId,
              headline: card.headline,
              description: card.description,
              priority: cardPriority,
              position,
              created_by: user.id,
            })
            .select()
            .single();

          if (newCard && card.subtasks?.length) {
            for (let i = 0; i < card.subtasks.length; i++) {
              await supabase.from('board_card_subtasks').insert({
                card_id: newCard.id,
                text: card.subtasks[i],
                position: i,
              });
            }
          }
        }

        createdBoards.push({ id: board.id, name: boardName });
      }

      return createdBoards;
    },
    onSuccess: (boards) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success(`Created ${boards.length} training boards!`);
    },
    onError: (error) => {
      console.error('Error bulk creating boards:', error);
      toast.error('Failed to create boards');
    },
  });
}
