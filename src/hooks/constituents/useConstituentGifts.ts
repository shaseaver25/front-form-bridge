import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Gift = any;

export function useConstituentGifts(constituentId: string | null) {
  return useQuery({
    queryKey: ['constituent-gifts', constituentId],
    queryFn: async () => {
      if (!constituentId) return [];
      
      const { data, error } = await supabase
        .from('gifts')
        .select('*')
        .eq('constituent_id', constituentId)
        .order('date_received', { ascending: false });

      if (error) {
        toast.error('Failed to load gifts');
        throw error;
      }
      return data as Gift[];
    },
    enabled: !!constituentId,
  });
}

export function useDeleteGift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ giftId, constituentId }: { giftId: string; constituentId: string }) => {
      const { error } = await supabase.from('gifts').delete().eq('id', giftId);
      if (error) throw error;
      return { giftId, constituentId };
    },
    onSuccess: (_, variables) => {
      toast.success('Gift deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['constituent-gifts', variables.constituentId] });
    },
    onError: () => {
      toast.error('Failed to delete gift');
    },
  });
}
