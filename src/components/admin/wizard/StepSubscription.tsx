import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NewCustomerWizardState } from "@/types/saas-wizard";
import { cn } from "@/lib/utils";
import { Check, DollarSign, HelpCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSaasTemplates } from "@/hooks/useSaasTemplates";

interface StepSubscriptionProps {
  data: NewCustomerWizardState;
  onUpdate: (updates: Partial<NewCustomerWizardState>) => void;
  onBack: () => void;
}

const TIERS = [
  {
    id: "starter" as const,
    name: "Starter",
    price: 99,
    description: "3 users, 1,000 constituents, basic features",
    tooltip: "Best for small organizations just getting started. Includes constituent management, basic reporting, and email tracking.",
  },
  {
    id: "professional" as const,
    name: "Professional",
    price: 249,
    description: "10 users, 10,000 constituents, full features",
    tooltip: "Our most popular tier. Includes all core features plus advanced reporting, pipeline management, and priority support.",
  },
  {
    id: "enterprise" as const,
    name: "Enterprise",
    price: 499,
    description: "Unlimited users & constituents, all features",
    tooltip: "For large organizations. Includes everything in Professional plus custom integrations, dedicated support, and SLA guarantees.",
  },
];

const ADDONS = [
  { 
    id: "addon_events", 
    name: "Events & Ticketing", 
    price: 79,
    tooltip: "Create and manage events with ticketing, registration, and attendee tracking. Integrates with payment processing.",
  },
  { 
    id: "addon_mailchimp", 
    name: "Mailchimp Integration", 
    price: 29,
    tooltip: "Two-way sync with Mailchimp for email marketing. Automatically sync contacts, tags, and campaign stats.",
  },
  { 
    id: "addon_quickbooks", 
    name: "QuickBooks Integration", 
    price: 29,
    tooltip: "Sync donations and financials with QuickBooks Online for streamlined bookkeeping and reporting.",
  },
];

