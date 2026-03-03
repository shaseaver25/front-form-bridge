import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventTicketType {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity_available: number | null;
  quantity_sold: number;
  early_bird_price: number | null;
  early_bird_ends_at: string | null;
  sales_start_at: string | null;
  sales_end_at: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  ticket_type_id: string | null;
  constituent_id: string | null;
  registrant_name: string | null;
  registrant_email: string;
  registrant_phone: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  payment_status: string;
  paid_at: string | null;
  status: string;
  checked_in_at: string | null;
  confirmation_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  ticket_type?: EventTicketType;
}

export interface Event {
  id: string;
  name: string;
  description: string | null;
  event_type: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  virtual_url: string | null;
  is_virtual: boolean;
  capacity: number | null;
  status: string;
  hero_image_url: string | null;
  organizer_id: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch all events
export function useEvents(status?: string) {
  return useQuery({
    queryKey: ["events", status],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });
      
      if (status) {
        query = query.eq("status", status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Event[];
    },
  });
}

// Fetch single event with ticket types
export function useEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();
      
      if (error) throw error;
      return data as Event;
    },
    enabled: !!eventId,
  });
}

// Fetch ticket types for an event
export function useEventTicketTypes(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event-ticket-types", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from("event_ticket_types")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as EventTicketType[];
    },
    enabled: !!eventId,
  });
}

// Fetch registrations for an event
export function useEventRegistrations(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event-registrations", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          *,
          ticket_type:event_ticket_types(*)
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as EventRegistration[];
    },
    enabled: !!eventId,
  });
}

// Create event
export function useCreateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (event: Omit<Event, "id" | "created_at" | "updated_at"> & { id?: string }) => {
      const { data, error } = await supabase
        .from("events")
        .insert(event)
        .select()
        .single();
      
      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

// Update event
export function useUpdateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Event>) => {
      const { data, error } = await supabase
        .from("events")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", id] });
    },
  });
}

// Create ticket type
export function useCreateTicketType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticketType: Omit<EventTicketType, "id" | "created_at" | "quantity_sold"> & { id?: string }) => {
      const { data, error } = await supabase
        .from("event_ticket_types")
        .insert(ticketType)
        .select()
        .single();
      
      if (error) throw error;
      return data as EventTicketType;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-ticket-types", variables.event_id] });
    },
  });
}

// Update ticket type
export function useUpdateTicketType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<EventTicketType>) => {
      const { data, error } = await supabase
        .from("event_ticket_types")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event-ticket-types", data.event_id] });
    },
  });
}

// Delete ticket type
export function useDeleteTicketType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase
        .from("event_ticket_types")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return { id, eventId };
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["event-ticket-types", eventId] });
    },
  });
}

// Create event checkout session
export function useCreateEventCheckout() {
  return useMutation({
    mutationFn: async (params: {
      eventId: string;
      ticketTypeId: string;
      quantity: number;
      registrantName: string;
      registrantEmail: string;
      registrantPhone?: string;
      successUrl?: string;
      cancelUrl?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("create-event-checkout", {
        body: params,
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
  });
}

// Update registration status (for check-in, cancellation, etc.)
export function useUpdateRegistration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<EventRegistration>) => {
      const { data, error } = await supabase
        .from("event_registrations")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event-registrations", data.event_id] });
    },
  });
}
