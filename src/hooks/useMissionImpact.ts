import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Tables = Record<string, any>;

export interface Program {
  id: string;
  name: string;
  description: string | null;
  program_area: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  target_population: string | null;
  geographic_area: string | null;
  annual_budget: number | null;
  funding_sources: string[] | null;
  created_at: string | null;
}

export interface OutcomeMetric {
  id: string;
  program_id: string | null;
  metric_name: string;
  metric_description: string | null;
  metric_type: string;
  target_value: number | null;
  target_date: string | null;
  measurement_frequency: string | null;
  is_key_metric: boolean | null;
  display_order: number | null;
}

export interface OutcomeMeasurement {
  id: string;
  metric_id: string;
  measurement_date: string;
  actual_value: number;
  notes: string | null;
  created_at: string | null;
}

export interface ProgramBeneficiary {
  id: string;
  program_id: string;
  period_start: string;
  period_end: string;
  total_served: number;
  unique_individuals: number | null;
  demographic_data: Record<string, unknown> | null;
  notes: string | null;
}

export interface ProgramGrant {
  id: string;
  program_id: string;
  grant_id: string;
  funding_amount: number | null;
  funding_percentage: number | null;
  reporting_requirements: string | null;
  outcome_metrics_required: string[] | null;
  grant?: {
    id: string;
    title: string;
    status_stage: string;
    awarded_amount: number | null;
  };
}

export function usePrograms() {
  return useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Program[];
    },
  });
}

export function useOutcomeMetrics(programId: string | null) {
  return useQuery({
    queryKey: ["outcome_metrics", programId],
    queryFn: async () => {
      if (!programId) return [];
      const { data, error } = await supabase
        .from("outcome_metrics")
        .select("*")
        .eq("program_id", programId)
        .order("display_order");
      if (error) throw error;
      return data as OutcomeMetric[];
    },
    enabled: !!programId,
  });
}

export function useOutcomeMeasurements(metricId: string | null) {
  return useQuery({
    queryKey: ["outcome_measurements", metricId],
    queryFn: async () => {
      if (!metricId) return [];
      const { data, error } = await supabase
        .from("outcome_measurements")
        .select("*")
        .eq("metric_id", metricId)
        .order("measurement_date", { ascending: false });
      if (error) throw error;
      return data as OutcomeMeasurement[];
    },
    enabled: !!metricId,
  });
}

export function useAllMeasurementsForProgram(programId: string | null) {
  return useQuery({
    queryKey: ["all_measurements", programId],
    queryFn: async () => {
      if (!programId) return [];
      const { data: metrics, error: metricsError } = await supabase
        .from("outcome_metrics")
        .select("id")
        .eq("program_id", programId);
      if (metricsError) throw metricsError;
      
      const metricIds = metrics.map(m => m.id);
      if (metricIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("outcome_measurements")
        .select("*")
        .in("metric_id", metricIds)
        .order("measurement_date", { ascending: false });
      if (error) throw error;
      return data as OutcomeMeasurement[];
    },
    enabled: !!programId,
  });
}

export function useProgramBeneficiaries(programId: string | null) {
  return useQuery({
    queryKey: ["program_beneficiaries", programId],
    queryFn: async () => {
      if (!programId) return [];
      const { data, error } = await supabase
        .from("program_beneficiaries")
        .select("*")
        .eq("program_id", programId)
        .order("period_start", { ascending: false });
      if (error) throw error;
      return data as ProgramBeneficiary[];
    },
    enabled: !!programId,
  });
}

export function useProgramGrants(programId: string | null) {
  return useQuery({
    queryKey: ["program_grants", programId],
    queryFn: async () => {
      if (!programId) return [];
      const { data, error } = await supabase
        .from("program_grants")
        .select(`
          *,
          grant:grant_opportunities(id, title, status_stage, awarded_amount)
        `)
        .eq("program_id", programId);
      if (error) throw error;
      return data as ProgramGrant[];
    },
    enabled: !!programId,
  });
}

export function useAvailableGrants() {
  return useQuery({
    queryKey: ["available_grants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grant_opportunities")
        .select("id, title, status_stage, awarded_amount")
        .order("title");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (program: Partial<Program>) => {
      const { data, error } = await supabase
        .from("programs")
        .insert([program as Tables['programs']['Insert']])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success("Program created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create program: " + error.message);
    },
  });
}

export function useCreateMetric() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (metric: Partial<OutcomeMetric>) => {
      const { data, error } = await supabase
        .from("outcome_metrics")
        .insert([metric as Tables['outcome_metrics']['Insert']])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["outcome_metrics", variables.program_id] });
      toast.success("Metric created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create metric: " + error.message);
    },
  });
}

export function useRecordMeasurement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (measurement: Partial<OutcomeMeasurement>) => {
      const { data, error } = await supabase
        .from("outcome_measurements")
        .insert([measurement as Tables['outcome_measurements']['Insert']])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["outcome_measurements", variables.metric_id] });
      queryClient.invalidateQueries({ queryKey: ["all_measurements"] });
      toast.success("Measurement recorded");
    },
    onError: (error) => {
      toast.error("Failed to record measurement: " + error.message);
    },
  });
}

export function useCreateBeneficiaryRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: Partial<ProgramBeneficiary>) => {
      const { data, error } = await supabase
        .from("program_beneficiaries")
        .insert([record as Tables['program_beneficiaries']['Insert']])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["program_beneficiaries", variables.program_id] });
      toast.success("Beneficiary record added");
    },
    onError: (error) => {
      toast.error("Failed to add record: " + error.message);
    },
  });
}

export function useLinkGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (link: Partial<ProgramGrant>) => {
      const { data, error } = await supabase
        .from("program_grants")
        .insert([link as Tables['program_grants']['Insert']])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["program_grants", variables.program_id] });
      toast.success("Grant linked to program");
    },
    onError: (error) => {
      toast.error("Failed to link grant: " + error.message);
    },
  });
}

export function useUnlinkGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, programId }: { id: string; programId: string }) => {
      const { error } = await supabase
        .from("program_grants")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return programId;
    },
    onSuccess: (programId) => {
      queryClient.invalidateQueries({ queryKey: ["program_grants", programId] });
      toast.success("Grant unlinked");
    },
    onError: (error) => {
      toast.error("Failed to unlink grant: " + error.message);
    },
  });
}
