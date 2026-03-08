import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, HandCoins } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCreatePledge, FREQUENCY_LABELS, formatCurrency } from "@/hooks/usePledges";
import { ConstituentAutocomplete } from "@/components/soft-credits/ConstituentAutocomplete";

interface CreatePledgeDialogProps {
  constituentId?: string;
  constituentName?: string;
  trigger?: React.ReactNode;
}

export function CreatePledgeDialog({ constituentId, constituentName, trigger }: CreatePledgeDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedConstituentId, setSelectedConstituentId] = useState(constituentId || "");
  const [totalAmount, setTotalAmount] = useState("");
  const [frequency, setFrequency] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [paymentCount, setPaymentCount] = useState("");
  const [fundDesignation, setFundDesignation] = useState("general_fund");
  const [notes, setNotes] = useState("");

  const createPledge = useCreatePledge();

  // Calculate payment schedule preview
  const paymentSchedule = useMemo(() => {
    if (!totalAmount || !frequency || !startDate || !paymentCount) return [];
    
    const amount = parseFloat(totalAmount);
    const count = parseInt(paymentCount);
    if (isNaN(amount) || isNaN(count) || count <= 0) return [];

    const paymentAmount = amount / count;
    const schedule = [];
    const currentDate = new Date(startDate);

    for (let i = 1; i <= count; i++) {
      schedule.push({
        number: i,
        date: new Date(currentDate),
        amount: paymentAmount,
      });

      switch (frequency) {
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'quarterly':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
        case 'annually':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }

    return schedule;
  }, [totalAmount, frequency, startDate, paymentCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedConstituentId || !totalAmount || !frequency || !startDate || !paymentCount) {
      return;
    }

    await createPledge.mutateAsync({
      constituent_id: selectedConstituentId,
      pledge_total_amount: parseFloat(totalAmount),
      pledge_frequency: frequency,
      pledge_start_date: format(startDate, 'yyyy-MM-dd'),
      pledge_payment_count: parseInt(paymentCount),
      fund_designation: fundDesignation,
      notes: notes || undefined,
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    if (!constituentId) setSelectedConstituentId("");
    setTotalAmount("");
    setFrequency("");
    setStartDate(undefined);
    setPaymentCount("");
    setFundDesignation("general_fund");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <HandCoins className="h-4 w-4" />
            Record Pledge
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record New Pledge</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Selection */}
          {!constituentId && (
            <div className="space-y-2">
              <Label>Contact *</Label>
              <ConstituentAutocomplete
                value={selectedConstituentId}
                onSelect={(id) => setSelectedConstituentId(id)}
              />
            </div>
          )}
          {constituentId && constituentName && (
            <div className="space-y-2">
              <Label>Contact</Label>
              <Input value={constituentName} disabled />
            </div>
          )}

          {/* Pledge Amount */}
          <div className="space-y-2">
            <Label htmlFor="totalAmount">Total Pledge Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="pl-7"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Payment Frequency */}
          <div className="space-y-2">
            <Label>Payment Frequency *</Label>
            <Select value={frequency} onValueChange={setFrequency} required>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Number of Payments */}
          <div className="space-y-2">
            <Label htmlFor="paymentCount">Number of Payments *</Label>
            <Input
              id="paymentCount"
              type="number"
              min="1"
              value={paymentCount}
              onChange={(e) => setPaymentCount(e.target.value)}
              placeholder="e.g., 12"
              required
            />
          </div>

          {/* Fund Designation */}
          <div className="space-y-2">
            <Label>Fund Designation</Label>
            <Select value={fundDesignation} onValueChange={setFundDesignation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general_fund">General Fund</SelectItem>
                <SelectItem value="scholarship_fund">Scholarship Fund</SelectItem>
                <SelectItem value="capital_campaign">Capital Campaign</SelectItem>
                <SelectItem value="annual_fund">Annual Fund</SelectItem>
                <SelectItem value="endowment">Endowment</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this pledge..."
              rows={3}
            />
          </div>

          {/* Payment Schedule Preview */}
          {paymentSchedule.length > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <h4 className="font-medium">Payment Schedule Preview</h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {paymentSchedule.map((payment) => (
                  <div key={payment.number} className="flex justify-between text-sm">
                    <span>Payment #{payment.number} - {format(payment.date, "MMM d, yyyy")}</span>
                    <span className="font-medium">{formatCurrency(payment.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total: {paymentSchedule.length} payments</span>
                <span>{formatCurrency(parseFloat(totalAmount) || 0)}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createPledge.isPending || !selectedConstituentId || !totalAmount || !frequency || !startDate || !paymentCount}
            >
              {createPledge.isPending ? "Creating..." : "Create Pledge"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
