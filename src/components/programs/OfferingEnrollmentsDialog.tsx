import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ProgramOffering, ProgramEnrollment, useProgramEnrollments, useUpdateProgramEnrollment } from "@/hooks/useProgramOfferings";
import { MoreHorizontal, Eye, XCircle, Users } from "lucide-react";
import { format } from "date-fns";

interface OfferingEnrollmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offering: ProgramOffering | null;
}

export function OfferingEnrollmentsDialog({ open, onOpenChange, offering }: OfferingEnrollmentsDialogProps) {
  const { data: enrollments = [], isLoading } = useProgramEnrollments(offering?.id || null);
  const updateEnrollment = useUpdateProgramEnrollment();
  const [selectedEnrollment, setSelectedEnrollment] = useState<ProgramEnrollment | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enrolled":
        return <Badge className="bg-green-100 text-green-800">Enrolled</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "waitlisted":
        return <Badge className="bg-blue-100 text-blue-800">Waitlisted</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case "completed":
        return <Badge className="bg-purple-100 text-purple-800">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCancelEnrollment = async () => {
    if (!selectedEnrollment) return;
    await updateEnrollment.mutateAsync({
      id: selectedEnrollment.id,
      status: "cancelled",
    });
    setShowCancelDialog(false);
    setSelectedEnrollment(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (!offering) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Enrollments - {offering.name}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading enrollments...</div>
          ) : enrollments.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No enrollments yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      {enrollment.enrollee_name || "N/A"}
                    </TableCell>
                    <TableCell>{enrollment.enrollee_email}</TableCell>
                    <TableCell>{formatCurrency(enrollment.amount)}</TableCell>
                    <TableCell>{getPaymentBadge(enrollment.payment_status)}</TableCell>
                    <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                    <TableCell>
                      {enrollment.enrollment_date
                        ? format(new Date(enrollment.enrollment_date), "MMM d, yyyy")
                        : format(new Date(enrollment.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedEnrollment(enrollment);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {enrollment.status !== "cancelled" && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEnrollment(enrollment);
                                setShowCancelDialog(true);
                              }}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Enrollment
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Enrollment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the enrollment for {selectedEnrollment?.enrollee_name || selectedEnrollment?.enrollee_email}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Enrollment</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelEnrollment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Enrollment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enrollment Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enrollment Details</DialogTitle>
          </DialogHeader>
          {selectedEnrollment && (
            <div className="space-y-4">
              {selectedEnrollment.confirmation_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Confirmation Number</p>
                  <p className="font-mono font-semibold">{selectedEnrollment.confirmation_number}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedEnrollment.enrollee_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedEnrollment.enrollee_email}</p>
                </div>
                {selectedEnrollment.enrollee_phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedEnrollment.enrollee_phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedEnrollment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  {getPaymentBadge(selectedEnrollment.payment_status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Enrollment Status</p>
                  {getStatusBadge(selectedEnrollment.status)}
                </div>
              </div>

              {selectedEnrollment.paid_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Paid At</p>
                  <p className="font-medium">
                    {format(new Date(selectedEnrollment.paid_at), "PPp")}
                  </p>
                </div>
              )}

              {selectedEnrollment.stripe_checkout_session_id && (
                <div>
                  <p className="text-sm text-muted-foreground">Stripe Checkout Session</p>
                  <p className="font-mono text-xs">{selectedEnrollment.stripe_checkout_session_id}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {format(new Date(selectedEnrollment.created_at), "PPp")}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
