import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HandCoins, Search, AlertCircle, Calendar, TrendingUp, Download } from "lucide-react";
import { format, isBefore } from "date-fns";
import { usePledges, PLEDGE_STATUS_LABELS, FREQUENCY_LABELS, formatCurrency } from "@/hooks/usePledges";
import { CreatePledgeDialog } from "@/components/pledges/CreatePledgeDialog";
import { PledgePaymentSchedule } from "@/components/pledges/PledgePaymentSchedule";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  partially_paid: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  paid_in_full: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  written_off: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cancelled: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

export default function Pledges() {
  const [searchParams] = useSearchParams();
  const constituentFilter = searchParams.get('constituent') || undefined;
  
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPledge, setSelectedPledge] = useState<any>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const { data: pledges, isLoading } = usePledges({
    status: statusFilter === "all" ? undefined : [statusFilter],
    constituentId: constituentFilter,
  });

  // Filter by search query
  const filteredPledges = pledges?.filter(pledge => {
    if (!searchQuery) return true;
    const constituentName = pledge.constituent?.full_legal_name?.toLowerCase() || '';
    return constituentName.includes(searchQuery.toLowerCase());
  });

  // Calculate summary stats
  const stats = {
    totalActive: filteredPledges?.filter(p => ['active', 'partially_paid'].includes(p.pledge_status || '')).reduce((sum, p) => sum + (p.pledge_total_amount || 0), 0) || 0,
    outstandingBalance: filteredPledges?.filter(p => ['active', 'partially_paid'].includes(p.pledge_status || '')).reduce((sum, p) => sum + (p.pledge_balance || 0), 0) || 0,
    overduePayments: 0, // Would need to query pledge_payments
    expectedThisMonth: 0, // Would need to query pledge_payments
  };

  const handleViewSchedule = (pledge: any) => {
    setSelectedPledge(pledge);
    setScheduleOpen(true);
  };

  const handleExport = () => {
    if (!filteredPledges) return;
    
    const csv = [
      ['Donor', 'Total Amount', 'Balance', 'Status', 'Frequency', 'Start Date', 'End Date', 'Payments'].join(','),
      ...filteredPledges.map(p => [
        `"${p.constituent?.full_legal_name || ''}"`,
        p.pledge_total_amount,
        p.pledge_balance,
        p.pledge_status,
        p.pledge_frequency,
        p.pledge_start_date,
        p.pledge_end_date || '',
        p.pledge_payment_count
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pledges-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <HandCoins className="h-8 w-8 text-primary" />
              Pledge Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage multi-year commitments and payment schedules
            </p>
          </div>
          <CreatePledgeDialog />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Active Pledges</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalActive)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                  <HandCoins className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.outstandingBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overdue Payments</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.overduePayments)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected This Month</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.expectedThisMonth)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by donor name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="paid_in_full">Paid in Full</SelectItem>
                  <SelectItem value="written_off">Written Off</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pledge List */}
        <Card>
          <CardHeader>
            <CardTitle>Pledges ({filteredPledges?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredPledges?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <HandCoins className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pledges found</p>
                <p className="text-sm">Create a new pledge to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPledges?.map((pledge) => {
                  const paidAmount = (pledge.pledge_total_amount || 0) - (pledge.pledge_balance || 0);
                  const progressPercent = ((paidAmount / (pledge.pledge_total_amount || 1)) * 100);
                  
                  return (
                    <div
                      key={pledge.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleViewSchedule(pledge)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-semibold text-primary">
                            {pledge.constituent?.full_legal_name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{pledge.constituent?.full_legal_name || 'Unknown'}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{FREQUENCY_LABELS[pledge.pledge_frequency || ''] || pledge.pledge_frequency}</span>
                            <span>•</span>
                            <span>{pledge.pledge_payment_count} payments</span>
                            {pledge.pledge_next_payment_date && (
                              <>
                                <span>•</span>
                                <span>Next: {format(new Date(pledge.pledge_next_payment_date), "MMM d")}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(pledge.pledge_total_amount || 0)}</p>
                          <p className={cn(
                            "text-sm",
                            (pledge.pledge_balance || 0) > 0 ? "text-orange-600" : "text-green-600"
                          )}>
                            {formatCurrency(pledge.pledge_balance || 0)} balance
                          </p>
                        </div>
                        <div className="w-24">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-center mt-1">
                            {progressPercent.toFixed(0)}% paid
                          </p>
                        </div>
                        <Badge className={cn(statusColors[pledge.pledge_status || ''])}>
                          {PLEDGE_STATUS_LABELS[pledge.pledge_status || ''] || pledge.pledge_status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Schedule Dialog */}
      {selectedPledge && (
        <PledgePaymentSchedule
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          pledgeId={selectedPledge.id}
          constituentId={selectedPledge.constituent_id}
          fundDesignation={selectedPledge.fund_designation}
          totalPayments={selectedPledge.pledge_payment_count}
        />
      )}
    </Layout>
  );
}
