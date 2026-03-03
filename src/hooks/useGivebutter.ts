import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GivebutterConfig {
  id: string;
  api_key?: string; // Deprecated - now uses env var
  api_key_configured?: boolean; // New field indicating if env var is set
  webhook_secret: string | null;
  last_sync_at: string | null;
  sync_enabled: boolean;
  organization_id: string | null;
}

export interface GivebutterCampaign {
  id: string;
  givebutter_id: number;
  campaign_code: string | null;
  title: string;
  description: string | null;
  goal_amount: number | null;
  raised_amount: number | null;
  status: string | null;
  campaign_type: string | null;
  start_date: string | null;
  end_date: string | null;
  internal_campaign_id: string | null;
}

export interface GivebutterContact {
  id: string;
  givebutter_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  total_contributions: number | null;
  constituent_id: string | null;
  match_status: string | null;
  match_confidence: number | null;
  created_at: string;
}

export interface GivebutterTransaction {
  id: string;
  givebutter_id: string;
  transaction_number: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  amount: number;
  status: string;
  payment_method: string | null;
  transacted_at: string;
  processing_status: string | null;
  processing_error: string | null;
  constituent_id: string | null;
  donation_id: string | null;
  campaign_code: string | null;
}

export interface GivebutterPlan {
  id: string;
  givebutter_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  amount: number;
  frequency: string;
  status: string;
  next_billing_date: string | null;
  constituent_id: string | null;
  pledge_id: string | null;
  campaign_code: string | null;
  plan_created_at: string | null;
}

export function useGivebutterConfig() {
  return useQuery({
    queryKey: ["givebutter-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("givebutter_config")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      // Don't throw on error - just return null config
      if (error) {
        console.warn("Givebutter config not available:", error.message);
        return null;
      }
      
      // Skip edge function check - return config as-is with api_key_configured: false
      // The user can manually test connection when they're ready to set up Givebutter
      return {
        ...data,
        api_key_configured: false,
      } as GivebutterConfig | null;
    },
    // Don't retry on failure - Givebutter is optional
    retry: false,
  });
}

export function useSaveGivebutterConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: Partial<GivebutterConfig>) => {
      const { data: existing } = await supabase
        .from("givebutter_config")
        .select("id")
        .limit(1)
        .maybeSingle();
      
      if (existing) {
        const { data, error } = await supabase
          .from("givebutter_config")
          .update({
            webhook_secret: config.webhook_secret,
            sync_enabled: config.sync_enabled ?? true,
          })
          .eq("id", existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("givebutter_config")
          .insert({
            api_key: "", // Placeholder - API key now comes from env var
            webhook_secret: config.webhook_secret || crypto.randomUUID(),
            sync_enabled: config.sync_enabled ?? true,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["givebutter-config"] });
      toast.success("Configuration saved");
    },
    onError: (error) => {
      toast.error("Failed to save configuration: " + error.message);
    },
  });
}

export function useCheckGivebutterConnection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("givebutter-sync", {
        body: { action: "check_connection" },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.connected) {
        toast.success("Connection successful!");
      } else {
        toast.error("Connection failed. Check your GIVEBUTTER_API_KEY secret.");
      }
      queryClient.invalidateQueries({ queryKey: ["givebutter-config"] });
    },
    onError: (error) => {
      toast.error("Connection test failed: " + error.message);
    },
  });
}

export function useGivebutterSync() {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  
  const sync = async (syncType: "full" | "incremental" | "campaigns" | "contacts" | "transactions" | "plans") => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      
      const { data, error } = await supabase.functions.invoke("givebutter-sync", {
        body: { syncType },
      });
      
      if (error) throw error;
      
      toast.success(`Sync completed successfully`);
      queryClient.invalidateQueries({ queryKey: ["givebutter"] });
      return data;
    } catch (error: unknown) {
      toast.error("Sync failed: " + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    } finally {
      setSyncing(false);
    }
  };
  
  return { sync, syncing };
}

