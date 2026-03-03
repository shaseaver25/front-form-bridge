import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TransactionDetailDialog } from "@/components/payments/TransactionDetailDialog";
import { RevenueReportsSection } from "@/components/payments/RevenueReportsSection";
import { usePaymentStats, usePaymentTransactions, useRevenueByMonth, PaymentTransaction, PaymentFilters } from "@/hooks/usePayments";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ExternalLink, DollarSign, CreditCard, Clock, XCircle, Search, CalendarDays, Package, Gift, Eye, AlertCircle } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export default function PaymentsPage() {
  const [filters, setFilters] = useState<PaymentFilters>({
    startDate: startOfDay(subDays(new Date(), 30)).toISOString(),
    endDate: endOfDay(new Date()).toISOString(),
    paymentType: "all",
    status: "all",
    search: "",
  });
  const [chartFilter, setChartFilter] = useState<"all" | "events" | "programs" | "donations">("all");
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);

  const { data: stats, isLoading: statsLoading } = usePaymentStats();
  const { data: transactions = [], isLoading: txLoading } = usePaymentTransactions(filters);
  const { data: revenueData = [], isLoading: chartLoading } = useRevenueByMonth(6);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "event_registration":
        return <CalendarDays className="h-4 w-4 text-blue-600" />;
      case "program_enrollment":
        return <Package className="h-4 w-4 text-purple-600" />;
      case "donation":
        return <Gift className="h-4 w-4 text-green-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "event_registration":
        return "Event";
      case "program_enrollment":
        return "Program";
      case "donation":
        return "Donation";
      default:
        return type;
    }
  };

  const getChartData = () => {
    if (chartFilter === "all") {
      return revenueData.map((d) => ({ month: d.month, Revenue: d.total }));
    }
    return revenueData.map((d) => ({
      month: d.month,
      Revenue: chartFilter === "events" ? d.events : chartFilter === "programs" ? d.programs : d.donations,
    }));
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground">Track all payment transactions</p>
          </div>
          <Button variant="outline" asChild>
            <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Stripe Dashboard
            </a>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(stats?.revenue || 0)}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.transactionCount || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.pendingCount || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.failedCount || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Revenue Over Time</CardTitle>
              <div className="flex gap-2">
                {(["all", "events", "programs", "donations"] as const).map((filter) => (
                  <Button
                    key={filter}
                    size="sm"
                    variant={chartFilter === filter ? "default" : "outline"}
                    onClick={() => setChartFilter(filter)}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(value) => `$${value / 1000}k`} className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Refund Note */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            To process refunds, please use the{" "}
            <a 
              href="https://dashboard.stripe.com/payments" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              Stripe Dashboard
            </a>
            . Refund status will automatically sync back here.
          </AlertDescription>
        </Alert>

        {/* Revenue Reports */}
        <RevenueReportsSection />
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email..."
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={filters.paymentType}
                onValueChange={(value) => setFilters((f) => ({ ...f, paymentType: value }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="event_registration">Event Registration</SelectItem>
                  <SelectItem value="program_enrollment">Program Enrollment</SelectItem>
                  <SelectItem value="donation">Donation</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((f) => ({ ...f, status: value }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="succeeded">Succeeded</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardContent className="pt-6">
            {txLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No payments yet</h3>
                <p className="text-sm text-muted-foreground">
                  Payments will appear here as they are processed.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm">
                        {format(new Date(tx.created_at), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(tx.payment_type)}
                          <span className="text-sm">{getTypeLabel(tx.payment_type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {tx.payer_name && (
                            <p className="font-medium text-sm">{tx.payer_name}</p>
                          )}
                          <p className="text-sm text-muted-foreground">{tx.payer_email || "N/A"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: tx.currency?.toUpperCase() || "USD",
                        }).format(tx.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedTransaction(tx)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionDetailDialog
        open={!!selectedTransaction}
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />
    </Layout>
  );
}
