import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Check, 
  Shield, 
  Key,
  Trash2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useSecureSecret } from "@/hooks/useSecureSecret";
import { format } from "date-fns";

interface SecureApiKeyInputProps {
  integrationType: string;
  label: string;
  description?: string;
  placeholder?: string;
  helpText?: string;
  helpUrl?: string;
  onTest?: (key: string) => Promise<boolean>;
  onSaved?: () => void;
  onRemoved?: () => void;
}

export function SecureApiKeyInput({
  integrationType,
  label,
  description,
  placeholder = "Enter your API key",
  helpText,
  helpUrl,
  onTest,
  onSaved,
  onRemoved,
}: SecureApiKeyInputProps) {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    hasSecret,
    keyHint,
    lastUpdated,
    isLoading,
    saveSecret,
    removeSecret,
    isSaving,
    isRemoving,
  } = useSecureSecret(integrationType);

  const handleTest = async () => {
    if (!apiKey || !onTest) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const success = await onTest(apiKey);
      setTestResult(success);
    } catch {
      setTestResult(false);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey) return;
    
    try {
      await saveSecret(apiKey);
      setApiKey("");
      setIsEditing(false);
      setTestResult(null);
      onSaved?.();
    } catch {
      // Error handled in hook
    }
  };

  const handleRemove = async () => {
    try {
      await removeSecret();
      setIsEditing(false);
      onRemoved?.();
    } catch {
      // Error handled in hook
    }
  };

  const handleCancel = () => {
    setApiKey("");
    setIsEditing(false);
    setTestResult(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // If user has a secret and not editing, show the "connected" state
  if (hasSecret && !isEditing) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <CardTitle className="text-base">{label}</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  API Key ending in ****{keyHint}
                </p>
                {lastUpdated && (
                  <p className="text-xs text-muted-foreground">
                    Last updated {format(new Date(lastUpdated), "PPp")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Key
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove API Key?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will disconnect the {label} integration. You'll need to enter a new API key to reconnect.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemove}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isRemoving}
                  >
                    {isRemoving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show the input form
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          <CardTitle className="text-base">{label}</CardTitle>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`api-key-${integrationType}`}>API Key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id={`api-key-${integrationType}`}
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder={placeholder}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {helpText && (
            <p className="text-sm text-muted-foreground">
              {helpText}
              {helpUrl && (
                <>
                  {" "}
                  <a
                    href={helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Get your API key <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}
            </p>
          )}
        </div>

        {/* Security notice */}
        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Your API key will be encrypted before storage. Only you can access it, 
            and it's used solely for syncing with {label.replace(" API Key", "")}.
          </p>
        </div>

        {/* Test result */}
        {testResult !== null && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              testResult
                ? "bg-green-500/10 text-green-600"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {testResult ? (
              <>
                <Check className="h-4 w-4" />
                <span className="text-sm">Connection successful!</span>
              </>
            ) : (
              <>
                <span className="text-sm">Connection failed. Please check your API key.</span>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {onTest && (
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={!apiKey || isTesting}
            >
              {isTesting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Test Connection
            </Button>
          )}
          
          <Button
            onClick={handleSave}
            disabled={!apiKey || isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {hasSecret ? "Update Key" : "Save & Connect"}
          </Button>

          {isEditing && (
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
