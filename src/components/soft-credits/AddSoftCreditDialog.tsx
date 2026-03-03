import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConstituentAutocomplete } from './ConstituentAutocomplete';
import {
  useAddSoftCredit,
  useGiftSoftCredits,
  CREDIT_TYPE_LABELS,
  CREDIT_TYPE_DESCRIPTIONS,
} from '@/hooks/useSoftCredits';

interface AddSoftCreditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  giftId: string;
  giftAmount: number;
}

export function AddSoftCreditDialog({
  open,
  onOpenChange,
  giftId,
  giftAmount,
}: AddSoftCreditDialogProps) {
  const [constituentId, setConstituentId] = useState('');
  const [creditType, setCreditType] = useState('');
  const [amount, setAmount] = useState(giftAmount.toString());
  const [notes, setNotes] = useState('');

  const addMutation = useAddSoftCredit();
  const { data: existingCredits } = useGiftSoftCredits(giftId);

  // Get IDs of constituents already credited for this gift
  const excludedConstituentIds = existingCredits?.map((c) => c.constituent_id) || [];

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setConstituentId('');
      setCreditType('');
      setAmount(giftAmount.toString());
      setNotes('');
    }
  }, [open, giftAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!constituentId || !creditType || !amount) {
      return;
    }

    addMutation.mutate(
      {
        gift_id: giftId,
        constituent_id: constituentId,
        credit_type: creditType,
        amount: parseFloat(amount),
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const isValid = constituentId && creditType && parseFloat(amount) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Soft Credit</DialogTitle>
          <DialogDescription>
            Recognize individuals who influenced this gift but didn't directly contribute.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Constituent Selector */}
            <div className="space-y-2">
              <Label htmlFor="constituent">
                Constituent <span className="text-destructive">*</span>
              </Label>
              <ConstituentAutocomplete
                value={constituentId}
                onSelect={(id) => setConstituentId(id)}
                excludeIds={excludedConstituentIds}
                disabled={addMutation.isPending}
              />
            </div>

            {/* Credit Type */}
            <div className="space-y-2">
              <Label htmlFor="credit_type">
                Credit Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={creditType}
                onValueChange={setCreditType}
                disabled={addMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select credit type..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CREDIT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex flex-col items-start">
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

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={addMutation.isPending}
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Gift amount: ${giftAmount.toLocaleString()}. Soft credits can exceed this (e.g.,
                matching gifts).
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={addMutation.isPending}
                placeholder="Additional context about this soft credit..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || addMutation.isPending}>
              {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Soft Credit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
