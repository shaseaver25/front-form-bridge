export interface NewCustomerWizardState {
  name: string; slug: string; organization_type: "nonprofit" | "education" | "small_business" | "";
  contact_name: string; contact_email: string; contact_phone: string; template_id: string;
  subscription_tier: "starter" | "professional" | "enterprise";
  addon_events: boolean; addon_mailchimp: boolean; addon_quickbooks: boolean;
  custom_price_enabled: boolean; custom_price: number | null;
}

export const initialWizardState: NewCustomerWizardState = {
  name: "", slug: "", organization_type: "", contact_name: "", contact_email: "", contact_phone: "",
  template_id: "", subscription_tier: "professional",
  addon_events: false, addon_mailchimp: false, addon_quickbooks: false,
  custom_price_enabled: false, custom_price: null,
};

export const WIZARD_STEPS = [{ number: 1, label: "Basics" }, { number: 2, label: "Template" }, { number: 3, label: "Subscription" }] as const;