import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCreateCashSnapshot } from "@/hooks/useBurndownData";
import { formatCurrency } from "@/utils/burndown-calculations";

interface UpdateBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  currentBalance: number;
  currentBurnOverride?: number | null;
}

export function UpdateBalanceDialog({ 
  open, 
  onOpenChange, 
  orgId, 
  currentBalance,
  currentBurnOverride 
}: UpdateBalanceDialogProps) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [useBurnOverride, setUseBurnOverride] = useState(false);
  const [burnOverride, setBurnOverride] = useState("");
  
  const createSnapshot = useCreateCashSnapshot();

  // Initialize burn override from current value when dialog opens
  useEffect(() => {
    if (open) {
      if (currentBurnOverride != null) {
        setUseBurnOverride(true);
        setBurnOverride(currentBurnOverride.toString());
      } else {
        setUseBurnOverride(false);
        setBurnOverride("");
      }
    }
  }, [open, currentBurnOverride]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount.replace(/[^0-9.-]/g, ""));
    if (isNaN(parsedAmount)) return;

    const parsedBurnOverride = useBurnOverride 
      ? parseFloat(burnOverride.replace(/[^0-9.-]/g, ""))
      : null;

    await createSnapshot.mutateAsync({
      organization_id: orgId,
      actual_balance: parsedAmount,
      snapshot_date: date,
      monthly_burn_override: parsedBurnOverride && !isNaN(parsedBurnOverride) ? parsedBurnOverride : null,
      notes: notes || null,
    });

    // Reset and close
    setAmount("");
    setNotes("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setUseBurnOverride(false);
    setBurnOverride("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Cash Balance</DialogTitle>
          <DialogDescription>
            Record your current cash position to update projections.
            {currentBalance > 0 && (
              <span className="block mt-1">
                Current balance: {formatCurrency(currentBalance)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Cash Balance</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="text"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">As of Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Monthly Burn Rate Override */}
          <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="burn-override" className="text-sm font-medium">
                  Override Monthly Burn Rate
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Set a fixed burn rate instead of calculating from expenses
                </p>
              </div>
              <Switch
                id="burn-override"
                checked={useBurnOverride}
                onCheckedChange={setUseBurnOverride}
              />
            </div>
            
            {useBurnOverride && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="text"
                  placeholder="Monthly expenses"
                  value={burnOverride}
                  onChange={(e) => setBurnOverride(e.target.value)}
                  className="pl-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  /month
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., End of month bank statement balance"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createSnapshot.isPending}
              className="bg-[#0D7377] hover:bg-[#0D7377]/90"
            >
              {createSnapshot.isPending ? "Saving..." : "Save Balance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
