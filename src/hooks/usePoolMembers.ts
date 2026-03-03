import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PoolMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  pool_type: 'speaker' | 'teacher' | 'both';
  application_status: string;
  overall_rating: number | null;
  total_engagements: number | null;
  headshot_file_path: string | null;
}

export function usePoolMembers() {
  return useQuery({
    queryKey: ["pool-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pool_applications")
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          pool_type,
          application_status,
          overall_rating,
          total_engagements,
          headshot_file_path
        `)
        .in("application_status", ["approved", "active"])
        .order("last_name", { ascending: true });

      if (error) throw error;
      return data as PoolMember[];
    },
  });
}

export function usePoolMember(id: string) {
  return useQuery({
    queryKey: ["pool-member", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pool_applications")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
