import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SaasOrganization } from "@/hooks/useSaasOrganizations";
import { format } from "date-fns";
import { Pencil, Copy, CheckCircle, Terminal, Rocket } from "lucide-react";
import { useState } from "react";
import { CustomerEditModal } from "./CustomerEditModal";
import { toast } from "sonner";

interface CustomerDetailsTabProps {
  organization: SaasOrganization;
}

export function CustomerDetailsTab({ organization }: CustomerDetailsTabProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";
    return format(new Date(date), "PPP");
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "nonprofit":
        return "Nonprofit";
      case "education":
        return "Educational Institution";
      case "small_business":
        return "Small Business";
      default:
        return type;
    }
  };

  const isPending = organization.status === "pending" || organization.supabase_url?.includes("pending");

  const generateEnvVars = () => {
    return `# TailoredU Environment Variables for ${organization.name}
# Add these to your Vercel project: ${organization.slug}.tailoredu.app

# Supabase Configuration (get from your Supabase project dashboard)
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Organization Configuration
VITE_ORG_SLUG=${organization.slug}
VITE_ORG_TYPE=${organization.organization_type}
VITE_SUBSCRIPTION_TIER=${organization.subscription_tier}

# Feature Flags
VITE_ADDON_EVENTS=${organization.addon_events}
VITE_ADDON_MAILCHIMP=${organization.addon_mailchimp}
VITE_ADDON_QUICKBOOKS=${organization.addon_quickbooks}`;
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generateEnvVars());
    setCopied(true);
    toast.success("Environment variables copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Pending Deployment Banner */}
      {isPending && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Rocket className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Deployment pending:</strong> This customer's instance needs to be deployed. 
            Copy the environment variables below and set them up in Vercel.
          </AlertDescription>
        </Alert>
      )}

      {/* Deployment Configuration (shown prominently for pending) */}
      {isPending && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Deployment Configuration
            </CardTitle>
            <Button size="sm" variant="outline" onClick={copyToClipboard}>
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Env Vars
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
              {generateEnvVars()}
            </pre>
            <div className="mt-4 text-sm text-muted-foreground">
              <strong>Next steps:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Create a Supabase project named <code className="bg-muted px-1 rounded">tailoredu-{organization.slug}</code></li>
                <li>Run migrations from the canonical repo</li>
                <li>Deploy to Vercel with the environment variables above</li>
                <li>Update this customer's status to "active" once deployed</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Organization Info</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{organization.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Slug</dt>
              <dd className="font-mono">{organization.slug}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Type</dt>
              <dd>{getTypeLabel(organization.organization_type)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{organization.status}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Contact Name</dt>
              <dd className="font-medium">{organization.contact_name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{organization.contact_email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{organization.contact_phone || "Not set"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Address */}
      {(organization.address_line1 || organization.city) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Address</CardTitle>
          </CardHeader>
          <CardContent>
            <address className="not-italic text-sm">
              {organization.address_line1 && <div>{organization.address_line1}</div>}
              {organization.address_line2 && <div>{organization.address_line2}</div>}
              {(organization.city || organization.state || organization.zip) && (
                <div>
                  {organization.city}
                  {organization.city && organization.state && ", "}
                  {organization.state} {organization.zip}
                </div>
              )}
              {organization.country && organization.country !== "US" && (
                <div>{organization.country}</div>
              )}
            </address>
          </CardContent>
        </Card>
      )}

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Technical Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Supabase URL</dt>
              <dd className="font-mono text-xs truncate">
                {organization.supabase_url?.includes("pending") 
                  ? <span className="text-yellow-600 italic">Pending setup</span>
                  : organization.supabase_url || "Not set"
                }
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Deployment URL</dt>
              <dd className="font-mono text-xs truncate">{organization.deployment_url || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDate(organization.created_at)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Provisioned</dt>
              <dd>{formatDate(organization.provisioned_at)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <CustomerEditModal
        organization={organization}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      />
    </div>
  );
}
