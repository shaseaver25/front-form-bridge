import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BurndownScenario, CreateScenarioInput, BurndownScenarioAdjustments } from '@/types/burndown';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

const SCENARIO_QUERY_KEY = 'burndown-scenarios';

export function useBurndownScenarios(orgId: string | null) {
  return useQuery({
    queryKey: [SCENARIO_QUERY_KEY, orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('burndown_scenarios')
        .select('*')
        .eq('organization_id', orgId)
        .order('is_baseline', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as BurndownScenario[];
    },
    enabled: !!orgId,
  });
}

export function useCreateScenario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateScenarioInput) => {
      const { data, error } = await supabase
        .from('burndown_scenarios')
        .insert({
          organization_id: input.organization_id,
          name: input.name,
          description: input.description || null,
          is_baseline: input.is_baseline || false,
          adjustments: (input.adjustments || {}) as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BurndownScenario;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [SCENARIO_QUERY_KEY, data.organization_id] });
      toast({ title: 'Scenario created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create scenario', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateScenario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BurndownScenario> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.adjustments !== undefined) updateData.adjustments = updates.adjustments as Json;
      
      const { data, error } = await supabase
        .from('burndown_scenarios')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BurndownScenario;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [SCENARIO_QUERY_KEY, data.organization_id] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update scenario', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteScenario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, orgId }: { id: string; orgId: string }) => {
      const { error } = await supabase.from('burndown_scenarios').delete().eq('id', id);
      if (error) throw error;
      return { id, orgId };
    },
    onSuccess: ({ orgId }) => {
      queryClient.invalidateQueries({ queryKey: [SCENARIO_QUERY_KEY, orgId] });
      toast({ title: 'Scenario deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete scenario', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDuplicateScenario() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (scenario: BurndownScenario) => {
      const { data, error } = await supabase
        .from('burndown_scenarios')
        .insert({
          organization_id: scenario.organization_id,
          name: `${scenario.name} (Copy)`,
          description: scenario.description,
          is_baseline: false,
          adjustments: (scenario.adjustments || {}) as Json,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BurndownScenario;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [SCENARIO_QUERY_KEY, data.organization_id] });
      toast({ title: 'Scenario duplicated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to duplicate scenario', description: error.message, variant: 'destructive' });
    },
  });
}

// Helper to calculate scenario-adjusted data
export interface ScenarioEvent {
  description: string;
  amount: number;
  date: string;
}

export interface ExtendedScenarioAdjustments extends BurndownScenarioAdjustments {
  incomeMultiplier?: number;
  expenseMultiplier?: number;
  monthlyNetChange?: number;
  additionalIncomeEvents?: ScenarioEvent[];
  additionalExpenseEvents?: ScenarioEvent[];
  projectHistoricalIncome?: boolean; // Shift past income dates forward into future
}

export function applyScenarioAdjustments(
  baseIncome: number,
  baseExpenses: number,
  adjustments: ExtendedScenarioAdjustments
): { adjustedIncome: number; adjustedExpenses: number } {
  const incomeMultiplier = adjustments.incomeMultiplier ?? adjustments.income_multiplier ?? 1;
  const expenseMultiplier = adjustments.expenseMultiplier ?? adjustments.expense_multiplier ?? 1;
  const additionalIncome = adjustments.additional_income ?? 0;
  const additionalExpenses = adjustments.additional_expenses ?? 0;

  return {
    adjustedIncome: baseIncome * incomeMultiplier + additionalIncome,
    adjustedExpenses: baseExpenses * expenseMultiplier + additionalExpenses,
  };
}
