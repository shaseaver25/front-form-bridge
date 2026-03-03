import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SaasOrganizationTemplate } from "./useSaasTemplates";
import { useLogAdminAction } from "./useLogAdminAction";

type UpdateTemplateData = Partial<Omit<SaasOrganizationTemplate, "id" | "created_at">>;

export function useUpdateSaasTemplate() {
  const queryClient = useQueryClient();
  const logAction = useLogAdminAction();

  return useMutation({
    mutationFn: async ({ id, data, templateName }: { id: string; data: UpdateTemplateData; templateName?: string }) => {
      const { error } = await supabase
        .from("saas_organization_templates")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      // Log the action
      await logAction.mutateAsync({
        action: "update_template",
        details: {
          template_id: id,
          template_name: templateName,
          changes: data,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saas-templates"] });
      toast({
        title: "Template updated",
        description: "Template settings have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update template",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
