import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { 
  Loader2, 
  CreditCard, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  CalendarIcon,
  RefreshCw,
  Send,
} from "lucide-react";
import { useGivebutterTransactions, useGivebutterSync } from "@/hooks/useGivebutter";
import { useQBConnection, useStartSync } from "@/hooks/useQuickBooks";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GivebutterTransaction {
  id: string;
  transacted_at: string;
  first_name: string;
  last_name: string;
  email: string;
  amount: number;
  payment_method: string | null;
  campaign_code: string | null;
  status: string;
  processing_status: string | null;
  processing_error: string | null;
  donation_id: string | null;
  constituent_id: string | null;
  quickbooks_synced?: boolean;
}

export function GivebutterTransactionLog() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [processingFilter, setProcessingFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [qbDialogOpen, setQbDialogOpen] = useState(false);
  const [sendingToQb, setSendingToQb] = useState(false);
  
  const { data: transactions, isLoading, refetch } = useGivebutterTransactions({
    status: statusFilter === "all" ? undefined : statusFilter,
    processingStatus: processingFilter === "all" ? undefined : processingFilter,
    dateFrom: dateFrom?.toISOString(),
    dateTo: dateTo?.toISOString(),
  });

  const { sync, syncing } = useGivebutterSync();
  const { data: qbConnection } = useQBConnection();
  const qbSync = useStartSync();

  const handleSyncTransactions = async () => {
    // Sync both transactions and recurring plans
    await sync("transactions");
    await sync("plans");
    refetch();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && transactions) {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleSendToQuickBooks = async () => {
    if (selectedIds.size === 0) return;
    
    setSendingToQb(true);
    try {
      // Get selected transaction IDs and send to QuickBooks
      const selectedTransactions = transactions?.filter((t) => selectedIds.has(t.id)) || [];
      
      await qbSync.mutateAsync({
        syncType: 'single_entity',
        direction: 'to_qb',
        entityTypes: ['donations'],
        entityIds: selectedTransactions.map((t) => t.donation_id).filter(Boolean) as string[],
      });
      
      setSelectedIds(new Set());
      setQbDialogOpen(false);
      toast.success(`${selectedIds.size} transactions sent to QuickBooks`);
    } catch (error) {
      toast.error("Failed to send to QuickBooks");
    } finally {
      setSendingToQb(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "succeeded":
        return <Badge className="bg-green-500">Succeeded</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "refunded":
        return <Badge variant="outline">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProcessingBadge = (status: string | null) => {
    switch (status) {
      case "processed":
        return <Badge variant="outline" className="text-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Processed</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string | null) => {
    switch (method) {
      case "card":
        return "💳";
      case "ach":
        return "🏦";
      case "paypal":
        return "🅿️";
      case "venmo":
        return "📱";
      case "apple_pay":
        return "🍎";
      case "google_pay":
        return "🔵";
      default:
        return "💰";
    }
  };

  const selectedTotal = transactions
    ?.filter((t) => selectedIds.has(t.id))
    .reduce((sum, t) => sum + t.amount, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Transaction Log
              </CardTitle>
              <CardDescription>
                View and manage imported transactions from Givebutter.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleSyncTransactions}
                disabled={syncing}
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync Transactions
              </Button>
              {qbConnection && selectedIds.size > 0 && (
                <Button onClick={() => setQbDialogOpen(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send to QuickBooks ({selectedIds.size})
                </Button>
              )}
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={processingFilter} onValueChange={setProcessingFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Processing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Processing</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
              </PopoverContent>
            </Popover>

            {(dateFrom || dateTo) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
              >
                Clear dates
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!transactions?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No transactions found.</p>
              <p className="text-sm mt-2">Click "Sync Transactions" to import from Givebutter.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {qbConnection && (
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={transactions.length > 0 && selectedIds.size === transactions.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead>Date</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processing</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    {qbConnection && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(tx.id)}
                          onCheckedChange={(checked) => handleSelectOne(tx.id, !!checked)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(tx.transacted_at), "MMM d, yyyy")}
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(tx.transacted_at), "h:mm a")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {tx.first_name} {tx.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {tx.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        ${tx.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span title={tx.payment_method || "Unknown"}>
                        {getPaymentMethodIcon(tx.payment_method)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {tx.campaign_code ? (
                        <Badge variant="outline">{tx.campaign_code}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getProcessingBadge(tx.processing_status)}
                        {tx.processing_error && (
                          <div className="text-xs text-destructive max-w-[200px] truncate" title={tx.processing_error}>
                            {tx.processing_error}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {tx.donation_id && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/donations/${tx.donation_id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {tx.constituent_id && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/constituents/${tx.constituent_id}`}>
                              View Donor
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* QuickBooks Confirmation Dialog */}
      <Dialog open={qbDialogOpen} onOpenChange={setQbDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to QuickBooks</DialogTitle>
            <DialogDescription>
              Create sales receipts in QuickBooks for the selected transactions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Transactions:</span>
                <p className="font-medium">{selectedIds.size}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Amount:</span>
                <p className="font-medium">${selectedTotal.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Each transaction will be created as a Sales Receipt in QuickBooks, 
              linked to the Contribution Income account.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQbDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendToQuickBooks} disabled={sendingToQb}>
              {sendingToQb && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send to QuickBooks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
