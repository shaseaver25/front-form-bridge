import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type RecommendationLevel = "highly_recommend" | "recommend" | "neutral" | "do_not_recommend";

export interface PoolReference {
  id: string;
  created_at: string;
  application_id: string;
  reference_name: string;
  reference_email: string | null;
  reference_phone: string | null;
  relationship: string | null;
  organization: string | null;
  contacted: boolean;
  contacted_date: string | null;
  contacted_by: string | null;
  feedback: string | null;
  recommendation_level: RecommendationLevel | null;
}

export type PoolReferenceInsert = Omit<PoolReference, "id" | "created_at">;

export function usePoolReferences(applicationId?: string) {
  return useQuery({
    queryKey: ["pool-references", applicationId],
    queryFn: async () => {
      let query = supabase
        .from("pool_references")
        .select("*")
        .order("created_at", { ascending: false });

      if (applicationId) {
        query = query.eq("application_id", applicationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PoolReference[];
    },
  });
}

export function useCreatePoolReference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference: PoolReferenceInsert) => {
      const { data, error } = await supabase
        .from("pool_references")
        .insert(reference)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pool-references"] });
      queryClient.invalidateQueries({ queryKey: ["pool-references", data.application_id] });
      toast.success("Reference added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add reference: ${error.message}`);
    },
  });
}

export function useUpdatePoolReference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PoolReference> & { id: string }) => {
      const { data, error } = await supabase
        .from("pool_references")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pool-references"] });
      queryClient.invalidateQueries({ queryKey: ["pool-references", data.application_id] });
      toast.success("Reference updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update reference: ${error.message}`);
    },
  });
}

export function useDeletePoolReference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pool_references")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pool-references"] });
      toast.success("Reference deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete reference: ${error.message}`);
    },
  });
}
