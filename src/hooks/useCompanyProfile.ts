import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCompanyProfile(companyId: string | undefined) {
  const queryClient = useQueryClient();

  const companyQuery = useQuery({
    queryKey: ["admin-company", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data: company, error: companyError } = await supabase
        .from("crm_companies")
        .select("*")
        .eq("id", companyId!)
        .single();
      if (companyError) throw companyError;

      const { data: profile } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("company_id", companyId!)
        .maybeSingle();

      return { company, profile };
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { data: session } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("update-company-profile", {
        body: { company_id: companyId, updates },
        headers: {
          Authorization: `Bearer ${session.session?.access_token}`,
        },
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-company", companyId] });
    },
    onError: (err: Error) => {
      toast.error("Failed to save: " + err.message);
    },
  });

  return { ...companyQuery, updateProfile };
}

export function useCompanyStakeholders(companyId: string | undefined) {
  return useQuery({
    queryKey: ["company-stakeholders", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discovery_stakeholders")
        .select("*, crm_jobs:search_id(name)")
        .eq("company_id", companyId!)
        .order("interview_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSynthesisLog(companyId: string | undefined) {
  return useQuery({
    queryKey: ["synthesis-log", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_synthesis_log")
        .select("*")
        .eq("company_id", companyId!)
        .order("synthesized_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });
}
