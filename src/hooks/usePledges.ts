import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
type FundDesignation = string;

export const PLEDGE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  active: 'Active',
  partially_paid: 'Partially Paid',
  paid_in_full: 'Paid in Full',
  written_off: 'Written Off',
  cancelled: 'Cancelled',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  partial: 'Partial',
  overdue: 'Overdue',
  skipped: 'Skipped',
};

export const FREQUENCY_LABELS: Record<string, string> = {
  one_time: 'One Time',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
  custom: 'Custom Schedule',
};

export const usePledges = (filters?: {
  status?: string[];
  constituentId?: string;
  overdue?: boolean;
}) => {
  return useQuery({
    queryKey: ['pledges', filters],
    queryFn: async () => {
      let query = supabase
        .from('gifts')
        .select(`
          *,
          constituent:constituents!gifts_constituent_id_fkey(id, full_legal_name, primary_email)
        `)
        .eq('is_pledge', true)
        .order('pledge_start_date', { ascending: false });
      
      if (filters?.status && filters.status.length > 0) {
        query = query.in('pledge_status', filters.status);
      }
      
      if (filters?.constituentId) {
        query = query.eq('constituent_id', filters.constituentId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data;
    }
  });
};

export const usePledgePayments = (pledgeId: string) => {
  return useQuery({
    queryKey: ['pledge-payments', pledgeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pledge_payments')
        .select('*')
        .eq('pledge_id', pledgeId)
        .order('payment_number', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!pledgeId,
  });
};

export const useCreatePledge = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (pledgeData: {
      constituent_id: string;
      pledge_total_amount: number;
      pledge_frequency: string;
      pledge_start_date: string;
      pledge_payment_count: number;
      fund_designation?: string;
      notes?: string;
    }) => {
      // Calculate end date and payment amount
      const paymentAmount = pledgeData.pledge_total_amount / pledgeData.pledge_payment_count;
      const endDate = new Date(pledgeData.pledge_start_date);
      
      // Calculate end date based on frequency
      switch (pledgeData.pledge_frequency) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + (pledgeData.pledge_payment_count - 1));
          break;
        case 'quarterly':
          endDate.setMonth(endDate.getMonth() + (pledgeData.pledge_payment_count - 1) * 3);
          break;
        case 'annually':
          endDate.setFullYear(endDate.getFullYear() + (pledgeData.pledge_payment_count - 1));
          break;
      }

      // 1. Create pledge gift record
      const { data: pledge, error: pledgeError } = await supabase
        .from('gifts')
        .insert([{
          constituent_id: pledgeData.constituent_id,
          amount: pledgeData.pledge_total_amount,
          date_received: pledgeData.pledge_start_date,
          is_pledge: true,
          pledge_status: 'active',
          pledge_total_amount: pledgeData.pledge_total_amount,
          pledge_balance: pledgeData.pledge_total_amount,
          pledge_frequency: pledgeData.pledge_frequency,
          pledge_start_date: pledgeData.pledge_start_date,
          pledge_end_date: endDate.toISOString().split('T')[0],
          pledge_payment_count: pledgeData.pledge_payment_count,
          pledge_next_payment_date: pledgeData.pledge_start_date,
          fund_designation: (pledgeData.fund_designation || 'general_fund') as FundDesignation,
          notes: pledgeData.notes
        }])
        .select()
        .single();
      
      if (pledgeError) throw pledgeError;
      
      // 2. Generate payment schedule
      const payments = [];
      const currentDate = new Date(pledgeData.pledge_start_date);
      
      for (let i = 1; i <= pledgeData.pledge_payment_count; i++) {
        payments.push({
          pledge_id: pledge.id,
          payment_number: i,
          expected_date: currentDate.toISOString().split('T')[0],
          expected_amount: paymentAmount,
          status: 'pending'
        });
        
        // Increment date based on frequency
        switch (pledgeData.pledge_frequency) {
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'quarterly':
            currentDate.setMonth(currentDate.getMonth() + 3);
            break;
          case 'annually':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
        }
      }
      
      const { error: paymentsError } = await supabase
        .from('pledge_payments')
        .insert(payments);
      
      if (paymentsError) throw paymentsError;
      
      return pledge;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pledges'] });
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      queryClient.invalidateQueries({ queryKey: ['constituents', variables.constituent_id] });
      toast.success(`Pledge created: $${variables.pledge_total_amount.toLocaleString()} over ${variables.pledge_payment_count} payments`);
    },
    onError: (error: Error) => {
      toast.error('Failed to create pledge: ' + error.message);
    }
  });
};

export const useRecordPledgePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      pledgePaymentId,
      pledgeId,
      constituentId,
      actualDate,
      actualAmount,
      expectedAmount,
      paymentNumber,
      totalPayments,
      fundDesignation,
      notes
    }: {
      pledgePaymentId: string;
      pledgeId: string;
      constituentId: string;
      actualDate: string;
      actualAmount: number;
      expectedAmount: number;
      paymentNumber: number;
      totalPayments: number;
      fundDesignation?: string;
      notes?: string;
    }) => {
      // 1. Create actual gift record
      const { data: gift, error: giftError } = await supabase
        .from('gifts')
        .insert([{
          constituent_id: constituentId,
          amount: actualAmount,
          date_received: actualDate,
          fund_designation: (fundDesignation || 'general_fund') as FundDesignation,
          notes: notes || `Payment ${paymentNumber} of ${totalPayments} for pledge`
        }])
        .select()
        .single();
      
      if (giftError) throw giftError;
      
      // 2. Update pledge payment record
      const { error: updateError } = await supabase
        .from('pledge_payments')
        .update({
          actual_date: actualDate,
          actual_amount: actualAmount,
          payment_gift_id: gift.id,
          status: actualAmount >= expectedAmount ? 'paid' : 'partial',
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', pledgePaymentId);
      
      if (updateError) throw updateError;
      
      return { pledgePaymentId, gift, paymentNumber };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pledge-payments'] });
      queryClient.invalidateQueries({ queryKey: ['pledges'] });
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      toast.success(`Payment #${data.paymentNumber} recorded: $${data.gift.amount.toLocaleString()}`);
    },
    onError: (error: Error) => {
      toast.error('Failed to record payment: ' + error.message);
    }
  });
};

export const useUpdatePledgePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      paymentId,
      status,
      notes
    }: {
      paymentId: string;
      status: string;
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('pledge_payments')
        .update({
          status,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);
      
      if (error) throw error;
      return { paymentId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pledge-payments'] });
      queryClient.invalidateQueries({ queryKey: ['pledges'] });
      toast.success('Payment updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update payment: ' + error.message);
    }
  });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};