export function useGivebutterCampaigns() {
  return useQuery({
    queryKey: ["givebutter", "campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("givebutter_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as GivebutterCampaign[];
    },
  });
}

export function useUpdateCampaignMapping() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      campaignId, 
      internalCampaignId 
    }: { 
      campaignId: string; 
      internalCampaignId: string | null;
    }) => {
      const { error } = await supabase
        .from("givebutter_campaigns")
        .update({ internal_campaign_id: internalCampaignId })
        .eq("id", campaignId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["givebutter", "campaigns"] });
      toast.success("Campaign mapping updated");
    },
  });
}

export function useGivebutterContacts(matchStatus?: string) {
  return useQuery({
    queryKey: ["givebutter", "contacts", matchStatus],
    queryFn: async () => {
      let query = supabase
        .from("givebutter_contacts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (matchStatus) {
        query = query.eq("match_status", matchStatus);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as GivebutterContact[];
    },
  });
}

export function useMatchContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      contactId, 
      constituentId 
    }: { 
      contactId: string; 
      constituentId: string;
    }) => {
      const { error } = await supabase
        .from("givebutter_contacts")
        .update({ 
          constituent_id: constituentId,
          match_status: "matched",
          match_confidence: 1.0,
        })
        .eq("id", contactId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["givebutter", "contacts"] });
      toast.success("Contact matched");
    },
  });
}

export function useCreateConstituentFromContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contact: GivebutterContact) => {
      // Create constituent
      const { data: constituent, error: createError } = await supabase
        .from("constituents")
        .insert({
          full_legal_name: `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || "Unknown",
          first_name: contact.first_name,
          last_name: contact.last_name,
          primary_email: contact.email,
          phone: contact.phone,
          employer: contact.company,
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Link contact
      const { error: linkError } = await supabase
        .from("givebutter_contacts")
        .update({ 
          constituent_id: constituent.id,
          match_status: "new_created",
          match_confidence: 1.0,
        })
        .eq("id", contact.id);
      
      if (linkError) throw linkError;
      
      return constituent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["givebutter", "contacts"] });
      queryClient.invalidateQueries({ queryKey: ["constituents"] });
      toast.success("Constituent created and linked");
    },
  });
}

export function useGivebutterTransactions(filters?: {
  status?: string;
  processingStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: ["givebutter", "transactions", filters],
    queryFn: async () => {
      let query = supabase
        .from("givebutter_transactions")
        .select("*")
        .order("transacted_at", { ascending: false })
        .limit(100);
      
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.processingStatus) {
        query = query.eq("processing_status", filters.processingStatus);
      }
      if (filters?.dateFrom) {
        query = query.gte("transacted_at", filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte("transacted_at", filters.dateTo);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as GivebutterTransaction[];
    },
  });
}

export function useGivebutterPlans(status?: string) {
  return useQuery({
    queryKey: ["givebutter", "plans", status],
    queryFn: async () => {
      let query = supabase
        .from("givebutter_plans")
        .select("*")
        .order("plan_created_at", { ascending: false });
      
      if (status) {
        query = query.eq("status", status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as GivebutterPlan[];
    },
  });
}

export function useGivebutterStats() {
  return useQuery({
    queryKey: ["givebutter", "stats"],
    queryFn: async () => {
      const [
        { count: totalTransactions },
        { count: pendingContacts },
        { data: activePlans },
      ] = await Promise.all([
        supabase.from("givebutter_transactions").select("*", { count: "exact", head: true }),
        supabase.from("givebutter_contacts").select("*", { count: "exact", head: true }).eq("match_status", "pending"),
        supabase.from("givebutter_plans").select("amount").eq("status", "active"),
      ]);
      
      const mrr = activePlans?.reduce((sum, plan) => {
        const amount = Number(plan.amount) || 0;
        return sum + amount;
      }, 0) || 0;
      
      return {
        totalTransactions: totalTransactions || 0,
        pendingContacts: pendingContacts || 0,
        activePlans: activePlans?.length || 0,
        mrr,
      };
    },
  });
}
