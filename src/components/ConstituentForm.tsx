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

const ConstituentForm = ({ open, onOpenChange, onSuccess, constituent }: ConstituentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    job_title: "",
    contact_type: "candidate" as string,
    status: "active" as string,
    description: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        first_name: constituent?.first_name || "",
        last_name: constituent?.last_name || "",
        job_title: constituent?.job_title || "",
        contact_type: constituent?.contact_type || "candidate",
        status: constituent?.status || "active",
        description: constituent?.description || "",
      });
    }
  }, [open, constituent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (constituent) {
        const { error } = await supabase
          .from("crm_contacts")
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            job_title: formData.job_title,
            contact_type: formData.contact_type,
            status: formData.status,
            description: formData.description,
          })
          .eq("id", constituent.id);

        if (error) throw error;
        toast.success("Contact updated successfully");
      } else {
        const { error } = await supabase
          .from("crm_contacts")
          .insert([{
            first_name: formData.first_name,
            last_name: formData.last_name,
            job_title: formData.job_title,
            contact_type: formData.contact_type,
            status: formData.status,
            description: formData.description,
            created_by: user?.id,
          }]);

        if (error) throw error;
        toast.success("Contact created successfully");
      }

      onSuccess();
      onOpenChange(false);
      setFormData({
        first_name: "",
        last_name: "",
        job_title: "",
        contact_type: "candidate",
        status: "active",
        description: "",
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
            {constituent ? "Edit Contact" : "Add New Contact"}
          </DialogTitle>
          <DialogDescription>
            {constituent
              ? "Update contact information"
              : "Enter the details for the new contact"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  disabled={loading}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                disabled={loading}
                placeholder="CTO"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_type">Type</Label>
                <Select
                  value={formData.contact_type}
                  onValueChange={(value) => setFormData({ ...formData, contact_type: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="candidate">Candidate</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="contact">Contact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Notes</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
                placeholder="Additional notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
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
