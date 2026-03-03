import { useState } from "react";
import { RefreshCw, AlertTriangle, AlertCircle, Wallet, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useBurndownDashboardData } from "@/hooks/useBurndownData";
import { useBurndownSync } from "@/hooks/useBurndownSync";
import { 
  calculateBurndownProjection, 
  calculateBurndownSummary,
  formatCurrency,
  formatRunway,
  getRunwayStatusColor,
  PROJECTION_MONTHS
} from "@/utils/burndown-calculations";
import { BurndownChart } from "./BurndownChart";
import { CashFlowChart } from "./CashFlowChart";
import { UpdateBalanceDialog } from "./UpdateBalanceDialog";
import type { BurndownIncomeEntry, BurndownExpenseEntry } from "@/types/burndown";
import type { FiscalYearFilter } from "@/pages/BurndownCalculator";

interface BurndownDashboardProps {
  orgId: string;
  fiscalYearFilter?: FiscalYearFilter | null;
}

export function BurndownDashboard({ orgId, fiscalYearFilter }: BurndownDashboardProps) {
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  
  const { 
    incomeEntries, 
    expenseEntries, 
    latestSnapshot,
    isLoading 
  } = useBurndownDashboardData(orgId);
  
  const { runSync, isSyncing, syncStatus } = useBurndownSync(orgId);

  // Filter entries by fiscal year
  const filteredIncomeEntries = fiscalYearFilter
    ? incomeEntries.filter((entry) => {
        const entryDate = entry.expected_date;
        return entryDate >= fiscalYearFilter.startDate && entryDate <= fiscalYearFilter.endDate;
      })
    : incomeEntries;

  const filteredExpenseEntries = fiscalYearFilter
    ? expenseEntries.filter((entry) => {
        const entryDate = entry.due_date;
        return entryDate >= fiscalYearFilter.startDate && entryDate <= fiscalYearFilter.endDate;
      })
    : expenseEntries;

  // Calculate projections
  const currentBalance = latestSnapshot?.actual_balance ?? 0;
  const burnRateOverride = latestSnapshot?.monthly_burn_override ?? undefined;
  
  const dataPoints = calculateBurndownProjection(
    currentBalance,
    filteredIncomeEntries as BurndownIncomeEntry[],
    filteredExpenseEntries as BurndownExpenseEntry[],
    PROJECTION_MONTHS,
    burnRateOverride
  );
  const summary = calculateBurndownSummary(
    dataPoints, 
    currentBalance, 
    burnRateOverride,
    expenseEntries as BurndownExpenseEntry[]
  );

  // Determine alert level
  const showDangerAlert = summary.monthsOfRunway < 3 && summary.monthsOfRunway < 999;
  const showWarningAlert = summary.monthsOfRunway >= 3 && summary.monthsOfRunway < 6;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Sync Button Row */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {syncStatus && (
            <span>
              Synced: {syncStatus.donationsCount} donations, {syncStatus.grantsCount} grants, {syncStatus.expensesCount} expenses
              {syncStatus.lastSyncedAt && (
                <> · Last sync: {new Date(syncStatus.lastSyncedAt).toLocaleDateString()}</>
              )}
            </span>
          )}
        </div>
        <Button 
          variant="outline" 
          onClick={runSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Sync from CRM"}
        </Button>
      </div>

      {/* Alert Banner */}
      {showDangerAlert && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Critical: Low Runway</AlertTitle>
          <AlertDescription>
            Your projected runway is {formatRunway(summary.monthsOfRunway)}. 
            Consider reviewing expenses or accelerating fundraising immediately.
          </AlertDescription>
        </Alert>
      )}
      {showWarningAlert && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertTitle className="text-orange-700 dark:text-orange-400">Warning: Limited Runway</AlertTitle>
          <AlertDescription className="text-orange-600 dark:text-orange-300">
            Your projected runway is {formatRunway(summary.monthsOfRunway)}. 
            Consider reviewing expenses or accelerating fundraising.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Balance */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Current Cash Balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latestSnapshot ? (
              <>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(currentBalance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  As of {new Date(latestSnapshot.snapshot_date).toLocaleDateString()}
                </p>
              </>
            ) : (
              <div className="text-muted-foreground">
                <p className="text-sm mb-2">No balance set</p>
              </div>
            )}
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm text-[#14919B]"
              onClick={() => setBalanceDialogOpen(true)}
            >
              {latestSnapshot ? "Update Balance" : "Set Initial Balance"}
            </Button>
          </CardContent>
        </Card>

        {/* Runway */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Runway
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRunwayStatusColor(summary.monthsOfRunway)}`}>
              {formatRunway(summary.monthsOfRunway)}
            </div>
            {summary.projectedRunoutDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Runs out: {summary.projectedRunoutDate}
              </p>
            )}
            {summary.monthsOfRunway >= 999 && (
              <p className="text-xs text-green-600 mt-1">
                Income exceeds expenses
              </p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Burn Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Monthly Burn Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(latestSnapshot?.monthly_burn_override ?? summary.averageMonthlyBurn)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {latestSnapshot?.monthly_burn_override != null 
                ? "Manual override" 
                : "Avg from QuickBooks"}
            </p>
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm text-[#14919B]"
              onClick={() => setBalanceDialogOpen(true)}
            >
              Edit
            </Button>
          </CardContent>
        </Card>

        {/* Net Monthly Change */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Monthly Net Change
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netMonthlyChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {summary.netMonthlyChange >= 0 ? "+" : ""}{formatCurrency(summary.netMonthlyChange)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Income: {formatCurrency(summary.averageMonthlyIncome)}/mo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Burndown Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cash Balance Projection</CardTitle>
            <CardDescription>
              Projected balance over the next {PROJECTION_MONTHS} months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BurndownChart dataPoints={dataPoints} />
          </CardContent>
        </Card>

        {/* Cash Flow Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Cash Flow</CardTitle>
            <CardDescription>
              Income vs expenses by month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CashFlowChart dataPoints={dataPoints} />
          </CardContent>
        </Card>
      </div>

      {/* Update Balance Dialog */}
      <UpdateBalanceDialog 
        open={balanceDialogOpen}
        onOpenChange={setBalanceDialogOpen}
        orgId={orgId}
        currentBalance={currentBalance}
        currentBurnOverride={latestSnapshot?.monthly_burn_override}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
