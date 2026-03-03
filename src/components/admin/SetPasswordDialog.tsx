import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Copy, RefreshCw } from "lucide-react";

interface SetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  userName: string;
}

function generateRandomPassword(length = 12): string {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghjkmnpqrstuvwxyz";
  const numbers = "23456789";
  const special = "!@#$%&*";
  
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least one of each type
  let password = 
    uppercase[Math.floor(Math.random() * uppercase.length)] +
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split("").sort(() => Math.random() - 0.5).join("");
}

export function SetPasswordDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
  userName,
}: SetPasswordDialogProps) {
  const { toast } = useToast();
  const [password, setPassword] = useState(() => generateRandomPassword());
  const [showPassword, setShowPassword] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGeneratePassword = () => {
    setPassword(generateRandomPassword());
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Please select and copy the password manually",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (password.length < 8) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("set-user-password", {
        body: { userId, newPassword: password },
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: `Temporary password has been set for ${userName}. Please share it securely.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error setting password:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Temporary Password</DialogTitle>
          <DialogDescription>
            Assign a temporary password for <strong>{userName}</strong> ({userEmail}).
            Share this password securely with the user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Temporary Password</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyPassword}
                title="Copy password"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGeneratePassword}
                title="Generate new password"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum 8 characters. Click refresh to generate a new random password.
            </p>
          </div>

          <div className="rounded-md bg-amber-50 dark:bg-amber-950 p-3 text-sm text-amber-800 dark:text-amber-200">
            <strong>Important:</strong> Share this password securely (e.g., in person, phone call, 
            or encrypted message). The user should change it after their first login.
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Setting Password..." : "Set Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
