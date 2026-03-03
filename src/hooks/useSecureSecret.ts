import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SecretInfo {
  has_secret: boolean;
  key_hint?: string;
  updated_at?: string;
}

interface SaveResult {
  success: boolean;
  key_hint?: string;
  error?: string;
}

export function useSecureSecret(integrationType: string) {
  const queryClient = useQueryClient();

  // Check if user has a secret for this integration
  const { data: secretInfo, isLoading } = useQuery({
    queryKey: ["secure-secret", integrationType],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_user_integration_secret", {
        p_integration_type: integrationType,
      });

      if (error) {
        console.error("Error checking secret:", error);
        return { has_secret: false } as SecretInfo;
      }

      return data as unknown as SecretInfo;
    },
  });

  // Save a new secret
  const saveMutation = useMutation({
    mutationFn: async (secret: string) => {
      const { data, error } = await supabase.rpc("save_user_integration_secret", {
        p_integration_type: integrationType,
        p_secret: secret,
      });

      if (error) throw error;
      
      const result = data as unknown as SaveResult;
      if (!result.success) {
        throw new Error(result.error || "Failed to save secret");
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secure-secret", integrationType] });
      toast.success("API key saved securely");
    },
    onError: (error) => {
      toast.error("Failed to save API key: " + error.message);
    },
  });

  // Delete a secret
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("delete_user_integration_secret", {
        p_integration_type: integrationType,
      });

      if (error) throw error;
      
      const result = data as unknown as SaveResult;
      if (!result.success) {
        throw new Error(result.error || "Failed to delete secret");
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secure-secret", integrationType] });
      toast.success("API key removed");
    },
    onError: (error) => {
      toast.error("Failed to remove API key: " + error.message);
    },
  });

  return {
    hasSecret: secretInfo?.has_secret ?? false,
    keyHint: secretInfo?.key_hint,
    lastUpdated: secretInfo?.updated_at,
    isLoading,
    saveSecret: saveMutation.mutateAsync,
    removeSecret: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isRemoving: deleteMutation.isPending,
  };
}
