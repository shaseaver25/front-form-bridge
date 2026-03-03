import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SoftCredit {
  id: string;
  gift_id: string;
  constituent_id: string;
  credit_type: string;
  amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  constituent?: {
    id: string;
    full_legal_name: string;
    primary_email: string | null;
  };
  gift?: {
    id: string;
    amount: number;
    date_received: string;
    fund_designation: string;
  };
}

export const CREDIT_TYPE_LABELS: Record<string, string> = {
  household_member: 'Household Member',
  matching_gift: 'Matching Gift',
  tribute_honor: 'In Honor Of',
  tribute_memory: 'In Memory Of',
  solicitor: 'Solicitor',
  other: 'Other',
};

export const CREDIT_TYPE_DESCRIPTIONS: Record<string, string> = {
  household_member: 'Credit to spouse/partner for joint gift',
  matching_gift: 'Credit to employer/foundation that matched this gift',
  tribute_honor: 'Gift made in honor of this person',
  tribute_memory: 'Gift made in memory of this person',
  solicitor: 'Person who solicited/influenced this gift',
  other: 'Other relationship to this gift',
};

export const CREDIT_TYPE_COLORS: Record<string, string> = {
  household_member: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  matching_gift: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  tribute_honor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  tribute_memory: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  solicitor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  other: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
};

export const useGiftSoftCredits = (giftId: string) => {
  return useQuery({
    queryKey: ['soft-credits', 'gift', giftId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gift_soft_credits')
        .select(`
          *,
          constituent:constituents(id, full_legal_name, primary_email)
        `)
        .eq('gift_id', giftId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SoftCredit[];
    },
    enabled: !!giftId,
  });
};

export const useConstituentSoftCredits = (constituentId: string) => {
  return useQuery({
    queryKey: ['soft-credits', 'constituent', constituentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gift_soft_credits')
        .select(`
          *,
          gift:gifts(
            id,
            amount,
            date_received,
            fund_designation
          )
        `)
        .eq('constituent_id', constituentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by credit type for summary
      const byType = (data || []).reduce((acc, credit) => {
        const type = credit.credit_type;
        if (!acc[type]) {
          acc[type] = { count: 0, total: 0 };
        }
        acc[type].count++;
        acc[type].total += Number(credit.amount);
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      return { credits: data as SoftCredit[], byType };
    },
    enabled: !!constituentId,
  });
};

export const useAddSoftCredit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (softCredit: {
      gift_id: string;
      constituent_id: string;
      credit_type: string;
      amount: number;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('gift_soft_credits')
        .insert({
          ...softCredit,
          created_by: user?.id,
        })
        .select(`
          *,
          constituent:constituents(full_legal_name)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['soft-credits', 'gift', data.gift_id] });
      queryClient.invalidateQueries({ queryKey: ['soft-credits', 'constituent', data.constituent_id] });
      queryClient.invalidateQueries({ queryKey: ['constituents', data.constituent_id] });
      toast.success(`Soft credit added to ${data.constituent?.full_legal_name}`);
    },
    onError: (error: Error) => {
      toast.error('Failed to add soft credit: ' + error.message);
    },
  });
};

export const useDeleteSoftCredit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      softCreditId,
      giftId,
      constituentId,
    }: {
      softCreditId: string;
      giftId: string;
      constituentId: string;
    }) => {
      const { error } = await supabase
        .from('gift_soft_credits')
        .delete()
        .eq('id', softCreditId);

      if (error) throw error;
      return { giftId, constituentId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['soft-credits'] });
      queryClient.invalidateQueries({ queryKey: ['constituents', variables.constituentId] });
      toast.success('Soft credit removed');
    },
    onError: () => {
      toast.error('Failed to delete soft credit');
    },
  });
};
