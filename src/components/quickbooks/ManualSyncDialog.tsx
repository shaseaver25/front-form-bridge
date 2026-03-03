import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useStartSync } from '@/hooks/useQuickBooks';
import { RefreshCw, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ManualSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualSyncDialog({ open, onOpenChange }: ManualSyncDialogProps) {
  const syncMutation = useStartSync();
  const [direction, setDirection] = useState<'to_qb' | 'from_qb' | 'bidirectional'>('to_qb');
  const [entityTypes, setEntityTypes] = useState<string[]>(['constituent', 'gift']);
  const [syncComplete, setSyncComplete] = useState(false);

  const toggleEntityType = (type: string) => {
    setEntityTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleStartSync = () => {
    setSyncComplete(false);
    syncMutation.mutate(
      {
        syncType: 'full',
        direction,
        entityTypes,
      },
      {
        onSuccess: () => {
          setSyncComplete(true);
        },
      }
    );
  };

  const handleClose = () => {
    if (!syncMutation.isPending) {
      setSyncComplete(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manual Sync</DialogTitle>
          <DialogDescription>
            Configure and run a manual synchronization with QuickBooks
          </DialogDescription>
        </DialogHeader>

        {syncComplete ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Sync Complete!</h3>
              <p className="text-muted-foreground">
                The synchronization has finished successfully.
              </p>
            </div>
            <Button onClick={handleClose}>Close</Button>
          </div>
        ) : syncMutation.isPending ? (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium">Syncing with QuickBooks...</p>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </div>
            <Progress value={66} className="w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sync Direction */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Sync Direction</Label>
              <RadioGroup
                value={direction}
                onValueChange={(value) => setDirection(value as typeof direction)}
                className="grid grid-cols-1 gap-3"
              >
                <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="to_qb" id="to_qb" />
                  <ArrowUpRight className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <Label htmlFor="to_qb" className="cursor-pointer font-medium">CRM → QuickBooks</Label>
                    <p className="text-sm text-muted-foreground">Export data to QuickBooks</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="from_qb" id="from_qb" />
                  <ArrowDownLeft className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <Label htmlFor="from_qb" className="cursor-pointer font-medium">QuickBooks → CRM</Label>
                    <p className="text-sm text-muted-foreground">Import data from QuickBooks</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="bidirectional" id="bidirectional" />
                  <ArrowLeftRight className="h-5 w-5 text-purple-500" />
                  <div className="flex-1">
                    <Label htmlFor="bidirectional" className="cursor-pointer font-medium">Bidirectional</Label>
                    <p className="text-sm text-muted-foreground">Sync in both directions</p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Entity Types */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Entity Types</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 rounded-lg border p-3">
                  <Checkbox
                    id="constituent"
                    checked={entityTypes.includes('constituent')}
                    onCheckedChange={() => toggleEntityType('constituent')}
                  />
                  <Label htmlFor="constituent" className="flex-1 cursor-pointer">
                    Constituents / Customers
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border p-3">
                  <Checkbox
                    id="gift"
                    checked={entityTypes.includes('gift')}
                    onCheckedChange={() => toggleEntityType('gift')}
                  />
                  <Label htmlFor="gift" className="flex-1 cursor-pointer">
                    Gifts / Sales Receipts
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border p-3">
                  <Checkbox
                    id="pledge"
                    checked={entityTypes.includes('pledge')}
                    onCheckedChange={() => toggleEntityType('pledge')}
                  />
                  <Label htmlFor="pledge" className="flex-1 cursor-pointer">
                    Pledges / Invoices
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {!syncComplete && !syncMutation.isPending && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleStartSync}
              disabled={entityTypes.length === 0}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Sync
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
