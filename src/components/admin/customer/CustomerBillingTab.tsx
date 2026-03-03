import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SaasOrganization } from "@/hooks/useSaasOrganizations";
import { Info, Users, UserCheck, Mail } from "lucide-react";

interface CustomerBillingTabProps {
  organization: SaasOrganization;
}

const TIER_PRICES: Record<string, number> = {
  starter: 99,
  professional: 249,
  enterprise: 499,
};

const ADDON_INFO = [
  { key: "addon_events", name: "Events & Ticketing", price: 79 },
  { key: "addon_mailchimp", name: "Mailchimp Integration", price: 29 },
  { key: "addon_quickbooks", name: "QuickBooks Integration", price: 29 },
];

export function CustomerBillingTab({ organization }: CustomerBillingTabProps) {
  const tierPrice = TIER_PRICES[organization.subscription_tier] || 0;

  const enabledAddons = ADDON_INFO.filter(
    (addon) => organization[addon.key as keyof SaasOrganization]
  );

  const addonsTotal = enabledAddons.reduce((sum, addon) => sum + addon.price, 0);
  const monthlyTotal = tierPrice + addonsTotal;

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <div className="font-medium capitalize">{organization.subscription_tier} Plan</div>
              <div className="text-sm text-muted-foreground">Base subscription</div>
            </div>
            <div className="text-lg font-bold">${tierPrice}/mo</div>
          </div>

          {enabledAddons.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Add-ons</div>
              {enabledAddons.map((addon) => (
                <div key={addon.key} className="flex items-center justify-between py-1">
                  <span>{addon.name}</span>
                  <span className="text-muted-foreground">+${addon.price}/mo</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="font-medium">Monthly Total</div>
            <div className="text-2xl font-bold text-primary">${monthlyTotal}/mo</div>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{organization.current_user_count || 0}</div>
              <div className="text-sm text-muted-foreground">Users</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <UserCheck className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{organization.current_constituent_count || 0}</div>
              <div className="text-sm text-muted-foreground">Constituents</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Mail className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{organization.emails_sent_this_period || 0}</div>
              <div className="text-sm text-muted-foreground">Emails Sent</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Integration Placeholder */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="ml-2">
          Stripe integration for payment management coming soon.
        </AlertDescription>
      </Alert>
    </div>
  );
}
