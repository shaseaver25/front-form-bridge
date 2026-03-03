import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface MajorGiftFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  majorGift?: any;
  preselectedConstituentId?: string;
}

const stages = [
  { value: "identification", label: "Identification" },
  { value: "qualification", label: "Qualification" },
  { value: "cultivation", label: "Cultivation" },
  { value: "solicitation", label: "Solicitation" },
  { value: "stewardship", label: "Stewardship" },
  { value: "closed_won", label: "Closed Won" },
  { value: "closed_lost", label: "Closed Lost" },
];

const MajorGiftForm = ({ open, onOpenChange, onSuccess, majorGift, preselectedConstituentId }: MajorGiftFormProps) => {
  const [loading, setLoading] = useState(false);
  const [constituents, setConstituents] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    constituent_id: preselectedConstituentId || majorGift?.constituent_id || "",
    stage: majorGift?.stage || "identification",
    expected_amount: majorGift?.expected_amount || "",
    expected_date: majorGift?.expected_date || "",
    probability_percent: majorGift?.probability_percent || "",
    primary_solicitor: majorGift?.primary_solicitor || "",
    donor_interest: majorGift?.donor_interest || "",
    restriction_type: majorGift?.restriction_type || "",
    strategy_notes: majorGift?.strategy_notes || "",
    next_steps: majorGift?.next_steps || "",
    contact_history: majorGift?.contact_history || "",
  });

  useEffect(() => {
    if (open) {
      fetchConstituents();
      if (preselectedConstituentId) {
        setFormData(prev => ({ ...prev, constituent_id: preselectedConstituentId }));
      }
    }
  }, [open, preselectedConstituentId]);

  const fetchConstituents = async () => {
    const { data } = await supabase
      .from("constituents_with_ltv")
      .select("*")
      .order("full_legal_name");

    if (data) {
      setConstituents(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const dataToSubmit = {
        ...formData,
        expected_amount: formData.expected_amount ? parseFloat(formData.expected_amount) : null,
        expected_date: formData.expected_date || null,
        probability_percent: formData.probability_percent ? parseInt(formData.probability_percent) : null,
      };

      if (majorGift) {
        const { error } = await supabase
          .from("major_gift_opportunities")
          .update(dataToSubmit)
          .eq("id", majorGift.id);

        if (error) throw error;
        toast.success("Major gift opportunity updated successfully");
      } else {
        const { error } = await supabase
          .from("major_gift_opportunities")
          .insert([{ ...dataToSubmit, created_by: user?.id }]);

        if (error) throw error;
        toast.success("Major gift opportunity created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {majorGift ? "Edit" : "Create"} Major Gift Opportunity
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="constituent_id">Constituent *</Label>
            <Select
              value={formData.constituent_id}
              onValueChange={(value) => setFormData({ ...formData, constituent_id: value })}
              required
              disabled={loading || !!preselectedConstituentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select constituent" />
              </SelectTrigger>
              <SelectContent>
                {constituents.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_legal_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="stage">Stage *</Label>
            <Select
              value={formData.stage}
              onValueChange={(value) => setFormData({ ...formData, stage: value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expected_amount">Expected Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="expected_amount"
                  type="number"
                  step="0.01"
                  value={formData.expected_amount}
                  onChange={(e) => setFormData({ ...formData, expected_amount: e.target.value })}
                  disabled={loading}
                  className="pl-7"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="probability_percent">Probability %</Label>
              <Input
                id="probability_percent"
                type="number"
                min="0"
                max="100"
                value={formData.probability_percent}
                onChange={(e) => setFormData({ ...formData, probability_percent: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expected_date">Expected Date</Label>
              <Input
                id="expected_date"
                type="date"
                value={formData.expected_date}
                onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="primary_solicitor">Primary Solicitor</Label>
              <Input
                id="primary_solicitor"
                value={formData.primary_solicitor}
                onChange={(e) => setFormData({ ...formData, primary_solicitor: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="donor_interest">Donor Interest</Label>
            <Input
              id="donor_interest"
              value={formData.donor_interest}
              onChange={(e) => setFormData({ ...formData, donor_interest: e.target.value })}
              disabled={loading}
              placeholder="e.g., Education, Healthcare"
            />
          </div>

          <div>
            <Label htmlFor="restriction_type">Restriction Type</Label>
            <Input
              id="restriction_type"
              value={formData.restriction_type}
              onChange={(e) => setFormData({ ...formData, restriction_type: e.target.value })}
              disabled={loading}
              placeholder="e.g., Unrestricted, Endowment"
            />
          </div>

          <div>
            <Label htmlFor="strategy_notes">Strategy Notes</Label>
            <Textarea
              id="strategy_notes"
              value={formData.strategy_notes}
              onChange={(e) => setFormData({ ...formData, strategy_notes: e.target.value })}
              disabled={loading}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="next_steps">Next Steps</Label>
            <Textarea
              id="next_steps"
              value={formData.next_steps}
              onChange={(e) => setFormData({ ...formData, next_steps: e.target.value })}
              disabled={loading}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="contact_history">Contact History</Label>
            <Textarea
              id="contact_history"
              value={formData.contact_history}
              onChange={(e) => setFormData({ ...formData, contact_history: e.target.value })}
              disabled={loading}
              rows={3}
            />
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
              {majorGift ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MajorGiftForm;
