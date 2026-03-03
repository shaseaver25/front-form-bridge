import { format, addMonths, parseISO, startOfMonth, isAfter, isBefore, isEqual } from "date-fns";
import type { BurndownDataPoint, BurndownSummary, BurndownIncomeEntry, BurndownExpenseEntry, RecurrenceInterval } from "@/types/burndown";

export const PROJECTION_MONTHS = 24;

export function calculateWeightedIncome(entries: BurndownIncomeEntry[]): number {
  return entries.reduce((sum, entry) => {
    const weight = (entry.probability_percent ?? 100) / 100;
    return sum + (Number(entry.amount) * weight);
  }, 0);
}

interface ExpandableEntry { amount: number; expected_date?: string; due_date?: string; is_recurring: boolean; recurrence_end_date: string | null; probability_percent?: number; status?: string; }
interface ExpandedEntry { date: string; amount: number; probability_percent: number; }

function getRecurrenceMonths(interval: RecurrenceInterval | string | null): number {
  switch (interval) { case "monthly": return 1; case "quarterly": return 3; case "annually": return 12; default: return 1; }
}

export function expandRecurringEntries(entries: (BurndownIncomeEntry | BurndownExpenseEntry)[], endDate: Date, recurrenceInterval: RecurrenceInterval | string = "monthly"): ExpandedEntry[] {
  const expanded: ExpandedEntry[] = [];
  const intervalMonths = getRecurrenceMonths(recurrenceInterval);
  for (const entry of entries) {
    const dateField = "expected_date" in entry ? entry.expected_date : (entry as BurndownExpenseEntry).due_date;
    const entryDate = parseISO(dateField);
    const amount = Number(entry.amount);
    const probability = "probability_percent" in entry ? (entry.probability_percent ?? 100) : 100;
    if (!entry.is_recurring) {
      expanded.push({ date: format(entryDate, "yyyy-MM"), amount, probability_percent: probability });
    } else {
      let currentDate = entryDate;
      const recurrenceEnd = entry.recurrence_end_date ? parseISO(entry.recurrence_end_date) : endDate;
      const effectiveEnd = isBefore(recurrenceEnd, endDate) ? recurrenceEnd : endDate;
      while (isBefore(currentDate, effectiveEnd) || isEqual(currentDate, effectiveEnd)) {
        expanded.push({ date: format(currentDate, "yyyy-MM"), amount, probability_percent: probability });
        currentDate = addMonths(currentDate, intervalMonths);
      }
    }
  }
  return expanded;
}

export function groupEntriesByMonth(entries: ExpandedEntry[], weighted: boolean = false): Map<string, number> {
  const grouped = new Map<string, number>();
  for (const entry of entries) {
    const current = grouped.get(entry.date) || 0;
    const amount = weighted ? entry.amount * (entry.probability_percent / 100) : entry.amount;
    grouped.set(entry.date, current + amount);
  }
  return grouped;
}

export function calculateBurndownProjection(startingBalance: number, incomeEntries: BurndownIncomeEntry[], expenseEntries: BurndownExpenseEntry[], months: number = PROJECTION_MONTHS, monthlyBurnRate?: number): BurndownDataPoint[] {
  const today = new Date();
  const startMonth = startOfMonth(today);
  const endDate = addMonths(startMonth, months);
  const expandedIncome = expandRecurringEntries(incomeEntries.filter(e => e.status !== "received"), endDate, "monthly");
  const incomeByMonth = groupEntriesByMonth(expandedIncome, true);
  const confirmedIncome = expandRecurringEntries(incomeEntries.filter(e => e.status === "confirmed" || e.status === "received"), endDate, "monthly");
  const confirmedIncomeByMonth = groupEntriesByMonth(confirmedIncome, false);
  const avgMonthlyBurn = monthlyBurnRate ?? calculateAverageMonthlyBurnFromExpenses(expenseEntries);
  const dataPoints: BurndownDataPoint[] = [];
  let projectedBalance = startingBalance;
  let confirmedBalance = startingBalance;
  for (let i = 0; i < months; i++) {
    const monthDate = addMonths(startMonth, i);
    const monthKey = format(monthDate, "yyyy-MM");
    const monthIncome = incomeByMonth.get(monthKey) || 0;
    const monthConfirmedIncome = confirmedIncomeByMonth.get(monthKey) || 0;
    const monthExpenses = avgMonthlyBurn;
    if (i > 0) { projectedBalance += monthIncome - monthExpenses; confirmedBalance += monthConfirmedIncome - monthExpenses; }
    const runwayMonths = avgMonthlyBurn > 0 ? projectedBalance / avgMonthlyBurn : Infinity;
    dataPoints.push({
      date: monthKey,
      projectedBalance: Math.round(projectedBalance * 100) / 100,
      confirmedBalance: Math.round(confirmedBalance * 100) / 100,
      income: Math.round(i === 0 ? 0 : monthIncome * 100) / 100,
      expenses: Math.round(i === 0 ? 0 : monthExpenses * 100) / 100,
      runwayMonths: runwayMonths === Infinity ? 999 : Math.round(runwayMonths * 10) / 10,
    });
  }
  return dataPoints;
}

