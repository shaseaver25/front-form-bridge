import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ExternalLink, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useSaasOrganization, useUpdateSaasOrganization } from "@/hooks/useSaasOrganization";
import { useSyncCustomerConfig } from "@/hooks/useSyncCustomerConfig";
import { useSaasFeatureDefinitions } from "@/hooks/useSaasFeatureDefinitions";
import { useSaasOrganizationFeatures, useToggleSaasFeature } from "@/hooks/useSaasOrganizationFeatures";
import { useSaveTerminology } from "@/hooks/useSaasOrganizationTerminology";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { CustomerFeaturesTab } from "@/components/admin/customer/CustomerFeaturesTab";
import { CustomerDetailsTab } from "@/components/admin/customer/CustomerDetailsTab";
import { CustomerBillingTab } from "@/components/admin/customer/CustomerBillingTab";
import { CustomerSyncLogsTab } from "@/components/admin/customer/CustomerSyncLogsTab";
import { CustomerTerminologyTab } from "@/components/admin/customer/CustomerTerminologyTab";
import { ConfirmSyncDialog } from "@/components/admin/ConfirmSyncDialog";
import { OrganizationTypeBadge } from "@/components/admin/customer/OrganizationTypeBadge";
import { QuickConfigureDropdown } from "@/components/admin/customer/QuickConfigureDropdown";
import { OrganizationType } from "@/lib/organizationTypePresets";

export default function SaasCustomerDetailPage() {
  const { id } = useParams();
  const { data: organization, isLoading, error, refetch } = useSaasOrganization(id);
  const { data: featureDefinitions } = useSaasFeatureDefinitions();
  const { data: featureOverrides } = useSaasOrganizationFeatures(id);
  const syncConfig = useSyncCustomerConfig();
  const updateOrg = useUpdateSaasOrganization();
  const toggleFeature = useToggleSaasFeature();
  const saveTerminology = useSaveTerminology();
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [isApplyingPreset, setIsApplyingPreset] = useState(false);

  const handleSyncConfig = () => {
    setShowSyncConfirm(true);
  };

  const confirmSync = () => {
    if (id) {
      syncConfig.mutate(id);
    }
    setShowSyncConfirm(false);
  };

  const handleOpenInstance = () => {
    if (organization?.deployment_url) {
      window.open(organization.deployment_url, "_blank");
    }
  };

  const handleTypeChange = async (newType: OrganizationType) => {
    if (!id) return;
    try {
      await updateOrg.mutateAsync({
        id,
        updates: { organization_type: newType },
      });
      toast.success(`Organization type updated to ${newType}`);
    } catch (err) {
      toast.error("Failed to update organization type");
    }
  };

  const handleApplyPreset = async (
    type: OrganizationType,
    terminology: Record<string, string>,
    featuresToEnable: string[],
    featuresToDisable: string[]
  ) => {
    if (!id || !organization) return;
    
    setIsApplyingPreset(true);
    try {
      if (type !== organization.organization_type) {
        await updateOrg.mutateAsync({ id, updates: { organization_type: type } });
      }
      await saveTerminology.mutateAsync({ organizationId: id, terminology });
      for (const featureKey of featuresToEnable) {
        await toggleFeature.mutateAsync({ organizationId: id, featureKey, isEnabled: true });
      }
      for (const featureKey of featuresToDisable) {
        await toggleFeature.mutateAsync({ organizationId: id, featureKey, isEnabled: false });
      }
      const syncResult = await syncConfig.mutateAsync(id);
      refetch();
      if (!syncResult?.skipped) {
        toast.success("Configuration applied and synced successfully!");
      }
    } catch (err) {
      console.error("Failed to apply preset:", err);
      toast.error("Failed to apply configuration preset");
    } finally {
      setIsApplyingPreset(false);
    }
  };

  const currentEnabledFeatures = featureOverrides?.filter((o) => o.is_enabled).map((o) => o.feature_key) || [];

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "pending": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "provisioning": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Provisioning</Badge>;
      case "suspended": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Suspended</Badge>;
      case "cancelled": return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Cancelled</Badge>;
      default: return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  const getStatusBannerClass = (status: string | null) => {
    switch (status) {
      case "active": return "bg-green-50 border-green-200 text-green-800";
      case "pending": return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "provisioning": return "bg-blue-50 border-blue-200 text-blue-800";
      case "suspended": return "bg-red-50 border-red-200 text-red-800";
      default: return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error || !organization) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-muted-foreground">Customer not found</p>
          <Button asChild className="mt-4">
            <Link to="/admin/customers">Back to Customers</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild className="mt-1">
              <Link to="/admin/customers">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{organization.name}</h1>
                <OrganizationTypeBadge
                  organizationType={organization.organization_type}
                  onTypeChange={handleTypeChange}
                />
                {getStatusBadge(organization.status)}
              </div>
              {organization.deployment_url && (
                <a
                  href={organization.deployment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                >
                  {organization.deployment_url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <QuickConfigureDropdown
              currentType={organization.organization_type as OrganizationType}
              features={featureDefinitions}
              currentEnabledFeatures={currentEnabledFeatures}
              onApplyPreset={handleApplyPreset}
              isApplying={isApplyingPreset}
            />
            <Button variant="outline" onClick={handleOpenInstance} disabled={!organization.deployment_url}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Instance
            </Button>
            <Button onClick={handleSyncConfig} disabled={syncConfig.isPending}>
              {syncConfig.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Sync Config
            </Button>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`rounded-lg border p-4 ${getStatusBannerClass(organization.status)}`}>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div><span className="font-medium">Status:</span> <span className="capitalize">{organization.status}</span></div>
              <div><span className="font-medium">Tier:</span> <span className="capitalize">{organization.subscription_tier}</span></div>
            </div>
            <div>
              <span className="font-medium">Last Sync:</span>{" "}
              {organization.last_config_sync_at ? formatDistanceToNow(new Date(organization.last_config_sync_at), { addSuffix: true }) : "Never synced"}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="features">
          <TabsList>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="terminology">Terminology</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="sync-logs">Sync Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="mt-6">
            <CustomerFeaturesTab organization={organization} />
          </TabsContent>

          <TabsContent value="terminology" className="mt-6">
            <CustomerTerminologyTab organization={organization} />
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <CustomerDetailsTab organization={organization} />
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <CustomerBillingTab organization={organization} />
          </TabsContent>

          <TabsContent value="sync-logs" className="mt-6">
            <CustomerSyncLogsTab organizationId={organization.id} />
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmSyncDialog
        open={showSyncConfirm}
        onOpenChange={setShowSyncConfirm}
        onConfirm={confirmSync}
        customerName={organization.name}
      />
    </Layout>
  );
}
