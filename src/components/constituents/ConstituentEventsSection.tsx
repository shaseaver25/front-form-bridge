import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Package, Ticket, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface ConstituentEventsSectionProps {
  constituentId?: string;
  constituentEmail?: string;
}

interface EventRegistration {
  id: string;
  status: string;
  payment_status: string;
  quantity: number;
  total_amount: number;
  created_at: string;
  events: {
    id: string;
    name: string;
    start_date: string | null;
  } | null;
  event_ticket_types: {
    name: string;
  } | null;
}

interface ProgramEnrollment {
  id: string;
  status: string;
  payment_status: string;
  amount: number;
  enrollment_date: string | null;
  program_offerings: {
    id: string;
    name: string;
    start_date: string | null;
    programs: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export function ConstituentEventsSection({ constituentId, constituentEmail }: ConstituentEventsSectionProps) {
  // Fetch event registrations
  const { data: eventRegistrations = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["constituent-event-registrations", constituentId, constituentEmail],
    queryFn: async () => {
      let query = supabase
        .from("event_registrations")
        .select(`
          id,
          status,
          payment_status,
          quantity,
          total_amount,
          created_at,
          events (id, name, start_date),
          event_ticket_types (name)
        `)
        .order("created_at", { ascending: false });

      if (constituentId) {
        query = query.eq("constituent_id", constituentId);
      } else if (constituentEmail) {
        query = query.eq("registrant_email", constituentEmail);
      } else {
        return [];
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as EventRegistration[];
    },
    enabled: !!(constituentId || constituentEmail),
  });

  // Fetch program enrollments
  const { data: programEnrollments = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ["constituent-program-enrollments", constituentId, constituentEmail],
    queryFn: async () => {
      let query = supabase
        .from("program_enrollments")
        .select(`
          id,
          status,
          payment_status,
          amount,
          enrollment_date,
          program_offerings (
            id,
            name,
            start_date,
            programs (id, name)
          )
        `)
        .order("created_at", { ascending: false });

      if (constituentId) {
        query = query.eq("constituent_id", constituentId);
      } else if (constituentEmail) {
        query = query.eq("enrollee_email", constituentEmail);
      } else {
        return [];
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as ProgramEnrollment[];
    },
    enabled: !!(constituentId || constituentEmail),
  });

  const isLoading = loadingEvents || loadingPrograms;
  const hasData = eventRegistrations.length > 0 || programEnrollments.length > 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
      case "enrolled":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{status}</Badge>;
      case "checked_in":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Checked In</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{status}</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Events & Programs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!hasData) {
    return null; // Don't show the section if there's no data
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="w-5 h-5" />
          Events & Programs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event Registrations */}
        {eventRegistrations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Ticket className="w-4 h-4" />
              Event Registrations
            </h4>
            <div className="space-y-2">
              {eventRegistrations.slice(0, 5).map((reg) => (
                <Link
                  key={reg.id}
                  to={reg.events ? `/events/${reg.events.id}?tab=registrations` : "#"}
                  className="block p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {reg.events?.name || "Unknown Event"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {reg.events?.start_date && (
                          <span>{format(new Date(reg.events.start_date), "MMM d, yyyy")}</span>
                        )}
                        {reg.event_ticket_types?.name && (
                          <>
                            <span>•</span>
                            <span>{reg.event_ticket_types.name}</span>
                          </>
                        )}
                        {reg.quantity > 1 && (
                          <>
                            <span>•</span>
                            <span>{reg.quantity} tickets</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(reg.status)}
                      <span className="text-xs font-medium">{formatCurrency(reg.total_amount)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Program Enrollments */}
        {programEnrollments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Package className="w-4 h-4" />
              Program Enrollments
            </h4>
            <div className="space-y-2">
              {programEnrollments.slice(0, 5).map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {enrollment.program_offerings?.programs?.name || "Unknown Program"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {enrollment.program_offerings?.name && (
                          <span>{enrollment.program_offerings.name}</span>
                        )}
                        {enrollment.program_offerings?.start_date && (
                          <>
                            <span>•</span>
                            <span>Starts {format(new Date(enrollment.program_offerings.start_date), "MMM d, yyyy")}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(enrollment.status)}
                      <span className="text-xs font-medium">{formatCurrency(enrollment.amount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
