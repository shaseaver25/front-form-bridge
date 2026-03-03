import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type PoolType = "speaker" | "teacher" | "intern";
export type ApplicationStatus = "pending" | "under_review" | "approved" | "declined" | "inactive";
export type ContactMethod = "email" | "phone" | "text";
export type SpeakerExperienceLevel = "beginner" | "intermediate" | "experienced" | "professional";

export interface PoolApplication {
  id: string;
  created_at: string;
  updated_at: string;
  pool_type: PoolType;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  preferred_contact_method: ContactMethod | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  availability_notes: string | null;
  available_days: string[] | null;
  preferred_time_slots: string[] | null;
  current_employer: string | null;
  current_title: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  years_of_experience: number | null;
  teaching_certifications: string | null;
  grade_levels_comfortable: string[] | null;
  subjects_qualified: string[] | null;
  classroom_management_experience: string | null;
  curriculum_development_experience: boolean;
  background_check_consent: boolean;
  speaker_topics: string[] | null;
  speaker_experience_level: SpeakerExperienceLevel | null;
  previous_speaking_engagements: string | null;
  audience_sizes_comfortable: string[] | null;
  presentation_style: string[] | null;
  equipment_needs: string | null;
  speaker_fee_expectations: string | null;
  willing_to_volunteer: boolean;
  bio: string | null;
  why_interested: string | null;
  relevant_experience: string | null;
  application_status: ApplicationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  overall_rating: number | null;
  total_engagements: number;
  last_engagement_date: string | null;
  resume_file_path: string | null;
  references_file_path: string | null;
  headshot_file_path: string | null;
  organization_id: string | null;
}

export type PoolApplicationInsert = Omit<PoolApplication, "id" | "created_at" | "updated_at">;

export function usePoolApplications(poolType?: PoolType, status?: ApplicationStatus) {
  return useQuery({
    queryKey: ["pool-applications", poolType, status],
    queryFn: async () => {
      let query = supabase
        .from("pool_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (poolType) {
        query = query.eq("pool_type", poolType);
      }
      if (status) {
        query = query.eq("application_status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PoolApplication[];
    },
  });
}

export function usePoolApplication(id: string) {
  return useQuery({
    queryKey: ["pool-application", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pool_applications")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as PoolApplication;
    },
    enabled: !!id,
  });
}

export function useCreatePoolApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (application: PoolApplicationInsert) => {
      const { data, error } = await supabase
        .from("pool_applications")
        .insert(application)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pool-applications"] });
      toast.success("Application created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create application: ${error.message}`);
    },
  });
}

export function useUpdatePoolApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PoolApplication> & { id: string }) => {
      const { data, error } = await supabase
        .from("pool_applications")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pool-applications"] });
      queryClient.invalidateQueries({ queryKey: ["pool-application", data.id] });
      toast.success("Application updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update application: ${error.message}`);
    },
  });
}

export function useDeletePoolApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pool_applications")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pool-applications"] });
      toast.success("Application deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete application: ${error.message}`);
    },
  });
}
