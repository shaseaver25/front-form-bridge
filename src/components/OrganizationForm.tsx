import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { getErrorMessage } from "@/lib/errorUtils";

const clean = (val: string): string | null => (!val || !val.trim() ? null : val.trim());

interface OrganizationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  organization?: any;
}

const OrganizationForm = ({ open, onOpenChange, onSuccess, organization }: OrganizationFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: organization?.name || "",
    organization_type: organization?.organization_type || "",
    primary_contact: organization?.primary_contact || "",
    email: organization?.email || "",
    phone: organization?.phone || "",
    address: organization?.address || "",
    website: organization?.website || "",
    notes: organization?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const cleanedEmail = clean(formData.email);
      if (cleanedEmail && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(cleanedEmail)) {
        toast.error("Please enter a valid email address");
        setLoading(false);
        return;
      }

      const sanitized = {
        name: formData.name.trim(),
        organization_type: clean(formData.organization_type),
        primary_contact: clean(formData.primary_contact),
        email: cleanedEmail,
        phone: clean(formData.phone),
        address: clean(formData.address),
        website: clean(formData.website),
        notes: clean(formData.notes),
      };

      if (organization) {
        const { error } = await supabase
          .from("organizations")
          .update(sanitized)
          .eq("id", organization.id);

        if (error) throw error;
        toast.success("Organization updated successfully");
      } else {
        const { error } = await supabase
          .from("organizations")
          .insert([{ ...sanitized, created_by: user?.id }]);

        if (error) throw error;
        toast.success("Organization created successfully");
      }

      onSuccess();
      onOpenChange(false);
      
      setFormData({
        name: "",
        organization_type: "",
        primary_contact: "",
        email: "",
        phone: "",
        address: "",
        website: "",
        notes: "",
      });
    } catch (error: unknown) {
      console.error("Organization save failed:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {organization ? "Edit Organization" : "Add Organization"}
          </DialogTitle>
          <DialogDescription>
            {organization ? "Update organization details" : "Add a new funder organization"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Organization Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
                placeholder="Foundation Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organization_type">Type</Label>
              <Input
                id="organization_type"
                value={formData.organization_type}
                onChange={(e) => setFormData({ ...formData, organization_type: e.target.value })}
                disabled={loading}
                placeholder="e.g., Foundation, Corporation, Government"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_contact">Primary Contact</Label>
              <Input
                id="primary_contact"
                value={formData.primary_contact}
                onChange={(e) => setFormData({ ...formData, primary_contact: e.target.value })}
                disabled={loading}
                placeholder="Contact person name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                  placeholder="contact@org.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={loading}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                disabled={loading}
                placeholder="https://example.org"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={loading}
                placeholder="Street address, City, State ZIP"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={loading}
                placeholder="Additional information..."
                rows={2}
              />
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
              {organization ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationForm;
