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
import { Loader2, Plus } from "lucide-react";

interface ConstituentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  constituent?: any;
}

type CompanyOption = { id: string; name: string };

const ConstituentForm = ({ open, onOpenChange, onSuccess, constituent }: ConstituentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [showNewCompany, setShowNewCompany] = useState(false);
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
      fetchCompanies();
      setFormData({
        first_name: constituent?.first_name || "",
        last_name: constituent?.last_name || "",
        job_title: constituent?.job_title || "",
        contact_type: constituent?.contact_type || "candidate",
        status: constituent?.status || "active",
        description: constituent?.description || "",
      });
      setSelectedCompanyId(constituent?.primary_company_id || "");
      setNewCompanyName("");
      setShowNewCompany(false);
    }
  }, [open, constituent]);

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from("crm_companies")
      .select("id, name")
      .order("name")
      .limit(500);
    setCompanies(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      let companyId = selectedCompanyId || null;

      // Create new company if needed
      if (showNewCompany && newCompanyName.trim()) {
        const { data: newCo, error: coErr } = await supabase
          .from("crm_companies")
          .insert([{ name: newCompanyName.trim(), created_by: user?.id }])
          .select("id")
          .single();
        if (coErr) throw coErr;
        companyId = newCo.id;
      }

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
            primary_company_id: companyId,
          })
          .eq("id", constituent.id);

        if (error) throw error;

        // Update career history for current company
        if (companyId) {
          // Clear old "is_current" entries
          await supabase
            .from("crm_career_history")
            .update({ is_current: false })
            .eq("contact_id", constituent.id)
            .eq("is_current", true);

          // Insert new current entry
          await supabase.from("crm_career_history").insert([{
            contact_id: constituent.id,
            company_id: companyId,
            job_title: formData.job_title || null,
            is_current: true,
            entry_type: "experience",
          }]);
        }

        toast.success("Contact updated successfully");
      } else {
        const { data: newContact, error } = await supabase
          .from("crm_contacts")
          .insert([{
            first_name: formData.first_name,
            last_name: formData.last_name,
            job_title: formData.job_title,
            contact_type: formData.contact_type,
            status: formData.status,
            description: formData.description,
            created_by: user?.id,
            primary_company_id: companyId,
          }])
          .select("id")
          .single();

        if (error) throw error;

        // Create career history entry linking contact to company
        if (companyId && newContact) {
          await supabase.from("crm_career_history").insert([{
            contact_id: newContact.id,
            company_id: companyId,
            job_title: formData.job_title || null,
            is_current: true,
            entry_type: "experience",
          }]);
        }

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
      setSelectedCompanyId("");
      setNewCompanyName("");
      setShowNewCompany(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

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

            {/* Company field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Company</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1"
                  onClick={() => {
                    setShowNewCompany(!showNewCompany);
                    if (!showNewCompany) setSelectedCompanyId("");
                    else setNewCompanyName("");
                  }}
                  disabled={loading}
                >
                  <Plus className="w-3 h-3" />
                  {showNewCompany ? "Select existing" : "New company"}
                </Button>
              </div>
              {showNewCompany ? (
                <Input
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  disabled={loading}
                  placeholder="Enter new company name"
                />
              ) : (
                <div className="space-y-1">
                  <Input
                    placeholder="Search companies..."
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    disabled={loading}
                    className="mb-1"
                  />
                  <Select
                    value={selectedCompanyId}
                    onValueChange={setSelectedCompanyId}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      <SelectItem value="none">None</SelectItem>
                      {filteredCompanies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
