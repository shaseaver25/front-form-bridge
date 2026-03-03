import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EventRegistration } from "@/hooks/useEventRegistrations";
import { format } from "date-fns";

interface RegistrationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registration: EventRegistration | null;
}

const paymentStatusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  checked_in: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function RegistrationDetailDialog({
  open,
  onOpenChange,
  registration,
}: RegistrationDetailDialogProps) {
  if (!registration) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return format(new Date(dateStr), "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registration Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Confirmation Number */}
          {registration.confirmation_number && (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Confirmation Number</p>
              <p className="text-2xl font-mono font-bold tracking-wider">
                {registration.confirmation_number}
              </p>
            </div>
          )}

          {/* Status Badges */}
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge className={statusColors[registration.status] || statusColors.pending}>
                {registration.status === "checked_in"
                  ? "Checked In"
                  : registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Payment</p>
              <Badge className={paymentStatusColors[registration.payment_status] || paymentStatusColors.pending}>
                {registration.payment_status.charAt(0).toUpperCase() + registration.payment_status.slice(1)}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Registrant Info */}
          <div>
            <h3 className="text-sm font-medium mb-3">Registrant Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{registration.registrant_name || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{registration.registrant_email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{registration.registrant_phone || "—"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Ticket Details */}
          <div>
            <h3 className="text-sm font-medium mb-3">Ticket Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Ticket Type</p>
                <p className="font-medium">{registration.ticket_type?.name || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p className="font-medium">{registration.quantity}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Unit Price</p>
                <p className="font-medium">{formatCurrency(Number(registration.unit_price))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-medium text-lg">{formatCurrency(Number(registration.total_amount))}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Info */}
          <div>
            <h3 className="text-sm font-medium mb-3">Payment Information</h3>
            <div className="space-y-2 text-sm">
              {registration.paid_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid At</span>
                  <span className="font-medium">{formatDateTime(registration.paid_at)}</span>
                </div>
              )}
              {registration.stripe_checkout_session_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Checkout Session</span>
                  <span className="font-mono text-xs">{registration.stripe_checkout_session_id.slice(0, 20)}...</span>
                </div>
              )}
              {registration.stripe_payment_intent_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Intent</span>
                  <span className="font-mono text-xs">{registration.stripe_payment_intent_id.slice(0, 20)}...</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-medium mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registered</span>
                <span className="font-medium">{formatDateTime(registration.created_at)}</span>
              </div>
              {registration.paid_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Received</span>
                  <span className="font-medium">{formatDateTime(registration.paid_at)}</span>
                </div>
              )}
              {registration.checked_in_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Checked In</span>
                  <span className="font-medium">{formatDateTime(registration.checked_in_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {registration.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{registration.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
