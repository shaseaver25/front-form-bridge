import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SaasOrganization } from "@/hooks/useSaasOrganizations";
import { useSaasFeatureDefinitions, SaasFeatureDefinition } from "@/hooks/useSaasFeatureDefinitions";
import { useSaasOrganizationFeatures, useToggleSaasFeature } from "@/hooks/useSaasOrganizationFeatures";
import { useLogAdminAction } from "@/hooks/useLogAdminAction";
import { toast } from "sonner";
import { Loader2, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { ConfirmFeatureToggleDialog } from "../ConfirmFeatureToggleDialog";
import {
  OrganizationType,
  getRecommendationForFeature,
  getFeatureDisplayName,
  ORGANIZATION_TYPE_META,
} from "@/lib/organizationTypePresets";

interface CustomerFeaturesTabProps {
  organization: SaasOrganization;
}

const CATEGORY_ORDER = ["core", "fundraising", "business", "operations", "enterprise", "integrations"];
const CATEGORY_LABELS: Record<string, string> = {
  core: "Core Features",
  fundraising: "Fundraising",
  business: "Business",
  operations: "Operations",
  enterprise: "Enterprise",
  integrations: "Integrations",
};

export function CustomerFeaturesTab({ organization }: CustomerFeaturesTabProps) {
  const { data: definitions, isLoading: loadingDefs } = useSaasFeatureDefinitions();
  const { data: overrides, isLoading: loadingOverrides } = useSaasOrganizationFeatures(organization.id);
  const toggleFeature = useToggleSaasFeature();
  const logAction = useLogAdminAction();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingFeature, setPendingFeature] = useState<SaasFeatureDefinition | null>(null);
  const [pendingEnabled, setPendingEnabled] = useState(false);

  const orgType = organization.organization_type as OrganizationType;
  const orgTypeMeta = ORGANIZATION_TYPE_META[orgType];

  if (loadingDefs || loadingOverrides) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const groupedFeatures = CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABELS[category] || category,
    features: definitions.filter((f) => f.category === category),
  })).filter((group) => group.features.length > 0);

  const getOverride = (featureKey: string) => {
    return overrides.find((o) => o.feature_key === featureKey);
  };

  const isFeatureAvailable = (feature: SaasFeatureDefinition) => {
    const tier = organization.subscription_tier;
    if (tier === "starter") return feature.available_starter;
    if (tier === "professional") return feature.available_professional;
    if (tier === "enterprise") return feature.available_enterprise;
    return false;
  };

  const hasRequiredAddon = (feature: SaasFeatureDefinition) => {
    if (!feature.requires_addon) return true;
    if (feature.requires_addon === "events") return organization.addon_events;
    if (feature.requires_addon === "mailchimp") return organization.addon_mailchimp;
    if (feature.requires_addon === "quickbooks") return organization.addon_quickbooks;
    return false;
  };

  const getEffectiveState = (feature: SaasFeatureDefinition) => {
    const override = getOverride(feature.key);
    if (override) return override.is_enabled;
    return isFeatureAvailable(feature) && hasRequiredAddon(feature);
  };

  const handleToggleRequest = (feature: SaasFeatureDefinition, enabled: boolean) => {
    const currentState = getEffectiveState(feature);
    if (currentState && !enabled) {
      // Disabling - show confirmation
      setPendingFeature(feature);
      setPendingEnabled(enabled);
      setConfirmDialogOpen(true);
    } else {
      // Enabling - proceed directly
      executeToggle(feature, enabled);
    }
  };

  const executeToggle = async (feature: SaasFeatureDefinition, enabled: boolean) => {
    try {
      await toggleFeature.mutateAsync({
        organizationId: organization.id,
        featureKey: feature.key,
        isEnabled: enabled,
      });

      await logAction.mutateAsync({
        action: "toggle_feature",
        organizationId: organization.id,
        details: {
          feature_key: feature.key,
          feature_name: feature.name,
          is_enabled: enabled,
        },
      });

      toast.success("Feature updated. Click 'Sync Config' to apply changes.");
    } catch (error) {
      console.error("Failed to toggle feature:", error);
      toast.error("Failed to update feature");
    }
  };

  const confirmToggle = () => {
    if (pendingFeature) {
      executeToggle(pendingFeature, pendingEnabled);
    }
    setConfirmDialogOpen(false);
    setPendingFeature(null);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Legend */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Recommended for {orgTypeMeta?.label || orgType}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Not typically used</span>
          </div>
        </div>

        {groupedFeatures.map((group) => (
          <Card key={group.category}>
            <CardHeader>
              <CardTitle className="text-lg">{group.label}</CardTitle>
              {group.category === "business" && orgType !== "small_business" && (
                <CardDescription className="text-amber-600">
                  Business features are primarily designed for commercial use cases
                </CardDescription>
              )}
              {group.category === "fundraising" && orgType === "small_business" && (
                <CardDescription className="text-amber-600">
                  Fundraising features are designed for nonprofits and education
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {group.features.map((feature) => {
                const override = getOverride(feature.key);
                const available = isFeatureAvailable(feature);
                const hasAddon = hasRequiredAddon(feature);
                const effectiveState = getEffectiveState(feature);
                const recommendation = getRecommendationForFeature(orgType, feature.key);
                const displayName = getFeatureDisplayName(orgType, feature.key, feature.name);

                return (
                  <div
                    key={feature.key}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {recommendation && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {recommendation.recommended ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                              )}
                            </TooltipTrigger>
                            <TooltipContent>
                              {recommendation.recommended
                                ? `Recommended for ${orgTypeMeta?.label || orgType}`
                                : `Not typically used for ${orgTypeMeta?.label || orgType}`}
                              {recommendation.note && `: ${recommendation.note}`}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <span className="font-medium">{displayName}</span>
                        {override && (
                          <Badge variant="outline" className="text-xs">
                            Custom
                          </Badge>
                        )}
                        {!available && (
                          <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                            Higher tier required
                          </Badge>
                        )}
                        {feature.requires_addon && !hasAddon && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                            Requires {feature.requires_addon} add-on
                          </Badge>
                        )}
                      </div>
                      {feature.description && (
                        <p className="text-sm text-muted-foreground mt-1 ml-6">
                          {feature.description}
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={effectiveState}
                      onCheckedChange={(checked) => handleToggleRequest(feature, checked)}
                      disabled={toggleFeature.isPending}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="ml-2">
            After changing features, click "Sync Config" to push changes to the customer's instance.
          </AlertDescription>
        </Alert>

        <ConfirmFeatureToggleDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          onConfirm={confirmToggle}
          featureName={pendingFeature?.name || ""}
          isDisabling={!pendingEnabled}
        />
      </div>
    </TooltipProvider>
  );
}
