import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  CheckCircle,
  UserCheck,
  Clock,
  DollarSign,
  Search,
  Download,
  MoreHorizontal,
  Eye,
  XCircle,
} from "lucide-react";
import {
  useEventRegistrations,
  useUpdateRegistration,
  EventRegistration,
} from "@/hooks/useEventRegistrations";
import { RegistrationDetailDialog } from "./RegistrationDetailDialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface EventRegistrationsTabProps {
  eventId: string;
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

export function EventRegistrationsTab({ eventId }: EventRegistrationsTabProps) {
  const { data: registrations = [], isLoading } = useEventRegistrations(eventId);
  const updateRegistration = useUpdateRegistration();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedRegistration, setSelectedRegistration] = useState<EventRegistration | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [registrationToCancel, setRegistrationToCancel] = useState<EventRegistration | null>(null);

  // Stats
  const stats = useMemo(() => {
    return {
      total: registrations.length,
      confirmed: registrations.filter((r) => r.status === "confirmed").length,
      checkedIn: registrations.filter((r) => r.status === "checked_in").length,
      pendingPayment: registrations.filter((r) => r.payment_status === "pending").length,
      revenue: registrations
        .filter((r) => r.payment_status === "paid")
        .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0),
    };
  }, [registrations]);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        reg.registrant_name?.toLowerCase().includes(searchLower) ||
        reg.registrant_email.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === "all" || reg.status === statusFilter;

      // Payment filter
      const matchesPayment = paymentFilter === "all" || reg.payment_status === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [registrations, searchTerm, statusFilter, paymentFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleCheckIn = async (registration: EventRegistration) => {
    try {
      await updateRegistration.mutateAsync({
        id: registration.id,
        status: "checked_in",
        checked_in_at: new Date().toISOString(),
      });
      toast.success(`${registration.registrant_name || registration.registrant_email} checked in`);
    } catch (error) {
      console.error("Error checking in:", error);
      toast.error("Failed to check in");
    }
  };

  const handleViewDetails = (registration: EventRegistration) => {
    setSelectedRegistration(registration);
    setDetailDialogOpen(true);
  };

  const handleCancelClick = (registration: EventRegistration) => {
    setRegistrationToCancel(registration);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!registrationToCancel) return;
    try {
      await updateRegistration.mutateAsync({
        id: registrationToCancel.id,
        status: "cancelled",
      });
      toast.success("Registration cancelled");
    } catch (error) {
      console.error("Error cancelling:", error);
      toast.error("Failed to cancel registration");
    } finally {
      setCancelDialogOpen(false);
      setRegistrationToCancel(null);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Ticket Type",
      "Quantity",
      "Amount",
      "Payment Status",
      "Status",
      "Confirmation Number",
      "Registered Date",
    ];

    const rows = filteredRegistrations.map((reg) => [
      reg.registrant_name || "",
      reg.registrant_email,
      reg.registrant_phone || "",
      reg.ticket_type?.name || "",
      reg.quantity.toString(),
      reg.total_amount.toString(),
      reg.payment_status,
      reg.status,
      reg.confirmation_number || "",
      new Date(reg.created_at).toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `registrations-${eventId}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xl font-bold">{stats.confirmed}</p>
                <p className="text-xs text-muted-foreground">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xl font-bold">{stats.checkedIn}</p>
                <p className="text-xs text-muted-foreground">Checked In</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-xl font-bold">{stats.pendingPayment}</p>
                <p className="text-xs text-muted-foreground">Pending Payment</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-xl font-bold">{formatCurrency(stats.revenue)}</p>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="checked_in">Checked In</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payment</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Registrations Table */}
      {filteredRegistrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No registrations found</h3>
            <p className="text-muted-foreground">
              {registrations.length === 0
                ? "No one has registered for this event yet"
                : "No registrations match your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ticket Type</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegistrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-medium">
                    {reg.registrant_name || "—"}
                  </TableCell>
                  <TableCell>{reg.registrant_email}</TableCell>
                  <TableCell>{reg.ticket_type?.name || "—"}</TableCell>
                  <TableCell className="text-center">{reg.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(reg.total_amount))}
                  </TableCell>
                  <TableCell>
                    <Badge className={paymentStatusColors[reg.payment_status] || paymentStatusColors.pending}>
                      {reg.payment_status.charAt(0).toUpperCase() + reg.payment_status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[reg.status] || statusColors.pending}>
                      {reg.status === "checked_in"
                        ? "Checked In"
                        : reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(reg.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {reg.status === "confirmed" && (
                          <DropdownMenuItem onClick={() => handleCheckIn(reg)}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Check In
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleViewDetails(reg)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {reg.status !== "cancelled" && (
                          <DropdownMenuItem
                            onClick={() => handleCancelClick(reg)}
                            className="text-destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel Registration
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Dialog */}
      <RegistrationDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        registration={selectedRegistration}
      />

      {/* Cancel Confirmation */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel registration?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the registration for{" "}
              <strong>{registrationToCancel?.registrant_name || registrationToCancel?.registrant_email}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Registration</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Registration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
