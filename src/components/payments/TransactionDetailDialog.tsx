import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentTransaction } from "@/hooks/usePayments";
import { Copy, ExternalLink, Calendar, DollarSign, Mail, User, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface TransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: PaymentTransaction | null;
}

export function TransactionDetailDialog({ open, onOpenChange, transaction }: TransactionDetailDialogProps) {
  if (!transaction) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: transaction.currency?.toUpperCase() || "USD",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "succeeded":
        return <Badge className="bg-green-100 text-green-800">Succeeded</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "refunded":
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case "event_registration":
        return "Event Registration";
      case "program_enrollment":
        return "Program Enrollment";
      case "donation":
        return "Donation";
      default:
        return type;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaction Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount and Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(transaction.amount)}</p>
            </div>
            <div className="text-right">
              {getStatusBadge(transaction.status)}
            </div>
          </div>

          {/* Transaction Info */}
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(new Date(transaction.created_at), "PPpp")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{getPaymentTypeLabel(transaction.payment_type)}</p>
              </div>
            </div>

            {transaction.payer_email && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Payer Email</p>
                  <p className="font-medium">{transaction.payer_email}</p>
                </div>
              </div>
            )}

            {transaction.payer_name && (
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Payer Name</p>
                  <p className="font-medium">{transaction.payer_name}</p>
                </div>
              </div>
            )}
          </div>

          {/* Fee Breakdown */}
          {(transaction.stripe_fee || transaction.net_amount) && (
            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Fee Breakdown</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gross Amount</span>
                <span>{formatCurrency(transaction.amount)}</span>
              </div>
              {transaction.stripe_fee && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stripe Fee</span>
                  <span className="text-destructive">-{formatCurrency(transaction.stripe_fee)}</span>
                </div>
              )}
              {transaction.net_amount && (
                <div className="flex justify-between text-sm font-medium pt-2 border-t">
                  <span>Net Amount</span>
                  <span>{formatCurrency(transaction.net_amount)}</span>
                </div>
              )}
            </div>
          )}

          {/* Stripe IDs */}
          <div className="space-y-3">
            {transaction.stripe_payment_intent_id && (
              <div className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Payment Intent</p>
                  <p className="font-mono text-xs truncate">{transaction.stripe_payment_intent_id}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(transaction.stripe_payment_intent_id!)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}

            {transaction.stripe_checkout_session_id && (
              <div className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Checkout Session</p>
                  <p className="font-mono text-xs truncate">{transaction.stripe_checkout_session_id}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(transaction.stripe_checkout_session_id!)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Failure Reason */}
          {transaction.failure_reason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">Failure Reason</p>
              <p className="text-sm text-red-700">{transaction.failure_reason}</p>
            </div>
          )}

          {/* View in Stripe */}
          {transaction.stripe_payment_intent_id && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(`https://dashboard.stripe.com/payments/${transaction.stripe_payment_intent_id}`, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View in Stripe Dashboard
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
