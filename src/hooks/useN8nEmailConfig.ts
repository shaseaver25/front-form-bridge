import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { appendUnsubscribeFooter } from "@/lib/emailFooter";

interface N8nEmailConfig {
  id: string;
  user_id: string;
  outbound_webhook_url: string | null;
  inbound_webhook_secret: string | null;
  inbound_enabled: boolean;
  preferred_provider: "microsoft" | "gmail" | null;
  created_at: string;
  updated_at: string;
}

export function useN8nEmailConfig() {
  const [config, setConfig] = useState<N8nEmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("n8n_email_config")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setConfig(data as N8nEmailConfig | null);
    } catch (error) {
      console.error("Error fetching n8n config:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (updates: Partial<N8nEmailConfig>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (config) {
        // Update existing
        const { error } = await supabase
          .from("n8n_email_config")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", config.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("n8n_email_config")
          .insert({
            user_id: user.id,
            ...updates,
          });

        if (error) throw error;
      }

      await fetchConfig();
      toast({
        title: "Settings saved",
        description: "Your n8n email settings have been updated.",
      });
    } catch (error: unknown) {
      console.error("Error saving n8n config:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return { config, loading, saveConfig, refetch: fetchConfig };
}

export function useSendEmailViaN8n() {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const sendEmail = async (emailData: {
    to: string;
    to_name?: string;
    subject: string;
    body_html: string;
    body_text?: string;
    template_id?: string;
    constituent_id?: string;
  }) => {
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const enrichedData = emailData.constituent_id
        ? { ...emailData, body_html: appendUnsubscribeFooter(emailData.body_html, emailData.constituent_id) }
        : emailData;

      const response = await supabase.functions.invoke("send-via-n8n", {
        body: enrichedData,
      });

      if (response.error) throw response.error;

      toast({
        title: "Email queued",
        description: "Your email has been sent to n8n for delivery.",
      });

      return response.data;
    } catch (error: unknown) {
      console.error("Error sending via n8n:", error);
      toast({
        title: "Send failed",
        description: error instanceof Error ? error.message : "Failed to send email via n8n",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSending(false);
    }
  };

  return { sendEmail, sending };
}
