import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import OrganizationForm from "./OrganizationForm";
import LinkedContentAssets from "./LinkedContentAssets";
import LinkContentAssetDialog from "./LinkContentAssetDialog";
import { GrantDocuments } from "./grants/GrantDocuments";
import { GrantProjectBoard } from "./boards/GrantProjectBoard";

const SUGGESTED_CATEGORIES = [
  "STEM Education",
  "Youth Development",
  "Education",
  "Workforce Development",
  "After-School Programs",
  "Capacity Building",
  "General Operating Support",
  "Summer Programs",
  "Arts & Culture",
  "Health & Wellness",
  "College Preparation",
  "Career Pathways",
  "Mentoring",
  "Early Childhood Education",
  "Community Development",
];

interface GrantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  grant?: any;
}

const GrantForm = ({ open, onOpenChange, onSuccess, grant }: GrantFormProps) => {
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [orgFormOpen, setOrgFormOpen] = useState(false);
  const [contentSearchOpen, setContentSearchOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [formData, setFormData] = useState({
    title: grant?.title || "",
    funder_profile_id: grant?.funder_profile_id || "",
    status_stage: grant?.status_stage || "prospecting",
    submission_deadline: grant?.submission_deadline || "",
    requested_amount: grant?.requested_amount || "",
    awarded_amount: grant?.awarded_amount || "",
    compliance_reporting_deadline: grant?.compliance_reporting_deadline || "",
    project_description: grant?.project_description || "",
    notes: grant?.notes || "",
    program_areas: grant?.program_areas || "",
  });

  // Reset form data when grant changes or dialog opens
  useEffect(() => {
    if (open) {
      fetchOrganizations();
      setFormData({
        title: grant?.title || "",
        funder_profile_id: grant?.funder_profile_id || "",
        status_stage: grant?.status_stage || "prospecting",
        submission_deadline: grant?.submission_deadline || "",
        requested_amount: grant?.requested_amount?.toString() || "",
        awarded_amount: grant?.awarded_amount?.toString() || "",
        compliance_reporting_deadline: grant?.compliance_reporting_deadline || "",
        project_description: grant?.project_description || "",
        notes: grant?.notes || "",
        program_areas: grant?.program_areas || "",
      });
    }
  }, [open, grant]);

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .order("name");

    if (!error && data) {
      setOrganizations(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const clean = (val: string | null | undefined): string | null =>
        val === '' || val === undefined ? null : val;

      const dataToSubmit = {
        title: formData.title,
        funder_profile_id: clean(formData.funder_profile_id),
        status_stage: formData.status_stage || 'prospecting',
        requested_amount: formData.requested_amount ? parseFloat(formData.requested_amount) : null,
        awarded_amount: formData.awarded_amount ? parseFloat(formData.awarded_amount) : null,
        submission_deadline: clean(formData.submission_deadline),
        compliance_reporting_deadline: clean(formData.compliance_reporting_deadline),
        project_description: clean(formData.project_description),
        notes: clean(formData.notes),
        program_areas: clean(formData.program_areas),
      };

      if (grant) {
        const { error } = await supabase
          .from("grant_opportunities")
          .update(dataToSubmit)
          .eq("id", grant.id);

        if (error) throw error;
        toast.success("Job updated successfully");
      } else {
        const { error } = await supabase
          .from("grant_opportunities")
          .insert([{ ...dataToSubmit, created_by: user?.id }]);

        if (error) throw error;
        toast.success("Job created successfully");
      }

      onSuccess();
      onOpenChange(false);
      
      setFormData({
        title: "",
        funder_profile_id: "",
        status_stage: "prospecting",
        submission_deadline: "",
        requested_amount: "",
        awarded_amount: "",
        compliance_reporting_deadline: "",
        project_description: "",
        notes: "",
        program_areas: "",
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickInsert = (content: string) => {
    const currentDescription = formData.project_description;
    const newDescription = currentDescription 
      ? `${currentDescription}\n\n${content}`
      : content;
    
    setFormData({ ...formData, project_description: newDescription });
    setContentSearchOpen(false);
  };

  const renderGrantForm = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="title">
          Grant Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          disabled={loading}
          placeholder="Annual Education Grant 2024"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="funder_profile_id">
            Funder Organization <span className="text-destructive">*</span>
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOrgFormOpen(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            New Org
          </Button>
        </div>
        <Select
          value={formData.funder_profile_id}
          onValueChange={(value) =>
            setFormData({ ...formData, funder_profile_id: value })
          }
          disabled={loading}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select funder organization" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="program_areas">Program Area / Category</Label>
        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={categoryOpen}
              className="w-full justify-between font-normal"
              disabled={loading}
            >
              {formData.program_areas || "Select or type a category..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Search or add category..." 
                value={categorySearch}
                onValueChange={setCategorySearch}
              />
              <CommandList>
                <CommandEmpty className="py-2 px-4 text-sm">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setFormData({ ...formData, program_areas: categorySearch });
                      setCategoryOpen(false);
                      setCategorySearch("");
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add "{categorySearch}"
                  </Button>
                </CommandEmpty>
                <CommandGroup heading="Suggested Categories">
                  {SUGGESTED_CATEGORIES
                    .filter((cat) => 
                      cat.toLowerCase().includes(categorySearch.toLowerCase())
                    )
                    .map((category) => (
                      <CommandItem
                        key={category}
                        value={category}
                        onSelect={() => {
                          setFormData({ ...formData, program_areas: category });
                          setCategoryOpen(false);
                          setCategorySearch("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.program_areas === category ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {category}
                      </CommandItem>
                    ))}
                </CommandGroup>
                {categorySearch && !SUGGESTED_CATEGORIES.some(
                  (cat) => cat.toLowerCase() === categorySearch.toLowerCase()
                ) && (
                  <CommandGroup heading="Custom">
                    <CommandItem
                      value={categorySearch}
                      onSelect={() => {
                        setFormData({ ...formData, program_areas: categorySearch });
                        setCategoryOpen(false);
                        setCategorySearch("");
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add "{categorySearch}"
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status_stage">Status/Stage</Label>
        <Select
          value={formData.status_stage}
          onValueChange={(value) =>
            setFormData({ ...formData, status_stage: value })
          }
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prospecting">Prospecting</SelectItem>
            <SelectItem value="research">Research</SelectItem>
            <SelectItem value="letter_of_inquiry_in_progress">Letter of Inquiry In Progress</SelectItem>
            <SelectItem value="letter_of_inquiry_submitted">Letter of Inquiry Submitted</SelectItem>
            <SelectItem value="invited_to_apply">Invited to Apply</SelectItem>
            <SelectItem value="application_in_progress">Application in Progress</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="awarded">Awarded</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
            <SelectItem value="reporting">Reporting</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="requested_amount">Requested Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="requested_amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.requested_amount}
              onChange={(e) =>
                setFormData({ ...formData, requested_amount: e.target.value })
              }
              disabled={loading}
              placeholder="0.00"
              className="pl-7"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="awarded_amount">Awarded Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="awarded_amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.awarded_amount}
              onChange={(e) =>
                setFormData({ ...formData, awarded_amount: e.target.value })
              }
              disabled={loading}
              placeholder="0.00"
              className="pl-7"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="submission_deadline">Submission Deadline</Label>
          <Input
            id="submission_deadline"
            type="date"
            value={formData.submission_deadline}
            onChange={(e) =>
              setFormData({ ...formData, submission_deadline: e.target.value })
            }
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compliance_reporting_deadline">Reporting Deadline</Label>
          <Input
            id="compliance_reporting_deadline"
            type="date"
            value={formData.compliance_reporting_deadline}
            onChange={(e) =>
              setFormData({ ...formData, compliance_reporting_deadline: e.target.value })
            }
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="project_description">Project Description</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setContentSearchOpen(true)}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Insert from Content Repository
          </Button>
        </div>
        <Textarea
          id="project_description"
          value={formData.project_description}
          onChange={(e) =>
            setFormData({ ...formData, project_description: e.target.value })
          }
          disabled={loading}
          placeholder="Brief description of the project or program..."
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData({ ...formData, notes: e.target.value })
          }
          disabled={loading}
          placeholder="Additional notes or requirements..."
          rows={2}
        />
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {grant ? "Edit Grant Opportunity" : "Add Grant Opportunity"}
            </DialogTitle>
            <DialogDescription>
              {grant ? "Update grant opportunity details" : "Track a new funding opportunity"}
            </DialogDescription>
          </DialogHeader>

          {grant ? (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="board">Project Board</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <form onSubmit={handleSubmit}>
                  {renderGrantForm()}
                  <DialogFooter className="mt-6">
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
                      Update Grant
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>
              <TabsContent value="board">
                <GrantProjectBoard
                  grantId={grant.id}
                  grantTitle={grant.title}
                  funderName={grant.organizations?.name}
                  deadline={grant.submission_deadline || grant.application_deadline}
                  amount={grant.requested_amount ? parseFloat(grant.requested_amount) : null}
                />
              </TabsContent>
              <TabsContent value="documents">
                <GrantDocuments grantId={grant.id} />
              </TabsContent>
              <TabsContent value="content">
                <LinkedContentAssets 
                  grantId={grant.id} 
                  onQuickInsert={(content) => {
                    const currentDescription = formData.project_description;
                    const newDescription = currentDescription 
                      ? `${currentDescription}\n\n${content}`
                      : content;
                    setFormData({ ...formData, project_description: newDescription });
                  }}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <form onSubmit={handleSubmit}>
              {renderGrantForm()}
              <DialogFooter className="mt-6">
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
                  Create Grant
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <OrganizationForm
        open={orgFormOpen}
        onOpenChange={setOrgFormOpen}
        onSuccess={fetchOrganizations}
      />

      <LinkContentAssetDialog
        open={contentSearchOpen}
        onOpenChange={setContentSearchOpen}
        grantId={grant?.id || "temp"}
        onSuccess={() => {}}
        onQuickInsert={handleQuickInsert}
      />
    </>
  );
};

export default GrantForm;
