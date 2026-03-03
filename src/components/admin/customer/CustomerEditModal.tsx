import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { SaasOrganization } from "@/hooks/useSaasOrganizations";
import { useUpdateSaasOrganization } from "@/hooks/useSaasOrganization";
import { useLogAdminAction } from "@/hooks/useLogAdminAction";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CustomerEditModalProps {
  organization: SaasOrganization;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerEditModal({ organization, open, onOpenChange }: CustomerEditModalProps) {
  const [formData, setFormData] = useState({
    name: organization.name,
    organization_type: organization.organization_type,
    contact_name: organization.contact_name,
    contact_email: organization.contact_email,
    contact_phone: organization.contact_phone || "",
    status: organization.status || "pending",
  });

  const updateOrg = useUpdateSaasOrganization();
  const logAction = useLogAdminAction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateOrg.mutateAsync({
        id: organization.id,
        updates: {
          name: formData.name,
          organization_type: formData.organization_type,
          contact_name: formData.contact_name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone || null,
          status: formData.status,
        },
      });

      await logAction.mutateAsync({
        action: "update_organization",
        organizationId: organization.id,
        details: {
          changes: formData,
        },
      });

      toast.success("Organization updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update organization:", error);
      toast.error("Failed to update organization");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Organization Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-type">Organization Type</Label>
            <Select
              value={formData.organization_type}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, organization_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nonprofit">Nonprofit</SelectItem>
                <SelectItem value="education">Educational Institution</SelectItem>
                <SelectItem value="small_business">Small Business</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="provisioning">Provisioning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-contact-name">Contact Name</Label>
            <Input
              id="edit-contact-name"
              value={formData.contact_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, contact_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-contact-email">Contact Email</Label>
            <Input
              id="edit-contact-email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData((prev) => ({ ...prev, contact_email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-contact-phone">Contact Phone</Label>
            <Input
              id="edit-contact-phone"
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateOrg.isPending}>
              {updateOrg.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
