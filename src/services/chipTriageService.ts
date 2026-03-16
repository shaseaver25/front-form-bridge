import { supabase } from "@/integrations/supabase/client";

export interface TriageResponse {
  response: string;
  action: "auto_fix" | "escalate" | "follow_up" | "info";
  severity?: "low" | "medium" | "high" | "critical";
  ticketId?: string;
  escalationId?: string;
}

export async function sendTriageMessage(
  message: string,
  history: Array<{ role: string; content: string }>,
  context: {
    page: string;
    tier: string;
    role: string;
    browserInfo: Record<string, unknown>;
  }
): Promise<TriageResponse> {
  const { data, error } = await supabase.functions.invoke("chip-triage", {
    body: { message, history, context },
  });

  if (error) {
    console.error("Chip triage error:", error);
    throw new Error(error.message || "Failed to reach triage agent");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as TriageResponse;
}
