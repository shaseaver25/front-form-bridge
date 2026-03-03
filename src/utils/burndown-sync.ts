import { supabase } from "@/integrations/supabase/client";
import type { IncomeCategoryType, ExpenseCategoryType, ExpenseStatus } from "@/types/burndown";

// ============== Types ==============

interface SyncResult {
  synced: number;
  skipped: number;
  errors: string[];
}

interface FullSyncResult {
  donationsSynced: number;
  grantsSynced: number;
  expensesSynced: number;
  errors: string[];
}

// ============== Category Helpers ==============

async function findOrCreateIncomeCategory(
  orgId: string,
  categoryType: IncomeCategoryType,
  name: string
): Promise<string> {
  // Try to find existing category
  const { data: existing } = await supabase
    .from("burndown_income_categories")
    .select("id")
    .eq("organization_id", orgId)
    .eq("category_type", categoryType)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  // Create new category
  const { data: created, error } = await supabase
    .from("burndown_income_categories")
    .insert({
      organization_id: orgId,
      name,
      category_type: categoryType,
      is_recurring: false,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create income category: ${error.message}`);
  return created.id;
}

async function findOrCreateExpenseCategory(
  orgId: string,
  categoryType: ExpenseCategoryType,
  name: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("burndown_expense_categories")
    .select("id")
    .eq("organization_id", orgId)
    .eq("category_type", categoryType)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("burndown_expense_categories")
    .insert({
      organization_id: orgId,
      name,
      category_type: categoryType,
      is_fixed: true,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to create expense category: ${error.message}`);
  return created.id;
}

// ============== Donation Sync ==============

/**
 * Sync received donations from CRM to burndown income entries
 */
export async function syncDonationsToIncome(orgId: string): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, skipped: 0, errors: [] };

  try {
    // Get already synced donation IDs
    const { data: existingSynced } = await supabase
      .from("burndown_income_entries")
      .select("donation_id")
      .eq("organization_id", orgId)
      .not("donation_id", "is", null);

    const syncedIds = new Set((existingSynced || []).map(e => e.donation_id));

    // Fetch donations (non-pledges only, or if pledges with payments received)
    const { data: donations, error: donationsError } = await supabase
      .from("gifts")
      .select(`
        id,
        amount,
        date_received,
        fund_designation,
        campaign_source,
        is_pledge,
        constituent:constituents(full_legal_name)
      `)
      .eq("is_pledge", false)
      .order("date_received", { ascending: false })
      .limit(500);

    if (donationsError) {
      result.errors.push(`Failed to fetch donations: ${donationsError.message}`);
      return result;
    }

    if (!donations || donations.length === 0) {
      return result;
    }

    // Get or create individual_gifts category
    const categoryId = await findOrCreateIncomeCategory(
      orgId,
      "individual_gifts",
      "Individual Donations"
    );

    // Sync each donation
    for (const donation of donations) {
      if (syncedIds.has(donation.id)) {
        result.skipped++;
        continue;
      }

      try {
        const donorName = (donation.constituent as any)?.full_legal_name || "Anonymous Donor";

        const { error: insertError } = await supabase
          .from("burndown_income_entries")
          .insert({
            organization_id: orgId,
            category_id: categoryId,
            donation_id: donation.id,
            amount: donation.amount,
            description: `Donation - ${donation.fund_designation || "General"}`,
            source_name: donorName,
            expected_date: donation.date_received,
            actual_date: donation.date_received,
            status: "received",
            probability_percent: 100,
            is_recurring: false,
            is_synced: true,
            notes: donation.campaign_source ? `Campaign: ${donation.campaign_source}` : null,
          });

        if (insertError) {
          result.errors.push(`Donation ${donation.id}: ${insertError.message}`);
        } else {
          result.synced++;
        }
      } catch (err) {
        result.errors.push(`Donation ${donation.id}: ${String(err)}`);
      }
    }
  } catch (err) {
    result.errors.push(`Donation sync error: ${String(err)}`);
  }

  return result;
}

// ============== Grant Sync ==============

/**
 * Map grant status to income probability percentage
 */
function getGrantProbability(status: string): number {
  const probabilityMap: Record<string, number> = {
    prospecting: 10,
    research: 10,
    letter_of_inquiry: 15,
    invited_to_apply: 25,
    application_in_progress: 25,
    submitted: 30,
    under_review: 50,
    awarded: 95,
    reporting: 95,
    declined: 0,
    withdrawn: 0,
  };
  return probabilityMap[status] ?? 15;
}

/**
 * Map grant status to income status
 */
