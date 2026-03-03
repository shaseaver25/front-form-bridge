import { supabase } from "@/integrations/supabase/client";

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AgentResponse {
  response: string;
  conversation_history: Array<{ role: string; content: unknown }>;
}

export async function sendDonorAgentMessage(
  message: string,
  conversationHistory: Array<{ role: string; content: unknown }> = []
): Promise<AgentResponse> {
  const { data, error } = await supabase.functions.invoke("donor-agent", {
    body: { message, conversation_history: conversationHistory },
  });

  if (error) {
    console.error("Donor agent error:", error);
    throw new Error(error.message || "Failed to reach donor agent");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as AgentResponse;
}