// Burndown / Financial Runway Calculator Types

export const INCOME_CATEGORY_TYPES = ['program_fees', 'grants', 'individual_gifts', 'corporate_gifts', 'events', 'other'] as const;
export const EXPENSE_CATEGORY_TYPES = ['payroll', 'benefits', 'rent', 'utilities', 'program_costs', 'professional_services', 'supplies', 'other'] as const;
export const RECURRENCE_INTERVALS = ['monthly', 'quarterly', 'annually'] as const;
export const INCOME_STATUSES = ['projected', 'confirmed', 'received'] as const;
export const EXPENSE_STATUSES = ['projected', 'approved', 'paid'] as const;

export type IncomeCategoryType = (typeof INCOME_CATEGORY_TYPES)[number];
export type ExpenseCategoryType = (typeof EXPENSE_CATEGORY_TYPES)[number];
export type RecurrenceInterval = (typeof RECURRENCE_INTERVALS)[number];
export type IncomeStatus = (typeof INCOME_STATUSES)[number];
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export interface BurndownIncomeCategory { id: string; organization_id: string; name: string; category_type: IncomeCategoryType; is_recurring: boolean; recurrence_interval: RecurrenceInterval | null; created_at: string; }
export interface BurndownExpenseCategory { id: string; organization_id: string; name: string; category_type: ExpenseCategoryType; is_fixed: boolean; created_at: string; }

export interface BurndownIncomeEntry {
  id: string; organization_id: string; category_id: string | null; donation_id: string | null; opportunity_id: string | null;
  amount: number; description: string | null; source_name: string | null; expected_date: string; actual_date: string | null;
  status: IncomeStatus; probability_percent: number; is_recurring: boolean; recurrence_end_date: string | null;
  is_synced: boolean; notes: string | null; created_at: string; updated_at: string; category?: BurndownIncomeCategory;
}

export interface BurndownExpenseEntry {
  id: string; organization_id: string; category_id: string | null; quickbooks_expense_id: string | null;
  amount: number; description: string | null; vendor_name: string | null; due_date: string; paid_date: string | null;
  status: ExpenseStatus; is_recurring: boolean; recurrence_end_date: string | null; is_synced: boolean;
  notes: string | null; created_at: string; updated_at: string; category?: BurndownExpenseCategory;
}

export interface BurndownCashSnapshot { id: string; organization_id: string; snapshot_date: string; actual_balance: number; monthly_burn_override: number | null; notes: string | null; created_at: string; }

export interface BurndownScenarioAdjustments { income_multiplier?: number; expense_multiplier?: number; excluded_income_categories?: string[]; excluded_expense_categories?: string[]; additional_income?: number; additional_expenses?: number; [key: string]: unknown; }
export interface BurndownScenario { id: string; organization_id: string; name: string; description: string | null; is_baseline: boolean; adjustments: BurndownScenarioAdjustments; created_at: string; }

export interface BurndownDataPoint { date: string; projectedBalance: number; confirmedBalance: number; income: number; expenses: number; runwayMonths: number; }
export interface BurndownSummary { currentBalance: number; projectedRunoutDate: string | null; monthsOfRunway: number; averageMonthlyBurn: number; averageMonthlyIncome: number; netMonthlyChange: number; }

export interface CreateIncomeCategoryInput { organization_id: string; name: string; category_type: IncomeCategoryType; is_recurring?: boolean; recurrence_interval?: RecurrenceInterval | null; }
export interface CreateExpenseCategoryInput { organization_id: string; name: string; category_type: ExpenseCategoryType; is_fixed?: boolean; }
export interface CreateIncomeEntryInput { organization_id: string; category_id?: string | null; donation_id?: string | null; opportunity_id?: string | null; amount: number; description?: string | null; source_name?: string | null; expected_date: string; actual_date?: string | null; status?: IncomeStatus; probability_percent?: number; is_recurring?: boolean; recurrence_end_date?: string | null; is_synced?: boolean; notes?: string | null; }
export interface CreateExpenseEntryInput { organization_id: string; category_id?: string | null; quickbooks_expense_id?: string | null; amount: number; description?: string | null; vendor_name?: string | null; due_date: string; paid_date?: string | null; status?: ExpenseStatus; is_recurring?: boolean; recurrence_end_date?: string | null; is_synced?: boolean; notes?: string | null; }
export interface CreateCashSnapshotInput { organization_id: string; snapshot_date: string; actual_balance: number; monthly_burn_override?: number | null; notes?: string | null; }
export interface CreateScenarioInput { organization_id: string; name: string; description?: string | null; is_baseline?: boolean; adjustments?: BurndownScenarioAdjustments; }

export const INCOME_CATEGORY_LABELS: Record<IncomeCategoryType, string> = { program_fees: 'Program Fees', grants: 'Grants', individual_gifts: 'Individual Gifts', corporate_gifts: 'Corporate Gifts', events: 'Events', other: 'Other' };
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategoryType, string> = { payroll: 'Payroll', benefits: 'Benefits', rent: 'Rent', utilities: 'Utilities', program_costs: 'Program Costs', professional_services: 'Professional Services', supplies: 'Supplies', other: 'Other' };
export const RECURRENCE_INTERVAL_LABELS: Record<RecurrenceInterval, string> = { monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually' };
export const INCOME_STATUS_LABELS: Record<IncomeStatus, string> = { projected: 'Projected', confirmed: 'Confirmed', received: 'Received' };
export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = { projected: 'Projected', approved: 'Approved', paid: 'Paid' };