function getGrantIncomeStatus(status: string): "projected" | "confirmed" | "received" {
  if (status === "awarded" || status === "reporting") {
    return "confirmed";
  }
  return "projected";
}

/**
 * Sync active grants from CRM to burndown income entries
 */
export async function syncGrantsToIncome(orgId: string): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, skipped: 0, errors: [] };

  try {
    // Get already synced grant IDs
    const { data: existingSynced } = await supabase
      .from("burndown_income_entries")
      .select("opportunity_id")
      .eq("organization_id", orgId)
      .not("opportunity_id", "is", null);

    const syncedIds = new Set((existingSynced || []).map(e => e.opportunity_id));

    // Fetch active grants (exclude declined and withdrawn)
    const { data: grants, error: grantsError } = await supabase
      .from("grant_opportunities")
      .select(`
        id,
        title,
        status_stage,
        requested_amount,
        awarded_amount,
        decision_date,
        expected_decision_date,
        grant_period_start,
        submission_deadline,
        funder_profile:organizations(name)
      `)
      .not("status_stage", "in", "(declined,withdrawn)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (grantsError) {
      result.errors.push(`Failed to fetch grants: ${grantsError.message}`);
      return result;
    }

    if (!grants || grants.length === 0) {
      return result;
    }

    // Get or create grants category
    const categoryId = await findOrCreateIncomeCategory(
      orgId,
      "grants",
      "Grant Income"
    );

    // Sync each grant
    for (const grant of grants) {
      if (syncedIds.has(grant.id)) {
        result.skipped++;
        continue;
      }

      try {
        const status = grant.status_stage as string;
        const probability = getGrantProbability(status);
        
        // Skip if 0% probability (declined/withdrawn)
        if (probability === 0) {
          result.skipped++;
          continue;
        }

        const incomeStatus = getGrantIncomeStatus(status);
        const amount = status === "awarded" || status === "reporting"
          ? (grant.awarded_amount || grant.requested_amount || 0)
          : (grant.requested_amount || 0);

        // Determine expected date - for awarded grants, use decision_date or grant_period_start
        // For pending grants, use expected_decision_date or submission_deadline
        let expectedDate: string;
        if (status === "awarded" || status === "reporting") {
          expectedDate = grant.decision_date
            || grant.grant_period_start 
            || grant.expected_decision_date
            || new Date().toISOString().split("T")[0];
        } else {
          expectedDate = grant.expected_decision_date 
            || grant.submission_deadline
            || grant.grant_period_start
            || new Date().toISOString().split("T")[0];
        }

        const funderName = (grant.funder_profile as { name?: string } | null)?.name || "Unknown Funder";

        const { error: insertError } = await supabase
          .from("burndown_income_entries")
          .insert({
            organization_id: orgId,
            category_id: categoryId,
            opportunity_id: grant.id,
            amount,
            description: grant.title,
            source_name: funderName,
            expected_date: expectedDate,
            actual_date: incomeStatus === "received" ? expectedDate : null,
            status: incomeStatus,
            probability_percent: probability,
            is_recurring: false,
            is_synced: true,
            notes: `Status: ${status}`,
          });

        if (insertError) {
          result.errors.push(`Grant ${grant.id}: ${insertError.message}`);
        } else {
          result.synced++;
        }
      } catch (err) {
        result.errors.push(`Grant ${grant.id}: ${String(err)}`);
      }
    }
  } catch (err) {
    result.errors.push(`Grant sync error: ${String(err)}`);
  }

  return result;
}

// ============== QuickBooks Sync ==============

/**
 * Map QuickBooks account type to expense category
 */
function mapQBAccountToCategory(accountType: string): ExpenseCategoryType {
  const typeMap: Record<string, ExpenseCategoryType> = {
    payroll: "payroll",
    "payroll expense": "payroll",
    "payroll expenses": "payroll",
    salary: "payroll",
    wages: "payroll",
    benefits: "benefits",
    insurance: "benefits",
    "health insurance": "benefits",
    rent: "rent",
    "rent or lease": "rent",
    utilities: "utilities",
    utility: "utilities",
    electric: "utilities",
    gas: "utilities",
    water: "utilities",
    professional: "professional_services",
    "professional fees": "professional_services",
    legal: "professional_services",
    accounting: "professional_services",
    consulting: "professional_services",
    supplies: "supplies",
    "office supplies": "supplies",
    program: "program_costs",
    "program expense": "program_costs",
    "program costs": "program_costs",
  };

  const normalized = accountType.toLowerCase();
  return typeMap[normalized] || "other";
}

