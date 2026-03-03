import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRecordPledgePayment, formatCurrency } from "@/hooks/usePledges";

interface RecordPledgePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: string;
    payment_number: number;
    expected_amount: number;
    expected_date: string;
  };
  pledgeId: string;
  constituentId: string;
  fundDesignation?: string;
  totalPayments: number;
}

export function RecordPledgePaymentDialog({
  open,
  onOpenChange,
  payment,
  pledgeId,
  constituentId,
  fundDesignation,
  totalPayments,
}: RecordPledgePaymentDialogProps) {
  const [actualDate, setActualDate] = useState<Date>(new Date());
  const [actualAmount, setActualAmount] = useState(payment.expected_amount.toString());
  const [notes, setNotes] = useState("");

  const recordPayment = useRecordPledgePayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await recordPayment.mutateAsync({
      pledgePaymentId: payment.id,
      pledgeId,
      constituentId,
      actualDate: format(actualDate, 'yyyy-MM-dd'),
      actualAmount: parseFloat(actualAmount),
      expectedAmount: payment.expected_amount,
      paymentNumber: payment.payment_number,
      totalPayments,
      fundDesignation,
      notes: notes || undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment #{payment.payment_number}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Info */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment</span>
              <span>#{payment.payment_number} of {totalPayments}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expected Amount</span>
              <span className="font-medium">{formatCurrency(payment.expected_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expected Date</span>
              <span>{format(new Date(payment.expected_date), "MMM d, yyyy")}</span>
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label>Payment Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !actualDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {actualDate ? format(actualDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={actualDate}
                  onSelect={(date) => date && setActualDate(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Actual Amount */}
          <div className="space-y-2">
            <Label htmlFor="actualAmount">Actual Amount *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="actualAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                className="pl-7"
                required
              />
            </div>
            {parseFloat(actualAmount) < payment.expected_amount && (
              <p className="text-sm text-yellow-600">
                This is less than expected. Payment will be marked as partial.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={recordPayment.isPending || !actualAmount}>
              {recordPayment.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
