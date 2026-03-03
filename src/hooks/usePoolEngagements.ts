import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type EngagementType = "speaking" | "teaching" | "workshop" | "training" | "panel";
export type CompensationType = "paid" | "volunteer" | "stipend";
export type PaymentStatus = "pending" | "invoiced" | "paid" | "n/a";
export type EngagementStatus = "scheduled" | "confirmed" | "completed" | "cancelled";

export interface PoolEngagement {
  id: string;
  created_at: string;
  pool_member_id: string;
  engagement_type: EngagementType | null;
  event_name: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  is_virtual: boolean;
  expected_audience_size: number | null;
  actual_audience_size: number | null;
  audience_type: string | null;
  compensation_type: CompensationType | null;
  compensation_amount: number | null;
  payment_status: PaymentStatus | null;
  organizer_rating: number | null;
  organizer_feedback: string | null;
  participant_rating_avg: number | null;
  status: EngagementStatus;
  notes: string | null;
}

export type PoolEngagementInsert = Omit<PoolEngagement, "id" | "created_at">;

export function usePoolEngagements(memberId?: string) {
  return useQuery({
    queryKey: ["pool-engagements", memberId],
    queryFn: async () => {
      let query = supabase
        .from("pool_engagements")
        .select("*")
        .order("event_date", { ascending: false });

      if (memberId) {
        query = query.eq("pool_member_id", memberId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PoolEngagement[];
    },
  });
}

export function usePoolEngagement(id: string) {
  return useQuery({
    queryKey: ["pool-engagement", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pool_engagements")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as PoolEngagement;
    },
    enabled: !!id,
  });
}

export function useCreatePoolEngagement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (engagement: PoolEngagementInsert) => {
      const { data, error } = await supabase
        .from("pool_engagements")
        .insert(engagement)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pool-engagements"] });
      queryClient.invalidateQueries({ queryKey: ["pool-engagements", data.pool_member_id] });
      toast.success("Engagement created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create engagement: ${error.message}`);
    },
  });
}

export function useUpdatePoolEngagement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PoolEngagement> & { id: string }) => {
      const { data, error } = await supabase
        .from("pool_engagements")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pool-engagements"] });
      queryClient.invalidateQueries({ queryKey: ["pool-engagement", data.id] });
      toast.success("Engagement updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update engagement: ${error.message}`);
    },
  });
}

export function useDeletePoolEngagement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pool_engagements")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pool-engagements"] });
      toast.success("Engagement deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete engagement: ${error.message}`);
    },
  });
}