export function calculateAverageMonthlyBurnFromExpenses(expenseEntries: BurndownExpenseEntry[]): number {
  const paidExpenses = expenseEntries.filter(e => e.status === "paid" && e.paid_date);
  if (paidExpenses.length === 0) return 0;
  const expensesByMonth = new Map<string, number>();
  for (const expense of paidExpenses) {
    const monthKey = format(parseISO(expense.paid_date!), "yyyy-MM");
    const current = expensesByMonth.get(monthKey) || 0;
    expensesByMonth.set(monthKey, current + Number(expense.amount));
  }
  if (expensesByMonth.size === 0) return 0;
  const totalPaid = Array.from(expensesByMonth.values()).reduce((a, b) => a + b, 0);
  return totalPaid / expensesByMonth.size;
}

export function calculateBurndownSummary(dataPoints: BurndownDataPoint[], currentBalance: number, burnRateOverride?: number | null, paidExpenses?: BurndownExpenseEntry[]): BurndownSummary {
  const calculatedBurn = paidExpenses ? calculateAverageMonthlyBurnFromExpenses(paidExpenses) : dataPoints.length > 0 ? dataPoints.reduce((sum, dp) => sum + dp.expenses, 0) / dataPoints.length : 0;
  if (dataPoints.length === 0) {
    return { currentBalance, projectedRunoutDate: null, monthsOfRunway: 999, averageMonthlyBurn: burnRateOverride ?? calculatedBurn, averageMonthlyIncome: 0, netMonthlyChange: 0 };
  }
  const averageMonthlyBurn = burnRateOverride ?? calculatedBurn;
  const totalIncome = dataPoints.reduce((sum, dp) => sum + dp.income, 0);
  const averageMonthlyIncome = totalIncome / dataPoints.length;
  const netMonthlyChange = averageMonthlyIncome - averageMonthlyBurn;
  const runoutPoint = dataPoints.find(dp => dp.projectedBalance < 0);
  const projectedRunoutDate = runoutPoint ? runoutPoint.date : null;
  let monthsOfRunway: number;
  if (netMonthlyChange >= 0) { monthsOfRunway = 999; } else if (averageMonthlyBurn <= 0) { monthsOfRunway = 999; } else { monthsOfRunway = currentBalance / averageMonthlyBurn; }
  return {
    currentBalance: Math.round(currentBalance * 100) / 100, projectedRunoutDate, monthsOfRunway: Math.round(monthsOfRunway * 10) / 10,
    averageMonthlyBurn: Math.round(averageMonthlyBurn * 100) / 100, averageMonthlyIncome: Math.round(averageMonthlyIncome * 100) / 100, netMonthlyChange: Math.round(netMonthlyChange * 100) / 100,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function formatRunway(months: number | null): string {
  if (months === null || months >= 999) return "Sustainable";
  if (months <= 0) return "Depleted";
  if (months < 12) return `${months.toFixed(1)} months`;
  return `${(months / 12).toFixed(1)} years`;
}

export function getRunwayStatusColor(months: number | null): string {
  if (months === null || months >= 999) return "text-green-600";
  if (months <= 3) return "text-red-600";
  if (months <= 6) return "text-orange-500";
  if (months <= 12) return "text-yellow-600";
  return "text-green-600";
}