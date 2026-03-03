import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  DollarSign,
  FileText,
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';

interface ReconciliationData {
  crm: {
    donationsTotal: number;
    donationsCount: number;
    pledgesTotal: number;
    pledgesCount: number;
    pledgesOutstanding: number;
  };
  quickbooks: {
    donationsTotal: number;
    invoicesTotal: number;
    invoicesOutstanding: number;
  };
  sync: {
    giftsSynced: number;
    giftsErrors: number;
    pledgesSynced: number;
    pledgesErrors: number;
  };
  discrepancies: {
    donations: number;
    donationsMatch: boolean;
    pledges: number;
    pledgesMatch: boolean;
  };
}

export function QBReconciliationTab() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['qb-reconciliation'],
    queryFn: async () => {
      const response = await supabase.functions.invoke('quickbooks-api', {
        body: { action: 'getReconciliationData' }
      });
      if (response.error) throw response.error;
      return response.data as ReconciliationData;
    },
    staleTime: 60000, // Cache for 1 minute
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Reconciliation data refreshed');
    } catch {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const hasDiscrepancies = data && (!data.discrepancies.donationsMatch || !data.discrepancies.pledgesMatch);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Financial Reconciliation</h3>
          <p className="text-sm text-muted-foreground">
            Compare CRM records with QuickBooks to identify discrepancies
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Alert */}
      {data && (
        <Card className={hasDiscrepancies ? 'border-yellow-500 bg-yellow-500/5' : 'border-green-500 bg-green-500/5'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {hasDiscrepancies ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-700">Discrepancies Detected</p>
                    <p className="text-sm text-yellow-600">
                      Some records may need attention. Review the details below.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-700">All Records Reconciled</p>
                    <p className="text-sm text-green-600">
                      CRM and QuickBooks data are in sync.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Donations Comparison */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Donations / Sales Receipts</CardTitle>
          </div>
          <CardDescription>
            Compare CRM gift records with QuickBooks Sales Receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* CRM Side */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">cM CRM</p>
              <p className="text-2xl font-bold">{formatCurrency(data?.crm.donationsTotal || 0)}</p>
              <p className="text-sm text-muted-foreground">
                {data?.crm.donationsCount || 0} donations
              </p>
            </div>

            {/* Arrow & Status */}
            <div className="flex flex-col items-center justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground mb-2" />
              {data?.discrepancies.donationsMatch ? (
                <Badge variant="default" className="gap-1 bg-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Matched
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  {formatCurrency(data?.discrepancies.donations || 0)} difference
                </Badge>
              )}
            </div>

            {/* QB Side */}
            <div className="space-y-2 text-right">
              <p className="text-sm font-medium text-muted-foreground">QuickBooks</p>
              <p className="text-2xl font-bold">{formatCurrency(data?.quickbooks.donationsTotal || 0)}</p>
              <p className="text-sm text-muted-foreground">
                Sales Receipts
              </p>
            </div>
          </div>

          {/* Sync Status */}
          <div className="mt-4 pt-4 border-t flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">{data?.sync.giftsSynced || 0} synced</span>
            </div>
            {(data?.sync.giftsErrors || 0) > 0 && (
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{data?.sync.giftsErrors} errors</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pledges Comparison */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Pledges / Invoices</CardTitle>
          </div>
          <CardDescription>
            Compare CRM pledges with QuickBooks Invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* CRM Side */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">cM CRM</p>
              <p className="text-2xl font-bold">{formatCurrency(data?.crm.pledgesTotal || 0)}</p>
              <p className="text-sm text-muted-foreground">
                {data?.crm.pledgesCount || 0} pledges
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(data?.crm.pledgesOutstanding || 0)} outstanding
              </p>
            </div>

            {/* Arrow & Status */}
            <div className="flex flex-col items-center justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground mb-2" />
              {data?.discrepancies.pledgesMatch ? (
                <Badge variant="default" className="gap-1 bg-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Matched
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" />
                  {formatCurrency(data?.discrepancies.pledges || 0)} difference
                </Badge>
              )}
            </div>

            {/* QB Side */}
            <div className="space-y-2 text-right">
              <p className="text-sm font-medium text-muted-foreground">QuickBooks</p>
              <p className="text-2xl font-bold">{formatCurrency(data?.quickbooks.invoicesTotal || 0)}</p>
              <p className="text-sm text-muted-foreground">
                Invoices
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(data?.quickbooks.invoicesOutstanding || 0)} outstanding
              </p>
            </div>
          </div>

          {/* Sync Status */}
          <div className="mt-4 pt-4 border-t flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">{data?.sync.pledgesSynced || 0} synced</span>
            </div>
            {(data?.sync.pledgesErrors || 0) > 0 && (
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{data?.sync.pledgesErrors} errors</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total CRM Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xl font-bold">
                {formatCurrency((data?.crm.donationsTotal || 0) + (data?.crm.pledgesTotal || 0))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total QB Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xl font-bold">
                {formatCurrency((data?.quickbooks.donationsTotal || 0) + (data?.quickbooks.invoicesTotal || 0))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Outstanding Balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-yellow-600" />
              <span className="text-xl font-bold">
                {formatCurrency(data?.crm.pledgesOutstanding || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net Discrepancy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {((data?.discrepancies.donations || 0) + (data?.discrepancies.pledges || 0)) === 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
              <span className="text-xl font-bold">
                {formatCurrency((data?.discrepancies.donations || 0) + (data?.discrepancies.pledges || 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
