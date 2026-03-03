import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, CreditCard, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { PLEDGE_STATUS_LABELS, FREQUENCY_LABELS, formatCurrency } from "@/hooks/usePledges";
import { cn } from "@/lib/utils";

interface PledgeDetailsCardProps {
  pledge: {
    id: string;
    pledge_total_amount: number;
    pledge_balance: number;
    pledge_status: string;
    pledge_frequency: string;
    pledge_start_date: string;
    pledge_end_date?: string;
    pledge_payment_count: number;
    pledge_next_payment_date?: string;
  };
  onViewSchedule?: () => void;
  onRecordPayment?: () => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  partially_paid: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  paid_in_full: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  written_off: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cancelled: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

export function PledgeDetailsCard({ pledge, onViewSchedule, onRecordPayment }: PledgeDetailsCardProps) {
  const paidAmount = pledge.pledge_total_amount - pledge.pledge_balance;
  const progressPercent = (paidAmount / pledge.pledge_total_amount) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Multi-Year Pledge
          </CardTitle>
          <Badge className={cn(statusColors[pledge.pledge_status])}>
            {PLEDGE_STATUS_LABELS[pledge.pledge_status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total and Balance */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Pledge Total</p>
            <p className="text-2xl font-bold">{formatCurrency(pledge.pledge_total_amount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className={cn(
              "text-2xl font-bold",
              pledge.pledge_balance === 0 ? "text-green-600" : "text-orange-600"
            )}>
              {formatCurrency(pledge.pledge_balance)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{formatCurrency(paidAmount)} paid</span>
            <span>{progressPercent.toFixed(0)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span>{FREQUENCY_LABELS[pledge.pledge_frequency]}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{pledge.pledge_payment_count} payments</span>
          </div>
        </div>

        {/* Date Range */}
        <div className="text-sm text-muted-foreground">
          {format(new Date(pledge.pledge_start_date), "MMM d, yyyy")}
          {pledge.pledge_end_date && (
            <> → {format(new Date(pledge.pledge_end_date), "MMM d, yyyy")}</>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onViewSchedule}>
            View Schedule
          </Button>
          {pledge.pledge_status !== 'paid_in_full' && pledge.pledge_status !== 'cancelled' && (
            <Button className="flex-1" onClick={onRecordPayment}>
              Record Payment
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
