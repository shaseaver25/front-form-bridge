import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  Shield, 
  Key, 
  Users, 
  Building2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface SetupStep {
  title: string;
  description: string;
  helpUrl?: string;
  isCompleted?: boolean;
}

interface IntegrationSetupGuideProps {
  integrationName: string;
  integrationLogo?: React.ReactNode;
  credentialType: "org-level" | "user-level" | "oauth";
  isConnected: boolean;
  setupSteps: SetupStep[];
  children?: React.ReactNode;
}

export function IntegrationSetupGuide({
  integrationName,
  integrationLogo,
  credentialType,
  isConnected,
  setupSteps,
  children,
}: IntegrationSetupGuideProps) {
  const getCredentialBadge = () => {
    switch (credentialType) {
      case "org-level":
        return (
          <Badge variant="outline" className="gap-1">
            <Building2 className="h-3 w-3" />
            Organization-wide
          </Badge>
        );
      case "user-level":
        return (
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            Per-user
          </Badge>
        );
      case "oauth":
        return (
          <Badge variant="outline" className="gap-1">
            <Key className="h-3 w-3" />
            OAuth Login
          </Badge>
        );
    }
  };

  const getCredentialDescription = () => {
    switch (credentialType) {
      case "org-level":
        return "This integration uses a shared API key configured by your administrator. All users in your organization share the same connection.";
      case "user-level":
        return "Each user connects their own account. Your API key is encrypted and only accessible by you.";
      case "oauth":
        return "Connect securely by logging in with your existing account. No API keys required.";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {integrationLogo && (
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-muted">
                  {integrationLogo}
                </div>
              )}
              <div>
                <CardTitle className="text-xl">{integrationName} Integration</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {getCredentialBadge()}
                  {isConnected ? (
                    <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Not Connected
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <CardDescription className="mt-3">
            {getCredentialDescription()}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Setup Steps (shown when not connected) */}
      {!isConnected && setupSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Setup Instructions</CardTitle>
            <CardDescription>
              Follow these steps to connect {integrationName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {setupSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {step.description}
                      {step.helpUrl && (
                        <>
                          {" "}
                          <a
                            href={step.helpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Learn more <ExternalLink className="h-3 w-3" />
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Security Info */}
      <Card className="border-muted">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">Security & Privacy</p>
              <p className="text-sm text-muted-foreground mt-1">
                {credentialType === "user-level" ? (
                  <>
                    Your API key is encrypted using AES-256 encryption before storage. 
                    It's only decrypted at runtime when syncing data, and is never logged or exposed.
                  </>
                ) : credentialType === "oauth" ? (
                  <>
                    OAuth tokens are stored securely and automatically refreshed. 
                    You can revoke access at any time from your {integrationName} account settings.
                  </>
                ) : (
                  <>
                    Organization API keys are stored as secure environment variables 
                    and are only accessible to backend services.
                  </>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration-specific content */}
      {children}
    </div>
  );
}
