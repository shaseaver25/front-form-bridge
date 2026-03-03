import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, subMonths, format } from "date-fns";

export interface PaymentTransaction {
  id: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_charge_id: string | null;
  payment_type: string;
  reference_id: string | null;
  amount: number;
  currency: string;
  stripe_fee: number | null;
  net_amount: number | null;
  status: string;
  failure_reason: string | null;
  constituent_id: string | null;
  payer_email: string | null;
  payer_name: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  // Joined data
  event_registration?: {
    id: string;
    event?: { id: string; name: string } | null;
  } | null;
  program_enrollment?: {
    id: string;
    program_offering?: { 
      id: string; 
      name: string;
      program?: { id: string; name: string } | null;
    } | null;
  } | null;
}

export interface PaymentFilters {
  startDate?: string;
  endDate?: string;
  paymentType?: string;
  status?: string;
  search?: string;
}

export function usePaymentStats(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ["payment-stats", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const now = new Date();
      const monthStart = startDate || startOfMonth(now);
      const monthEnd = endDate || now;

      const { data, error } = await supabase
        .from("payment_transactions")
        .select("amount, status")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      if (error) throw error;

      const stats = {
        revenue: 0,
        transactionCount: 0,
        pendingCount: 0,
        failedCount: 0,
      };

      data?.forEach((tx) => {
        if (tx.status === "succeeded") {
          stats.revenue += Number(tx.amount) || 0;
          stats.transactionCount++;
        } else if (tx.status === "pending") {
          stats.pendingCount++;
        } else if (tx.status === "failed") {
          stats.failedCount++;
        }
      });

      return stats;
    },
  });
}

export function usePaymentTransactions(filters: PaymentFilters = {}) {
  return useQuery({
    queryKey: ["payment-transactions", filters],
    queryFn: async () => {
      let query = supabase
        .from("payment_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate);
      }
      if (filters.paymentType && filters.paymentType !== "all") {
        query = query.eq("payment_type", filters.paymentType);
      }
      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters.search) {
        query = query.ilike("payer_email", `%${filters.search}%`);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data as PaymentTransaction[];
    },
  });
}

export function useRevenueByMonth(months: number = 6) {
  return useQuery({
    queryKey: ["revenue-by-month", months],
    queryFn: async () => {
      const now = new Date();
      const startDate = subMonths(startOfMonth(now), months - 1);

      const { data, error } = await supabase
        .from("payment_transactions")
        .select("amount, payment_type, status, created_at")
        .gte("created_at", startDate.toISOString())
        .eq("status", "succeeded");

      if (error) throw error;

      // Group by month
      const monthlyData: Record<string, { month: string; events: number; programs: number; donations: number; total: number }> = {};

      // Initialize all months
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const key = format(monthDate, "yyyy-MM");
        monthlyData[key] = {
          month: format(monthDate, "MMM yyyy"),
          events: 0,
          programs: 0,
          donations: 0,
          total: 0,
        };
      }

      data?.forEach((tx) => {
        const key = format(new Date(tx.created_at), "yyyy-MM");
        if (monthlyData[key]) {
          const amount = Number(tx.amount) || 0;
          monthlyData[key].total += amount;
          
          if (tx.payment_type === "event_registration") {
            monthlyData[key].events += amount;
          } else if (tx.payment_type === "program_enrollment") {
            monthlyData[key].programs += amount;
          } else if (tx.payment_type === "donation") {
            monthlyData[key].donations += amount;
          }
        }
      });

      return Object.values(monthlyData);
    },
  });
}
