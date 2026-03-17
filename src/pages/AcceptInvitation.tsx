import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Check, X } from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  invited_by: string;
  expires_at: string;
}

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      toast({
        title: "Invalid Link",
        description: "This invitation link is invalid or missing.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [token]);

  async function verifyToken() {
    try {
      // Use edge function to verify token securely
      const { data, error } = await supabase.functions.invoke('verify-invitation', {
        body: { token }
      });

      if (error || !data?.valid) {
        toast({
          title: "Invalid or Expired",
          description: data?.error || "This invitation link has expired or has already been used.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      setInvitation(data.invitation);
    } catch (error) {
      console.error("Error verifying token:", error);
      toast({
        title: "Error",
        description: "Failed to verify invitation. Please try again.",
        variant: "destructive",
      });
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains number", met: /[0-9]/.test(password) },
    { label: "Contains special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const passwordsMatch = password === confirmPassword && password.length > 0;
  const allRequirementsMet = passwordRequirements.every((req) => req.met);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!allRequirementsMet) {
      toast({
        title: "Invalid Password",
        description: "Please meet all password requirements.",
        variant: "destructive",
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the Terms of Service and Privacy Policy.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Use edge function to accept invitation securely
      const { data, error } = await supabase.functions.invoke('accept-invitation', {
        body: { token, password }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Failed to create account');
      }

      // Sign in the user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation!.email,
        password,
      });

      if (signInError) {
        console.error("Sign in error:", signInError);
        toast({
          title: "Account Created!",
          description: "Your account has been created. Please sign in.",
        });
        navigate("/login");
        return;
      }

      // Determine redirect based on role
      let redirectPath = "/login";
      if (signInData?.user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", signInData.user.id);
        
        const isAdmin = roles?.some((r) => r.role === "admin");
        const isClient = roles?.some((r) => r.role === "client");
        
        if (isAdmin) {
          redirectPath = "/";
        } else if (isClient) {
          redirectPath = "/client/dashboard";
        }
      }

      toast({
        title: "Account Created!",
        description: "Your account has been successfully created. Redirecting...",
      });

      setTimeout(() => {
        navigate(redirectPath);
      }, 1500);
    } catch (error: unknown) {
      console.error("Error creating account:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">👋</span>
          </div>
          <CardTitle className="text-2xl">Welcome to createMPLS!</CardTitle>
          <CardDescription>
            You've been invited by your administrator to join as a{" "}
            <span className="font-semibold">{invitation.role.replace(/_/g, " ")}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={invitation.email} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Create Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password Requirements:</Label>
              <div className="space-y-1">
                {passwordRequirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {req.met ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={req.met ? "text-green-600" : "text-muted-foreground"}>{req.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                />
              </div>
              {confirmPassword && (
                <p
                  className={`text-sm ${
                    passwordsMatch ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {passwordsMatch ? "✓ Passwords match" : "✗ Passwords don't match"}
                </p>
              )}
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                I agree to the Terms of Service and Privacy Policy
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !allRequirementsMet || !passwordsMatch || !agreedToTerms}
            >
              {submitting ? "Creating Account..." : "Create Account & Sign In"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-4">
            This invitation expires in{" "}
            {Math.ceil((new Date(invitation.expires_at).getTime() - Date.now()) / (1000 * 60 * 60))} hours
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
