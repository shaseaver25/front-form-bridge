import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  BurndownIncomeCategory,
  BurndownExpenseCategory,
  BurndownIncomeEntry,
  BurndownExpenseEntry,
  BurndownCashSnapshot,
  BurndownScenario,
  CreateIncomeEntryInput,
  CreateExpenseEntryInput,
  CreateCashSnapshotInput,
} from "@/types/burndown";

// ============== Query Keys ==============

const QUERY_KEYS = {
  incomeCategories: (orgId: string) => ["burndown", "income-categories", orgId],
  expenseCategories: (orgId: string) => ["burndown", "expense-categories", orgId],
  incomeEntries: (orgId: string) => ["burndown", "income-entries", orgId],
  expenseEntries: (orgId: string) => ["burndown", "expense-entries", orgId],
  cashSnapshots: (orgId: string) => ["burndown", "cash-snapshots", orgId],
  latestSnapshot: (orgId: string) => ["burndown", "latest-snapshot", orgId],
  scenarios: (orgId: string) => ["burndown", "scenarios", orgId],
};

// ============== Income Categories ==============

export function useBurndownIncomeCategories(orgId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.incomeCategories(orgId || ""),
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await supabase
        .from("burndown_income_categories")
        .select("*")
        .eq("organization_id", orgId)
        .order("name");

      if (error) throw error;
      return data as BurndownIncomeCategory[];
    },
    enabled: !!orgId,
  });
}

// ============== Expense Categories ==============

export function useBurndownExpenseCategories(orgId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.expenseCategories(orgId || ""),
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await supabase
        .from("burndown_expense_categories")
        .select("*")
        .eq("organization_id", orgId)
        .order("name");

      if (error) throw error;
      return data as BurndownExpenseCategory[];
    },
    enabled: !!orgId,
  });
}

// ============== Income Entries ==============

export function useBurndownIncomeEntries(orgId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.incomeEntries(orgId || ""),
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await supabase
        .from("burndown_income_entries")
        .select(`
          *,
          category:burndown_income_categories(*)
        `)
        .eq("organization_id", orgId)
        .order("expected_date", { ascending: true });

      if (error) throw error;
      return data as (BurndownIncomeEntry & { category: BurndownIncomeCategory | null })[];
    },
    enabled: !!orgId,
  });
}

export function useCreateBurndownIncomeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateIncomeEntryInput) => {
      const { data, error } = await supabase
        .from("burndown_income_entries")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.incomeEntries(data.organization_id) 
      });
      toast.success("Income entry created");
    },
    onError: (error) => {
      console.error("Error creating income entry:", error);
      toast.error("Failed to create income entry");
    },
  });
}

export function useUpdateBurndownIncomeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BurndownIncomeEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from("burndown_income_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.incomeEntries(data.organization_id) 
      });
      toast.success("Income entry updated");
    },
    onError: (error) => {
      console.error("Error updating income entry:", error);
      toast.error("Failed to update income entry");
    },
  });
}

export function useDeleteBurndownIncomeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, orgId }: { id: string; orgId: string }) => {
      const { error } = await supabase
        .from("burndown_income_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, orgId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.incomeEntries(data.orgId) 
      });
      toast.success("Income entry deleted");
    },
    onError: (error) => {
      console.error("Error deleting income entry:", error);
      toast.error("Failed to delete income entry");
    },
  });
}

// ============== Expense Entries ==============

export function useBurndownExpenseEntries(orgId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.expenseEntries(orgId || ""),
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await supabase
        .from("burndown_expense_entries")
        .select(`
          *,
          category:burndown_expense_categories(*)
        `)
        .eq("organization_id", orgId)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data as (BurndownExpenseEntry & { category: BurndownExpenseCategory | null })[];
    },
    enabled: !!orgId,
  });
}

export function useCreateBurndownExpenseEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateExpenseEntryInput) => {
      const { data, error } = await supabase
        .from("burndown_expense_entries")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.expenseEntries(data.organization_id) 
      });
      toast.success("Expense entry created");
    },
    onError: (error) => {
      console.error("Error creating expense entry:", error);
      toast.error("Failed to create expense entry");
    },
  });
}

export function useUpdateBurndownExpenseEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BurndownExpenseEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from("burndown_expense_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.expenseEntries(data.organization_id) 
      });
      toast.success("Expense entry updated");
    },
    onError: (error) => {
      console.error("Error updating expense entry:", error);
      toast.error("Failed to update expense entry");
    },
  });
}

export function useDeleteBurndownExpenseEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, orgId }: { id: string; orgId: string }) => {
      const { error } = await supabase
        .from("burndown_expense_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, orgId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.expenseEntries(data.orgId) 
      });
      toast.success("Expense entry deleted");
    },
    onError: (error) => {
      console.error("Error deleting expense entry:", error);
      toast.error("Failed to delete expense entry");
    },
  });
}

// ============== Cash Snapshots ==============

export function useCashSnapshots(orgId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.cashSnapshots(orgId || ""),
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await supabase
        .from("burndown_cash_snapshots")
        .select("*")
        .eq("organization_id", orgId)
        .order("snapshot_date", { ascending: false });

      if (error) throw error;
      return data as BurndownCashSnapshot[];
    },
    enabled: !!orgId,
  });
}

export function useLatestCashSnapshot(orgId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.latestSnapshot(orgId || ""),
    queryFn: async () => {
      if (!orgId) return null;
      
      const { data, error } = await supabase
        .from("burndown_cash_snapshots")
        .select("*")
        .eq("organization_id", orgId)
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as BurndownCashSnapshot | null;
    },
    enabled: !!orgId,
  });
}

export function useCreateCashSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCashSnapshotInput) => {
      const { data, error } = await supabase
        .from("burndown_cash_snapshots")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.cashSnapshots(data.organization_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.latestSnapshot(data.organization_id) 
      });
      toast.success("Cash snapshot recorded");
    },
    onError: (error) => {
      console.error("Error creating cash snapshot:", error);
      toast.error("Failed to record cash snapshot");
    },
  });
}

export function useUpdateCashSnapshot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BurndownCashSnapshot> & { id: string }) => {
      const { data, error } = await supabase
        .from("burndown_cash_snapshots")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.cashSnapshots(data.organization_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.latestSnapshot(data.organization_id) 
      });
      toast.success("Cash snapshot updated");
    },
    onError: (error) => {
      console.error("Error updating cash snapshot:", error);
      toast.error("Failed to update cash snapshot");
    },
  });
}

// ============== Scenarios ==============

export function useBurndownScenarios(orgId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.scenarios(orgId || ""),
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await supabase
        .from("burndown_scenarios")
        .select("*")
        .eq("organization_id", orgId)
        .order("is_baseline", { ascending: false })
        .order("name");

      if (error) throw error;
      return data as BurndownScenario[];
    },
    enabled: !!orgId,
  });
}

// ============== Combined Hook for Dashboard ==============

export function useBurndownDashboardData(orgId: string | null) {
  const incomeCategories = useBurndownIncomeCategories(orgId);
  const expenseCategories = useBurndownExpenseCategories(orgId);
  const incomeEntries = useBurndownIncomeEntries(orgId);
  const expenseEntries = useBurndownExpenseEntries(orgId);
  const latestSnapshot = useLatestCashSnapshot(orgId);
  const scenarios = useBurndownScenarios(orgId);

  const isLoading = 
    incomeCategories.isLoading ||
    expenseCategories.isLoading ||
    incomeEntries.isLoading ||
    expenseEntries.isLoading ||
    latestSnapshot.isLoading ||
    scenarios.isLoading;

  const isError = 
    incomeCategories.isError ||
    expenseCategories.isError ||
    incomeEntries.isError ||
    expenseEntries.isError ||
    latestSnapshot.isError ||
    scenarios.isError;

  return {
    incomeCategories: incomeCategories.data ?? [],
    expenseCategories: expenseCategories.data ?? [],
    incomeEntries: incomeEntries.data ?? [],
    expenseEntries: expenseEntries.data ?? [],
    latestSnapshot: latestSnapshot.data,
    scenarios: scenarios.data ?? [],
    isLoading,
    isError,
  };
}
