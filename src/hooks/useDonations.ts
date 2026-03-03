import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

export interface DonationCampaign {
  id: string;
  name: string;
  description: string | null;
  goal_amount: number | null;
  current_amount: number | null;
  donor_count: number | null;
  start_date: string | null;
  end_date: string | null;
  campaign_type: string | null;
  status: string | null;
  page_slug: string | null;
  hero_image_url: string | null;
  thank_you_message: string | null;
  show_progress_bar: boolean | null;
  show_donor_wall: boolean | null;
  allow_anonymous: boolean | null;
  created_at: string | null;
}

export interface DonationForm {
  id: string;
  name: string;
  campaign_id: string | null;
  suggested_amounts: number[];
  allow_custom_amount: boolean | null;
  minimum_amount: number | null;
  allow_recurring: boolean | null;
  recurring_frequencies: string[];
  fund_designations: string[];
  allow_tribute_gifts: boolean | null;
  allow_cover_fees: boolean | null;
  processing_fee_percent: number | null;
  button_text: string | null;
  button_color: string | null;
  is_active: boolean | null;
}

export interface StripeDonation {
  id: string;
  amount: number;
  status: string | null;
  donor_email: string;
  donor_first_name: string | null;
  donor_last_name: string | null;
  fund_designation: string | null;
  is_recurring: boolean | null;
  recurring_frequency: string | null;
  is_anonymous: boolean | null;
  is_tribute: boolean | null;
  tribute_type: string | null;
  tribute_name: string | null;
  synced_to_crm: boolean | null;
  created_at: string | null;
  campaign_id: string | null;
  constituent_id: string | null;
}

export interface RecurringDonation {
  id: string;
  stripe_subscription_id: string;
  constituent_id: string | null;
  amount: number;
  frequency: string;
  status: string | null;
  fund_designation: string | null;
  start_date: string;
  next_payment_date: string | null;
  last_payment_date: string | null;
  total_donated: number | null;
  payment_count: number | null;
}

export function useDonationCampaigns() {
  return useQuery({
    queryKey: ["donation-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donation_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DonationCampaign[];
    },
  });
}

export function useDonationCampaign(slug: string | undefined) {
  return useQuery({
    queryKey: ["donation-campaign", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("donation_campaigns")
        .select("*")
        .eq("page_slug", slug)
        .single();
      if (error) throw error;
      return data as DonationCampaign;
    },
    enabled: !!slug,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaign: Partial<DonationCampaign>) => {
      const { data, error } = await supabase
        .from("donation_campaigns")
        .insert([campaign as any])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donation-campaigns"] });
      toast.success("Campaign created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DonationCampaign> & { id: string }) => {
      const { data, error } = await supabase
        .from("donation_campaigns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donation-campaigns"] });
      toast.success("Campaign updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update campaign: ${error.message}`);
    },
  });
}

export function useDonationForms() {
  return useQuery({
    queryKey: ["donation-forms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donation_forms")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DonationForm[];
    },
  });
}

export function useCreateDonationForm() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (form: Partial<DonationForm>) => {
      const { data, error } = await supabase
        .from("donation_forms")
        .insert([form as any])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donation-forms"] });
      toast.success("Form created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create form: ${error.message}`);
    },
  });
}

export function useStripeDonations(filters?: { status?: string; campaignId?: string }) {
  return useQuery({
    queryKey: ["stripe-donations", filters],
    queryFn: async () => {
      let query = supabase
        .from("stripe_donations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.campaignId) {
        query = query.eq("campaign_id", filters.campaignId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as StripeDonation[];
    },
  });
}

export function useRecurringDonations(filters?: { status?: string }) {
  return useQuery({
    queryKey: ["recurring-donations", filters],
    queryFn: async () => {
      let query = supabase
        .from("recurring_donations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as RecurringDonation[];
    },
  });
}

export function useDonationStats(days: number = 30) {
  return useQuery({
    queryKey: ["donation-stats", days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: donations, error } = await supabase
        .from("stripe_donations")
        .select("amount, donor_email, is_recurring")
        .eq("status", "succeeded")
        .gte("created_at", startDate.toISOString());
      
      if (error) throw error;
      
      const totalAmount = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const uniqueDonors = new Set(donations?.map(d => d.donor_email)).size;
      const avgGift = uniqueDonors > 0 ? totalAmount / uniqueDonors : 0;
      const recurringCount = donations?.filter(d => d.is_recurring).length || 0;
      
      return {
        totalAmount,
        donorCount: uniqueDonors,
        avgGift,
        recurringCount,
      };
    },
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async (data: {
      amount: number;
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      isRecurring?: boolean;
      frequency?: string;
      fundDesignation?: string;
      campaignId?: string;
      formId?: string;
      coverFees?: boolean;
      isTribute?: boolean;
      tributeType?: string;
      tributeName?: string;
      tributeNotifyEmail?: string;
      isAnonymous?: boolean;
      successUrl?: string;
      cancelUrl?: string;
    }) => {
      const { data: result, error } = await supabase.functions.invoke("create-checkout-session", {
        body: data,
      });
      
      if (error) throw error;
      return result as { sessionId: string; url: string };
    },
    onError: (error) => {
      toast.error(`Checkout failed: ${error.message}`);
    },
  });
}
