import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Loader2, Users } from "lucide-react";
import { ConstituentAutocomplete } from "./soft-credits/ConstituentAutocomplete";
import { CREDIT_TYPE_LABELS, CREDIT_TYPE_DESCRIPTIONS } from "@/hooks/useSoftCredits";

interface GiftFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  constituentId: string;
  gift?: any;
}

const GiftForm = ({ open, onOpenChange, onSuccess, constituentId, gift }: GiftFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: gift?.amount || "",
    date_received: gift?.date_received || new Date().toISOString().split("T")[0],
    fund_designation: gift?.fund_designation || "general_fund",
    campaign_source: gift?.campaign_source || "",
    acknowledgment_status: gift?.acknowledgment_status || "not_sent",
    notes: gift?.notes || "",
  });

  // Soft credit state
  const [addSoftCredit, setAddSoftCredit] = useState(false);
  const [softCreditData, setSoftCreditData] = useState({
    constituent_id: "",
    credit_type: "household_member",
    amount: "",
    notes: "",
  });

  // Reset soft credit amount when gift amount changes
  useEffect(() => {
    if (addSoftCredit && formData.amount && !softCreditData.amount) {
      setSoftCreditData(prev => ({ ...prev, amount: formData.amount }));
    }
  }, [formData.amount, addSoftCredit]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        amount: gift?.amount || "",
        date_received: gift?.date_received || new Date().toISOString().split("T")[0],
        fund_designation: gift?.fund_designation || "general_fund",
        campaign_source: gift?.campaign_source || "",
        acknowledgment_status: gift?.acknowledgment_status || "not_sent",
        notes: gift?.notes || "",
      });
      setAddSoftCredit(false);
      setSoftCreditData({
        constituent_id: "",
        credit_type: "household_member",
        amount: "",
        notes: "",
      });
    }
  }, [open, gift]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (gift) {
        // Update existing gift
        const { error } = await supabase
          .from("gifts")
          .update({
            ...formData,
            amount: parseFloat(formData.amount),
          })
          .eq("id", gift.id);

        if (error) throw error;
        toast.success("Gift updated successfully");
      } else {
        // Create new gift
        const { data: newGift, error: giftError } = await supabase
          .from("gifts")
          .insert([{
            ...formData,
            amount: parseFloat(formData.amount),
            constituent_id: constituentId,
            created_by: user?.id,
          }])
          .select()
          .single();

        if (giftError) throw giftError;

        // Create soft credit if enabled and valid
        if (addSoftCredit && softCreditData.constituent_id && softCreditData.amount) {
          const { error: softCreditError } = await supabase
            .from("gift_soft_credits")
            .insert({
              gift_id: newGift.id,
              constituent_id: softCreditData.constituent_id,
              credit_type: softCreditData.credit_type,
              amount: parseFloat(softCreditData.amount),
              notes: softCreditData.notes || null,
              created_by: user?.id,
            });

          if (softCreditError) {
            console.error("Soft credit error:", softCreditError);
            toast.warning("Gift recorded, but soft credit failed to save");
          } else {
            toast.success("Gift and soft credit recorded successfully");
          }
        } else {
          toast.success("Gift recorded successfully");
        }
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {gift ? "Edit Gift" : "Record New Gift"}
          </DialogTitle>
          <DialogDescription>
            {gift ? "Update gift information" : "Enter the details for this donation"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                  disabled={loading}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_received">
                Date Received <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date_received"
                type="date"
                value={formData.date_received}
                onChange={(e) =>
                  setFormData({ ...formData, date_received: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fund_designation">Fund Designation</Label>
              <Select
                value={formData.fund_designation}
                onValueChange={(value) =>
                  setFormData({ ...formData, fund_designation: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general_fund">General Fund</SelectItem>
                  <SelectItem value="capital_campaign">Capital Campaign</SelectItem>
                  <SelectItem value="endowment">Endowment</SelectItem>
                  <SelectItem value="program_specific">Program Specific</SelectItem>
                  <SelectItem value="scholarship">Scholarship</SelectItem>
                  <SelectItem value="research">Research</SelectItem>
                  <SelectItem value="unrestricted">Unrestricted</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Soft Credit Checkbox - only show for new gifts */}
            {!gift && (
              <div className="flex items-center space-x-2 pt-2 border-t">
                <Checkbox
                  id="add_soft_credit"
                  checked={addSoftCredit}
                  onCheckedChange={(checked) => {
                    setAddSoftCredit(checked === true);
                    if (checked && formData.amount) {
                      setSoftCreditData(prev => ({ ...prev, amount: formData.amount }));
                    }
                  }}
                  disabled={loading}
                />
                <Label
                  htmlFor="add_soft_credit"
                  className="flex items-center gap-2 cursor-pointer text-sm font-medium"
                >
                  <Users className="w-4 h-4" />
                  Add soft credit
                </Label>
              </div>
            )}

            {/* Soft Credit Fields */}
            {!gift && addSoftCredit && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground">
                  Recognize someone who influenced this gift
                </p>

                <div className="space-y-2">
                  <Label>
                    Recipient <span className="text-destructive">*</span>
                  </Label>
                  <ConstituentAutocomplete
                    value={softCreditData.constituent_id}
                    onSelect={(id) =>
                      setSoftCreditData({ ...softCreditData, constituent_id: id })
                    }
                    excludeIds={[constituentId]}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Credit Type</Label>
                  <Select
                    value={softCreditData.credit_type}
                    onValueChange={(value) =>
                      setSoftCreditData({ ...softCreditData, credit_type: value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CREDIT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex flex-col">
                            <span>{label}</span>
                            <span className="text-xs text-muted-foreground">
                              {CREDIT_TYPE_DESCRIPTIONS[value]}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Amount <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={softCreditData.amount}
                      onChange={(e) =>
                        setSoftCreditData({ ...softCreditData, amount: e.target.value })
                      }
                      disabled={loading}
                      placeholder="0.00"
                      className="pl-7"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Defaults to gift amount. Can exceed gift amount for matching gifts.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={softCreditData.notes}
                    onChange={(e) =>
                      setSoftCreditData({ ...softCreditData, notes: e.target.value })
                    }
                    disabled={loading}
                    placeholder="Additional context about this soft credit..."
                    rows={2}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="campaign_source">Campaign/Source</Label>
              <Input
                id="campaign_source"
                value={formData.campaign_source}
                onChange={(e) =>
                  setFormData({ ...formData, campaign_source: e.target.value })
                }
                disabled={loading}
                placeholder="e.g., Annual Gala 2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="acknowledgment_status">Acknowledgment Status</Label>
              <Select
                value={formData.acknowledgment_status}
                onValueChange={(value) =>
                  setFormData({ ...formData, acknowledgment_status: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_sent">Not Sent</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
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
                placeholder="Additional details about this gift..."
                rows={3}
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
            <Button 
              type="submit" 
              disabled={loading || (addSoftCredit && !softCreditData.constituent_id)}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {gift ? "Update" : addSoftCredit ? "Record Gift & Soft Credit" : "Record Gift"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GiftForm;
