import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { boardKeys } from './keys';

export function useCardDependencies(cardId: string) {
  return useQuery({
    queryKey: ['card-dependencies', cardId],
    queryFn: async () => {
      const [dependsOnResult, blockedByResult] = await Promise.all([
        supabase
          .from('board_card_dependencies')
          .select(`
            id,
            depends_on_card_id,
            depends_on_card:board_cards!board_card_dependencies_depends_on_card_id_fkey(
              id, headline, column_id, completed_at
            )
          `)
          .eq('card_id', cardId),
        supabase
          .from('board_card_dependencies')
          .select(`
            id,
            card_id,
            card:board_cards!board_card_dependencies_card_id_fkey(
              id, headline, column_id, completed_at
            )
          `)
          .eq('depends_on_card_id', cardId),
      ]);

      return {
        dependsOn: dependsOnResult.data || [],
        blockedBy: blockedByResult.data || [],
      };
    },
    enabled: !!cardId,
  });
}

export function useAddDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      cardId, 
      dependsOnCardId 
    }: { 
      cardId: string; 
      dependsOnCardId: string;
    }) => {
      const { data, error } = await supabase
        .from('board_card_dependencies')
        .insert({
          card_id: cardId,
          depends_on_card_id: dependsOnCardId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['card-dependencies', variables.cardId] });
      queryClient.invalidateQueries({ queryKey: ['card-dependencies', variables.dependsOnCardId] });
      queryClient.invalidateQueries({ queryKey: boardKeys.all });
    },
  });
}

export function useRemoveDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      dependencyId, 
      cardId, 
      dependsOnCardId 
    }: { 
      dependencyId: string; 
      cardId: string; 
      dependsOnCardId: string;
    }) => {
      const { error } = await supabase
        .from('board_card_dependencies')
        .delete()
        .eq('id', dependencyId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['card-dependencies', variables.cardId] });
      queryClient.invalidateQueries({ queryKey: ['card-dependencies', variables.dependsOnCardId] });
      queryClient.invalidateQueries({ queryKey: boardKeys.all });
    },
  });
}
