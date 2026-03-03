import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreHorizontal, Calendar, MapPin, Users, DollarSign } from "lucide-react";
import { useEvents, Event } from "@/hooks/useEventRegistrations";
import { CreateEventDialog } from "@/components/events/CreateEventDialog";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EventWithStats extends Event {
  registration_count: number;
  revenue: number;
}

function useEventsWithStats(statusFilter?: string) {
  return useQuery({
    queryKey: ["events-with-stats", statusFilter],
    queryFn: async () => {
      // Fetch events
      let query = supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: false });
      
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      const { data: events, error: eventsError } = await query;
      if (eventsError) throw eventsError;
      
      // Fetch registration stats for all events
      const eventIds = events?.map(e => e.id) || [];
      
      if (eventIds.length === 0) {
        return [] as EventWithStats[];
      }
      
      const { data: registrations, error: regError } = await supabase
        .from("event_registrations")
        .select("event_id, total_amount, payment_status")
        .in("event_id", eventIds);
      
      if (regError) throw regError;
      
      // Calculate stats per event
      const statsMap = new Map<string, { count: number; revenue: number }>();
      
      registrations?.forEach(reg => {
        const current = statsMap.get(reg.event_id) || { count: 0, revenue: 0 };
        current.count += 1;
        if (reg.payment_status === "paid") {
          current.revenue += Number(reg.total_amount) || 0;
        }
        statsMap.set(reg.event_id, current);
      });
      
      return (events || []).map(event => ({
        ...event,
        registration_count: statsMap.get(event.id)?.count || 0,
        revenue: statsMap.get(event.id)?.revenue || 0,
      })) as EventWithStats[];
    },
  });
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export default function EventsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const { data: events = [], isLoading } = useEventsWithStats(statusFilter);
  
  // Filter by search term
  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground">Manage events and registrations</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Events Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/20">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No events yet</h3>
            <p className="text-muted-foreground mb-4">Create your first event to get started</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Registrations</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow 
                    key={event.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/events/${event.id}`)}
                  >
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>
                      {event.start_date ? format(new Date(event.start_date), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {event.is_virtual ? (
                          <span className="text-muted-foreground">Virtual</span>
                        ) : (
                          <>
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span>{event.location || event.city || "—"}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[event.status] || statusColors.draft}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span>{event.registration_count}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        <span>{formatCurrency(event.revenue)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${event.id}`);
                          }}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${event.id}?tab=registrations`);
                          }}>
                            View Registrations
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => e.stopPropagation()}
                            className="text-destructive"
                          >
                            Cancel Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CreateEventDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </Layout>
  );
}