/**
 * Sync QuickBooks expenses to burndown expense entries
 */
export async function syncQuickBooksExpenses(orgId: string): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, skipped: 0, errors: [] };

  try {
    // Check if QuickBooks is connected
    const { data: qbConnection } = await supabase
      .from("quickbooks_connections")
      .select("id, is_active, user_id")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!qbConnection) {
      result.errors.push("QuickBooks is not connected");
      return result;
    }

    // Get already synced QB expense IDs
    const { data: existingSynced } = await supabase
      .from("burndown_expense_entries")
      .select("quickbooks_expense_id")
      .eq("organization_id", orgId)
      .not("quickbooks_expense_id", "is", null);

    const syncedIds = new Set((existingSynced || []).map(e => e.quickbooks_expense_id));

    // Call the QuickBooks API edge function to fetch expenses
    const { data: expenseData, error: expenseError } = await supabase.functions.invoke(
      "quickbooks-api",
      {
        body: { action: "getExpenses" },
      }
    );

    if (expenseError) {
      result.errors.push(`Failed to fetch QB expenses: ${expenseError.message}`);
      return result;
    }

    if (!expenseData?.expenses || expenseData.expenses.length === 0) {
      return result; // No expenses to sync
    }

    console.warn(`Found ${expenseData.expenses.length} QB expenses to process`);

    // Process each expense
    for (const expense of expenseData.expenses) {
      const qbExpenseId = `${expense.type}_${expense.id}`;
      
      if (syncedIds.has(qbExpenseId)) {
        result.skipped++;
        continue;
      }

      try {
        // Map QB account type to expense category
        const categoryType = mapQBAccountToCategory(expense.accountType || "other");
        const categoryId = await findOrCreateExpenseCategory(
          orgId,
          categoryType,
          expense.accountName || categoryType
        );

        // Determine status based on whether it's paid
        const status: ExpenseStatus = expense.isPaid ? "paid" : "approved";

        const { error: insertError } = await supabase
          .from("burndown_expense_entries")
          .insert({
            organization_id: orgId,
            category_id: categoryId,
            quickbooks_expense_id: qbExpenseId,
            amount: expense.amount,
            description: expense.memo || `${expense.type} from QuickBooks`,
            vendor_name: expense.vendorName,
            due_date: expense.dueDate,
            paid_date: expense.isPaid ? expense.date : null,
            status,
            is_recurring: false,
            is_synced: true,
            notes: `QB ${expense.type} ID: ${expense.id}`,
          });

        if (insertError) {
          result.errors.push(`Expense ${qbExpenseId}: ${insertError.message}`);
        } else {
          result.synced++;
        }
      } catch (err) {
        result.errors.push(`Expense ${qbExpenseId}: ${String(err)}`);
      }
    }
  } catch (err) {
    result.errors.push(`QuickBooks sync error: ${String(err)}`);
  }

  return result;
}

// ============== Full Sync ==============

/**
 * Run full sync from all CRM sources
 */
export async function runFullSync(orgId: string): Promise<FullSyncResult> {
  const donationResult = await syncDonationsToIncome(orgId);
  const grantResult = await syncGrantsToIncome(orgId);
  const expenseResult = await syncQuickBooksExpenses(orgId);

  const allErrors = [
    ...donationResult.errors,
    ...grantResult.errors,
    ...expenseResult.errors,
  ];

  return {
    donationsSynced: donationResult.synced,
    grantsSynced: grantResult.synced,
    expensesSynced: expenseResult.synced,
    errors: allErrors,
  };
}

// ============== Utility: Get Sync Status ==============

export interface SyncStatus {
  donationsCount: number;
  grantsCount: number;
  expensesCount: number;
  lastSyncedAt: string | null;
}

export async function getSyncStatus(orgId: string): Promise<SyncStatus> {
  const [donations, grants, expenses] = await Promise.all([
    supabase
      .from("burndown_income_entries")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_synced", true)
      .not("donation_id", "is", null),
    supabase
      .from("burndown_income_entries")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_synced", true)
      .not("opportunity_id", "is", null),
    supabase
      .from("burndown_expense_entries")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("is_synced", true)
      .not("quickbooks_expense_id", "is", null),
  ]);

  // Get last synced entry
  const { data: lastEntry } = await supabase
    .from("burndown_income_entries")
    .select("updated_at")
    .eq("organization_id", orgId)
    .eq("is_synced", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    donationsCount: donations.count || 0,
    grantsCount: grants.count || 0,
    expensesCount: expenses.count || 0,
    lastSyncedAt: lastEntry?.updated_at || null,
  };
}
