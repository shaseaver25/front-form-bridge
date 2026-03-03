import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export function useLogAdminAction() {
  return useMutation({
    mutationFn: async ({
      action,
      organizationId,
      details,
    }: {
      action: string;
      organizationId?: string;
      details?: Record<string, unknown>;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("saas_admin_audit_log")
        .insert([{
          action,
          admin_user_id: user?.id ?? undefined,
          organization_id: organizationId ?? undefined,
          details: details as Json ?? undefined,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}
