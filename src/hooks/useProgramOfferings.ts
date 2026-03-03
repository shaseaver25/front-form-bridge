import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProgramOffering {
  id: string;
  program_id: string;
  name: string;
  description: string | null;
  price: number;
  capacity: number | null;
  enrolled_count: number;
  start_date: string | null;
  end_date: string | null;
  registration_deadline: string | null;
  location: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ProgramEnrollment {
  id: string;
  program_offering_id: string;
  constituent_id: string | null;
  enrollee_name: string | null;
  enrollee_email: string;
  enrollee_phone: string | null;
  amount: number;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  payment_status: string;
  paid_at: string | null;
  status: string;
  enrollment_date: string | null;
  confirmation_number: string | null;
  created_at: string;
  program_offering?: ProgramOffering;
}

export function useProgramOfferings(programId: string | null) {
  return useQuery({
    queryKey: ["program-offerings", programId],
    queryFn: async () => {
      if (!programId) return [];
      const { data, error } = await supabase
        .from("program_offerings")
        .select("*")
        .eq("program_id", programId)
        .order("start_date", { ascending: true });
      
      if (error) throw error;
      return data as ProgramOffering[];
    },
    enabled: !!programId,
  });
}

export function useCreateProgramOffering() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (offering: Omit<ProgramOffering, "id" | "enrolled_count" | "created_at">) => {
      const { data, error } = await supabase
        .from("program_offerings")
        .insert(offering)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["program-offerings", variables.program_id] });
      toast.success("Offering created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create offering: ${error.message}`);
    },
  });
}

export function useUpdateProgramOffering() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProgramOffering> & { id: string }) => {
      const { data, error } = await supabase
        .from("program_offerings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["program-offerings", data.program_id] });
      toast.success("Offering updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update offering: ${error.message}`);
    },
  });
}

export function useDeleteProgramOffering() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, programId }: { id: string; programId: string }) => {
      const { error } = await supabase
        .from("program_offerings")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return { id, programId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["program-offerings", variables.programId] });
      toast.success("Offering deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete offering: ${error.message}`);
    },
  });
}

export function useProgramEnrollments(offeringId: string | null) {
  return useQuery({
    queryKey: ["program-enrollments", offeringId],
    queryFn: async () => {
      if (!offeringId) return [];
      const { data, error } = await supabase
        .from("program_enrollments")
        .select(`
          *,
          program_offering:program_offerings(*)
        `)
        .eq("program_offering_id", offeringId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as ProgramEnrollment[];
    },
    enabled: !!offeringId,
  });
}

export function useUpdateProgramEnrollment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProgramEnrollment> & { id: string }) => {
      const { data, error } = await supabase
        .from("program_enrollments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["program-enrollments", data.program_offering_id] });
      toast.success("Enrollment updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update enrollment: ${error.message}`);
    },
  });
}
