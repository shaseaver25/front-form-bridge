import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check, AlertCircle } from "lucide-react";

type Step = "info" | "role" | "review";

interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: string;
  organizationName: string;
  role: string;
}

const roleOptions = [
  {
    value: "staff",
    label: "Development Officer",
    description: "Full access to constituents, donations, and major gift management. Can create and edit donor records.",
    permissions: [
      "View all constituents",
      "Create/edit constituents",
      "View/edit donations",
      "Manage major gift opportunities",
      "View campaigns",
    ],
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Read-only access to dashboards and reports. Cannot edit any data.",
    permissions: ["View dashboards", "View reports", "View constituents (read-only)"],
  },
  {
    value: "project",
    label: "Project Collaborator",
    description: "Limited access to specific projects they are invited to. Can view project boards, documents, and linked grants.",
    permissions: [
      "View assigned project boards",
      "View project documents",
      "View linked grants",
      "View project team members",
    ],
  },
  {
    value: "client",
    label: "Coaching Client",
    description: "Access to the client portal including Re:Brand coaching materials, progress tracking, and scheduled sessions.",
    permissions: [
      "Access client portal dashboard",
      "View coaching materials",
      "Track progress",
      "View scheduled sessions",
    ],
  },
  {
    value: "admin",
    label: "Admin",
    description: "Complete system access including user management and security settings. Use with caution.",
    permissions: ["Full system access", "User management", "Security settings", "All data access"],
  },
];

export default function AdminUserNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>("info");
  const [loading, setLoading] = useState(false);
  const [sendCopy, setSendCopy] = useState(true);
  const [form, setForm] = useState<UserForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    department: "",
    organizationName: "",
    role: "staff",
  });

  function handleInputChange(field: keyof UserForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSendInvitation() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No session found");
      }

      const response = await supabase.functions.invoke("send-user-invitation", {
        body: {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
          jobTitle: form.jobTitle || undefined,
          department: form.department || undefined,
          organizationName: form.organizationName || undefined,
          role: form.role,
        },
      });

      if (response.error) {
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : response.error.message || "Failed to send invitation";
        throw new Error(errorMsg);
      }

      // Check for error in response data
      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Invitation Sent!",
        description: `An invitation has been sent to ${form.email}`,
      });

      navigate("/admin/users");
    } catch (error: unknown) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function renderStepContent() {
    switch (currentStep) {
      case "info":
        return (
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Enter the basic details for the new user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="shannon@tailoredu.org"
                  required
                />
                <p className="text-sm text-muted-foreground">An invitation will be sent to this email</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="612-555-1234"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title (Optional)</Label>
                <Input
                  id="jobTitle"
                  value={form.jobTitle}
                  onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                  placeholder="Development Officer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department (Optional)</Label>
                <Input
                  id="department"
                  value={form.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                  placeholder="Development"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization / Company (Optional)</Label>
                <Input
                  id="organizationName"
                  value={form.organizationName}
                  onChange={(e) => handleInputChange("organizationName", e.target.value)}
                  placeholder="Acme Corp"
                />
                <p className="text-sm text-muted-foreground">
                  For external collaborators, enter their company or organization name
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => navigate("/admin/users")}>
                  Cancel
                </Button>
                <Button
                  onClick={() => setCurrentStep("role")}
                  disabled={!form.firstName || !form.lastName || !form.email}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "role":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Assign Role to {form.firstName} {form.lastName}</CardTitle>
              <CardDescription>Choose the level of access for this user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={form.role} onValueChange={(value) => handleInputChange("role", value)}>
                {roleOptions.map((option) => (
                  <Card key={option.value} className={form.role === option.value ? "border-primary" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={option.value} className="text-base font-semibold cursor-pointer">
                            {option.label}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                          <div className="mt-3 space-y-1">
                            <p className="text-sm font-medium">Permissions:</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {option.permissions.map((perm, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <Check className="h-3 w-3 text-green-500" />
                                  {perm}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep("info")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={() => setCurrentStep("review")}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "review":
        const selectedRole = roleOptions.find((r) => r.value === form.role);
        return (
          <Card>
            <CardHeader>
              <CardTitle>Review & Send Invitation</CardTitle>
              <CardDescription>Please review the user details before sending the invitation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">User Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{form.firstName} {form.lastName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{form.email}</p>
                  </div>
                  {form.phone && (
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{form.phone}</p>
                    </div>
                  )}
                  {form.jobTitle && (
                    <div>
                      <span className="text-muted-foreground">Title:</span>
                      <p className="font-medium">{form.jobTitle}</p>
                    </div>
                  )}
                  {form.department && (
                    <div>
                      <span className="text-muted-foreground">Department:</span>
                      <p className="font-medium">{form.department}</p>
                    </div>
                  )}
                  {form.organizationName && (
                    <div>
                      <span className="text-muted-foreground">Organization:</span>
                      <p className="font-medium">{form.organizationName}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Role:</span>
                    <p className="font-medium">{selectedRole?.label}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="sendCopy" checked={sendCopy} onCheckedChange={(checked) => setSendCopy(checked as boolean)} />
                <Label htmlFor="sendCopy" className="text-sm cursor-pointer">
                  Send me a copy of the invitation email
                </Label>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setCurrentStep("role")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleSendInvitation} disabled={loading}>
                  {loading ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add New User</h1>
        <p className="text-muted-foreground">Invite a new team member to TailoredU CRM</p>
        
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 ${currentStep === "info" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === "info" ? "border-primary bg-primary text-primary-foreground" : "border-muted"}`}>
              1
            </div>
            <span className="hidden sm:inline">User Info</span>
          </div>
          <div className="w-12 h-px bg-border" />
          <div className={`flex items-center gap-2 ${currentStep === "role" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === "role" ? "border-primary bg-primary text-primary-foreground" : "border-muted"}`}>
              2
            </div>
            <span className="hidden sm:inline">Role</span>
          </div>
          <div className="w-12 h-px bg-border" />
          <div className={`flex items-center gap-2 ${currentStep === "review" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${currentStep === "review" ? "border-primary bg-primary text-primary-foreground" : "border-muted"}`}>
              3
            </div>
            <span className="hidden sm:inline">Review</span>
          </div>
        </div>
      </div>

      {renderStepContent()}
    </div>
  );
}