export function StepSubscription({ data, onUpdate, onBack }: StepSubscriptionProps) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const { data: templates } = useSaasTemplates(data.organization_type || undefined);
  const selectedTemplate = templates.find((t) => t.id === data.template_id);
  const selectedTier = TIERS.find((t) => t.id === data.subscription_tier) || TIERS[1];

  const calculateTotal = () => {
    if (data.custom_price_enabled && data.custom_price !== null) {
      return data.custom_price;
    }
    let total = selectedTier.price;
    if (data.addon_events) total += 79;
    if (data.addon_mailchimp) total += 29;
    if (data.addon_quickbooks) total += 29;
    return total;
  };

  const handleAddonToggle = (addonId: string, checked: boolean) => {
    onUpdate({ [addonId]: checked });
  };

  const handleCreate = async () => {
    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create customers");
        return;
      }

      const { data: org, error: orgError } = await supabase
        .from("saas_organizations")
        .insert({
          name: data.name,
          slug: data.slug,
          organization_type: data.organization_type,
          contact_name: data.contact_name,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone || null,
          supabase_project_ref: `pending-${data.slug}`,
          supabase_url: `https://pending-${data.slug}.supabase.co`,
          supabase_anon_key: "pending",
          supabase_service_role_key: "pending",
          deployment_url: `https://crm4${data.slug}.vercel.app`,
          subscription_tier: data.subscription_tier,
          addon_events: data.addon_events,
          addon_mailchimp: data.addon_mailchimp,
          addon_quickbooks: data.addon_quickbooks,
          status: "pending",
          subscription_status: "pending",
        })
        .select()
        .single();

      if (orgError) {
        console.error("Error creating organization:", orgError);
        throw orgError;
      }

      // Apply template terminology if template selected
      if (selectedTemplate && selectedTemplate.default_terminology) {
        const terminologyEntries = Object.entries(selectedTemplate.default_terminology).map(
          ([key, value]) => ({
            organization_id: org.id,
            term_key: key,
            term_value: value as string,
          })
        );

        if (terminologyEntries.length > 0) {
          const { error: termError } = await supabase
            .from("saas_organization_terminology")
            .insert(terminologyEntries);

          if (termError) {
            console.error("Error applying terminology:", termError);
          }
        }
      }

      // Apply template pipeline stages if template selected
      if (selectedTemplate?.default_pipeline_stages) {
        const stages = selectedTemplate.default_pipeline_stages as Array<{
          name: string;
          color: string;
          order: number;
        }>;

        const pipelineEntries = stages.map((stage) => ({
          organization_id: org.id,
          name: stage.name,
          color: stage.color,
          order_index: stage.order,
        }));

        if (pipelineEntries.length > 0) {
          const { error: pipelineError } = await supabase
            .from("saas_organization_pipeline_stages")
            .insert(pipelineEntries);

          if (pipelineError) {
            console.error("Error applying pipeline stages:", pipelineError);
          }
        }
      }

      // Log audit entry
      await supabase
        .from("saas_admin_audit_log")
        .insert({
          admin_user_id: user.id,
          action: "create_organization",
          organization_id: org.id,
          details: {
            name: data.name,
            slug: data.slug,
            organization_type: data.organization_type,
            subscription_tier: data.subscription_tier,
            template_id: data.template_id || null,
          },
        });

      toast.success("Customer created successfully!");
      navigate(`/admin/customers/${org.id}`);
    } catch (error) {
      console.error("Failed to create customer:", error);
      toast.error("Failed to create customer. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Subscription & Add-ons</h2>
        <p className="text-muted-foreground text-sm">
          Select the subscription tier and any add-ons for this customer.
        </p>
      </div>

      {/* Tier Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Subscription Tier</Label>
        <div className="grid gap-3">
          {TIERS.map((tier) => {
            const isSelected = data.subscription_tier === tier.id;
            return (
              <Card
                key={tier.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isSelected
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-muted-foreground/50"
                )}
                onClick={() => onUpdate({ subscription_tier: tier.id })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                <TooltipProvider>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{tier.name}</h3>
                      <span className="text-primary font-bold">
                        ${tier.price}/month
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{tier.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tier.description}
                    </p>
                  </div>
                </TooltipProvider>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-3">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  </div>

      {/* Add-ons */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Add-ons</Label>
        <div className="space-y-3">
          {ADDONS.map((addon) => {
            const isChecked = data[addon.id as keyof NewCustomerWizardState] as boolean;
            return (
              <div
                key={addon.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <TooltipProvider>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id={addon.id}
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        handleAddonToggle(addon.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={addon.id} className="cursor-pointer font-normal">
                      {addon.name}
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{addon.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
                <span className="text-sm text-muted-foreground">
                  +${addon.price}/month
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Price Override */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="custom-price-toggle" className="font-medium cursor-pointer">
              Custom Price Override
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Override the calculated price with a custom amount for special deals or negotiations.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="custom-price-toggle"
            checked={data.custom_price_enabled}
            onCheckedChange={(checked) => {
              onUpdate({ 
                custom_price_enabled: checked,
                custom_price: checked ? calculateTotal() : null 
              });
            }}
          />
        </div>
        
        {data.custom_price_enabled && (
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium">$</span>
            <Input
              type="number"
              min={0}
              step={1}
              value={data.custom_price ?? ""}
              onChange={(e) => onUpdate({ custom_price: e.target.value ? Number(e.target.value) : null })}
              placeholder="Enter custom price"
              className="max-w-[150px]"
            />
            <span className="text-muted-foreground">/month</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium">Monthly Total</span>
            {data.custom_price_enabled && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Custom
              </span>
            )}
          </div>
          <span className="text-2xl font-bold text-primary">
            ${calculateTotal()}/month
          </span>
        </div>
        {data.custom_price_enabled && (
          <p className="text-xs text-muted-foreground mt-2">
            Standard price would be ${selectedTier.price + (data.addon_events ? 79 : 0) + (data.addon_mailchimp ? 29 : 0) + (data.addon_quickbooks ? 29 : 0)}/month
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={isCreating}>
          Back
        </Button>
        <Button onClick={handleCreate} disabled={isCreating}>
          {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Customer
        </Button>
      </div>
    </div>
  );
}
