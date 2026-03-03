import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Clock, AlertCircle, SkipForward, CircleDot } from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { usePledgePayments, useUpdatePledgePayment, PAYMENT_STATUS_LABELS, formatCurrency } from "@/hooks/usePledges";
import { cn } from "@/lib/utils";
import { RecordPledgePaymentDialog } from "./RecordPledgePaymentDialog";
import { useState } from "react";

interface PledgePaymentScheduleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pledgeId: string;
  constituentId: string;
  fundDesignation?: string;
  totalPayments: number;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  pending: { 
    icon: <Clock className="h-4 w-4" />, 
    color: "text-muted-foreground",
    bgColor: "bg-muted"
  },
  paid: { 
    icon: <Check className="h-4 w-4" />, 
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30"
  },
  partial: { 
    icon: <CircleDot className="h-4 w-4" />, 
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30"
  },
  overdue: { 
    icon: <AlertCircle className="h-4 w-4" />, 
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30"
  },
  skipped: { 
    icon: <SkipForward className="h-4 w-4" />, 
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800"
  },
};

export function PledgePaymentSchedule({ 
  open, 
  onOpenChange, 
  pledgeId, 
  constituentId,
  fundDesignation,
  totalPayments 
}: PledgePaymentScheduleProps) {
  const { data: payments, isLoading } = usePledgePayments(pledgeId);
  const updatePayment = useUpdatePledgePayment();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);

  const today = new Date();
  const in30Days = addDays(today, 30);

  const handleSkipPayment = async (paymentId: string) => {
    await updatePayment.mutateAsync({
      paymentId,
      status: 'skipped',
      notes: 'Skipped by user',
    });
  };

  const handleRecordPayment = (payment: any) => {
    setSelectedPayment(payment);
    setRecordPaymentOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Schedule</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))
            ) : (
              payments?.map((payment) => {
                const expectedDate = new Date(payment.expected_date);
                const isOverdue = payment.status === 'pending' && isBefore(expectedDate, today);
                const isUpcoming = payment.status === 'pending' && isAfter(expectedDate, today) && isBefore(expectedDate, in30Days);
                const config = statusConfig[isOverdue ? 'overdue' : payment.status];
                
                // Find next pending payment
                const isNext = payment.status === 'pending' && 
                  !payments.some(p => p.status === 'pending' && p.payment_number < payment.payment_number);

                return (
                  <div
                    key={payment.id}
                    className={cn(
                      "rounded-lg border p-4 space-y-2",
                      isOverdue && "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
                      isUpcoming && !isOverdue && "border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30",
                      isNext && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-full", config.bgColor)}>
                          <span className={config.color}>{config.icon}</span>
                        </div>
                        <div>
                          <p className="font-medium">
                            Payment #{payment.payment_number} of {totalPayments}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expected: {format(expectedDate, "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(payment.expected_amount)}</p>
                        <Badge className={cn(config.bgColor, config.color, "border-0")}>
                          {isOverdue ? 'Overdue' : PAYMENT_STATUS_LABELS[payment.status]}
                        </Badge>
                      </div>
                    </div>

                    {/* Paid Details */}
                    {payment.status === 'paid' && payment.actual_date && (
                      <div className="text-sm text-muted-foreground pt-2 border-t">
                        Paid: {format(new Date(payment.actual_date), "MMMM d, yyyy")} - {formatCurrency(payment.actual_amount)}
                      </div>
                    )}

                    {/* Actions for pending/overdue */}
                    {(payment.status === 'pending' || isOverdue) && (
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleRecordPayment(payment)}
                        >
                          Record Payment
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSkipPayment(payment.id)}
                          disabled={updatePayment.isPending}
                        >
                          Skip
                        </Button>
                      </div>
                    )}

                    {payment.notes && (
                      <p className="text-sm text-muted-foreground italic">{payment.notes}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedPayment && (
        <RecordPledgePaymentDialog
          open={recordPaymentOpen}
          onOpenChange={setRecordPaymentOpen}
          payment={selectedPayment}
          pledgeId={pledgeId}
          constituentId={constituentId}
          fundDesignation={fundDesignation}
          totalPayments={totalPayments}
        />
      )}
    </>
  );
}
