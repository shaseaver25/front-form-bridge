import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminUserEdit() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    job_title: "",
    organization_name: "",
    is_active: true,
    role: "staff",
  });
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  async function loadUser() {
    try {
      // Get user profile - use maybeSingle to handle case where profile might not exist
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profile) {
        toast({
          title: "Error",
          description: "User profile not found.",
          variant: "destructive",
        });
        navigate("/admin/users");
        return;
      }

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      // Get user email via secure backend function
      const { data: emailData, error: emailError } = await supabase.functions.invoke("get-user-email", {
        body: { userId }
      });
      
      if (emailError) {
        console.error("Error fetching user email:", emailError);
      }

      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        job_title: profile.job_title || "",
        organization_name: profile.organization_name || "",
        is_active: profile.is_active ?? true,
        role: roleData?.role || "staff",
      });
      setEmail(emailData?.email || profile.email || "");
    } catch (error) {
      console.error("Error loading user:", error);
      toast({
        title: "Error",
        description: "Failed to load user details.",
        variant: "destructive",
      });
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          job_title: formData.job_title,
          organization_name: formData.organization_name,
          is_active: formData.is_active,
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Update user role - delete and insert instead of upsert
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: formData.role as "admin" | "staff" | "viewer" | "project",
        });

      if (roleError) throw roleError;

      toast({
        title: "Success",
        description: "User updated successfully.",
      });

      navigate("/admin/users");
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSendPasswordReset() {
    if (!email) return;
    
    setSendingReset(true);
    try {
      const response = await supabase.functions.invoke("send-password-reset", {
        body: { email },
      });

      if (response.error) throw response.error;

      toast({
        title: "Password Reset Sent",
        description: `Password reset email sent to ${email}`,
      });
    } catch (error) {
      console.error("Error sending password reset:", error);
      toast({
        title: "Error",
        description: "Failed to send password reset email.",
        variant: "destructive",
      });
    } finally {
      setSendingReset(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit User</h1>
            <p className="text-muted-foreground">{email}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) =>
                    setFormData({ ...formData, job_title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization_name">Organization / Company</Label>
                <Input
                  id="organization_name"
                  value={formData.organization_name}
                  onChange={(e) =>
                    setFormData({ ...formData, organization_name: e.target.value })
                  }
                  placeholder="Enter organization or company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="project">Project Collaborator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Active User</Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/users")}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSendPasswordReset}
                  disabled={sendingReset || !email}
                >
                  {sendingReset ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="mr-2 h-4 w-4" />
                  )}
                  Send Password Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
