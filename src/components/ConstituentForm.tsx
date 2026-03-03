import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ConstituentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  constituent?: any;
}

type CommunicationPreference = "email" | "phone" | "mail" | "sms" | "no_contact";

const ConstituentForm = ({ open, onOpenChange, onSuccess, constituent }: ConstituentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    first_name: string;
    last_name: string;
    title: string;
    employer: string;
    primary_email: string;
    phone: string;
    mobile_phone: string;
    mailing_street: string;
    mailing_city: string;
    mailing_state: string;
    mailing_postal_code: string;
    communication_preference: CommunicationPreference;
  }>({
    first_name: "",
    last_name: "",
    title: "",
    employer: "",
    primary_email: "",
    phone: "",
    mobile_phone: "",
    mailing_street: "",
    mailing_city: "",
    mailing_state: "",
    mailing_postal_code: "",
    communication_preference: "email",
  });

  // Update form data when constituent changes or dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        first_name: constituent?.first_name || "",
        last_name: constituent?.last_name || "",
        title: constituent?.title || "",
        employer: constituent?.employer || "",
        primary_email: constituent?.primary_email || "",
        phone: constituent?.phone || "",
        mobile_phone: constituent?.mobile_phone || "",
        mailing_street: constituent?.mailing_street || "",
        mailing_city: constituent?.mailing_city || "",
        mailing_state: constituent?.mailing_state || "",
        mailing_postal_code: constituent?.mailing_postal_code || "",
        communication_preference: constituent?.communication_preference || "email",
      });
    }
  }, [open, constituent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (constituent) {
        // Update existing constituent - ONLY send the fields we're editing
        // This preserves all other data like donor info, giving history, etc.
        const { error } = await supabase
          .from("constituents")
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            full_legal_name: `${formData.first_name} ${formData.last_name}`.trim(),
            title: formData.title,
            employer: formData.employer,
            primary_email: formData.primary_email,
            phone: formData.phone,
            mobile_phone: formData.mobile_phone,
            mailing_street: formData.mailing_street,
            mailing_city: formData.mailing_city,
            mailing_state: formData.mailing_state,
            mailing_postal_code: formData.mailing_postal_code,
            communication_preference: formData.communication_preference,
          })
          .eq("id", constituent.id);

        if (error) throw error;
        toast.success("Constituent updated successfully");
      } else {
        // Create new constituent - full object is fine
        const { error } = await supabase
          .from("constituents")
          .insert([{
            ...formData,
            full_legal_name: `${formData.first_name} ${formData.last_name}`.trim(),
            created_by: user?.id
          }]);

        if (error) throw error;
        toast.success("Constituent created successfully");
      }

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        title: "",
        employer: "",
        primary_email: "",
        phone: "",
        mobile_phone: "",
        mailing_street: "",
        mailing_city: "",
        mailing_state: "",
        mailing_postal_code: "",
        communication_preference: "email",
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {constituent ? "Edit Constituent" : "Add New Constituent"}
          </DialogTitle>
          <DialogDescription>
            {constituent
              ? "Update constituent information"
              : "Enter the details for the new constituent"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  required
                  disabled={loading}
                  placeholder="John"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  required
                  disabled={loading}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                disabled={loading}
                placeholder="Executive Director"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employer">Organization / Employer</Label>
              <Input
                id="employer"
                value={formData.employer}
                onChange={(e) =>
                  setFormData({ ...formData, employer: e.target.value })
                }
                disabled={loading}
                placeholder="Acme Corporation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="primary_email"
                type="email"
                value={formData.primary_email}
                onChange={(e) =>
                  setFormData({ ...formData, primary_email: e.target.value })
                }
                required
                disabled={loading}
                placeholder="john@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Business Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  disabled={loading}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile_phone">Mobile Phone</Label>
                <Input
                  id="mobile_phone"
                  type="tel"
                  value={formData.mobile_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile_phone: e.target.value })
                  }
                  disabled={loading}
                  placeholder="(555) 987-6543"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mailing_street">Mailing Street</Label>
              <Input
                id="mailing_street"
                value={formData.mailing_street}
                onChange={(e) =>
                  setFormData({ ...formData, mailing_street: e.target.value })
                }
                disabled={loading}
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mailing_city">City</Label>
                <Input
                  id="mailing_city"
                  value={formData.mailing_city}
                  onChange={(e) =>
                    setFormData({ ...formData, mailing_city: e.target.value })
                  }
                  disabled={loading}
                  placeholder="Minneapolis"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mailing_state">State</Label>
                <Input
                  id="mailing_state"
                  value={formData.mailing_state}
                  onChange={(e) =>
                    setFormData({ ...formData, mailing_state: e.target.value })
                  }
                  disabled={loading}
                  placeholder="MN"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mailing_postal_code">Postal Code</Label>
                <Input
                  id="mailing_postal_code"
                  value={formData.mailing_postal_code}
                  onChange={(e) =>
                    setFormData({ ...formData, mailing_postal_code: e.target.value })
                  }
                  disabled={loading}
                  placeholder="55401"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="communication_preference">Communication Preference</Label>
              <Select
                value={formData.communication_preference}
                onValueChange={(value: CommunicationPreference) =>
                  setFormData({ ...formData, communication_preference: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="mail">Mail</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="no_contact">No Contact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {constituent ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ConstituentForm;