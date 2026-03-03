import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RevenueByItem {
  id: string;
  name: string;
  revenue: number;
  count: number;
}

// Revenue by event
export function useRevenueByEvent() {
  return useQuery({
    queryKey: ["revenue-by-event"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select(`
          amount,
          reference_id
        `)
        .eq("payment_type", "event_registration")
        .eq("status", "succeeded");

      if (error) throw error;

      // Group by event and sum
      const eventRevenueMap = new Map<string, { revenue: number; count: number }>();
      
      for (const tx of data || []) {
        if (!tx.reference_id) continue;
        const existing = eventRevenueMap.get(tx.reference_id) || { revenue: 0, count: 0 };
        eventRevenueMap.set(tx.reference_id, {
          revenue: existing.revenue + tx.amount,
          count: existing.count + 1,
        });
      }

      // Get event names
      const eventIds = Array.from(eventRevenueMap.keys());
      if (eventIds.length === 0) return [];

      // Fetch registrations to get event IDs
      const { data: registrations } = await supabase
        .from("event_registrations")
        .select("id, event_id")
        .in("id", eventIds);

      const regEventMap = new Map<string, string>();
      for (const reg of registrations || []) {
        regEventMap.set(reg.id, reg.event_id);
      }

      // Get unique event IDs
      const uniqueEventIds = [...new Set(Array.from(regEventMap.values()))];
      
      const { data: events } = await supabase
        .from("events")
        .select("id, name")
        .in("id", uniqueEventIds);

      const eventNameMap = new Map<string, string>();
      for (const event of events || []) {
        eventNameMap.set(event.id, event.name);
      }

      // Aggregate by actual event
      const finalMap = new Map<string, { name: string; revenue: number; count: number }>();
      
      for (const [regId, stats] of eventRevenueMap.entries()) {
        const eventId = regEventMap.get(regId);
        if (!eventId) continue;
        
        const eventName = eventNameMap.get(eventId) || "Unknown Event";
        const existing = finalMap.get(eventId) || { name: eventName, revenue: 0, count: 0 };
        finalMap.set(eventId, {
          name: eventName,
          revenue: existing.revenue + stats.revenue,
          count: existing.count + stats.count,
        });
      }

      return Array.from(finalMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue) as RevenueByItem[];
    },
  });
}

// Revenue by program
export function useRevenueByProgram() {
  return useQuery({
    queryKey: ["revenue-by-program"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select(`
          amount,
          reference_id
        `)
        .eq("payment_type", "program_enrollment")
        .eq("status", "succeeded");

      if (error) throw error;

      // Group by enrollment and sum
      const enrollmentRevenueMap = new Map<string, { revenue: number; count: number }>();
      
      for (const tx of data || []) {
        if (!tx.reference_id) continue;
        const existing = enrollmentRevenueMap.get(tx.reference_id) || { revenue: 0, count: 0 };
        enrollmentRevenueMap.set(tx.reference_id, {
          revenue: existing.revenue + tx.amount,
          count: existing.count + 1,
        });
      }

      // Get program info through enrollments -> offerings -> programs
      const enrollmentIds = Array.from(enrollmentRevenueMap.keys());
      if (enrollmentIds.length === 0) return [];

      const { data: enrollments } = await supabase
        .from("program_enrollments")
        .select(`
          id,
          program_offering_id,
          program_offerings (
            id,
            programs (id, name)
          )
        `)
        .in("id", enrollmentIds);

      // Aggregate by program
      const programMap = new Map<string, { name: string; revenue: number; count: number }>();
      
      for (const enrollment of enrollments || []) {
        const stats = enrollmentRevenueMap.get(enrollment.id);
        if (!stats || !enrollment.program_offerings?.programs) continue;
        
        const programId = enrollment.program_offerings.programs.id;
        const programName = enrollment.program_offerings.programs.name;
        
        const existing = programMap.get(programId) || { name: programName, revenue: 0, count: 0 };
        programMap.set(programId, {
          name: programName,
          revenue: existing.revenue + stats.revenue,
          count: existing.count + stats.count,
        });
      }

      return Array.from(programMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue) as RevenueByItem[];
    },
  });
}
