import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventStats {
  totalRegistrations: number;
  confirmedRegistrations: number;
  revenue: number;
  checkedIn: number;
}

export function useEventStats(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event-stats", eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const { data: registrations, error } = await supabase
        .from("event_registrations")
        .select("status, payment_status, total_amount, checked_in_at")
        .eq("event_id", eventId);

      if (error) throw error;

      const stats: EventStats = {
        totalRegistrations: registrations?.length || 0,
        confirmedRegistrations: registrations?.filter(r => r.status === "confirmed").length || 0,
        revenue: registrations
          ?.filter(r => r.payment_status === "paid")
          .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0) || 0,
        checkedIn: registrations?.filter(r => r.checked_in_at).length || 0,
      };

      return stats;
    },
    enabled: !!eventId,
  });
}
