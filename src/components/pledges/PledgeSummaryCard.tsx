import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HandCoins, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { usePledges, formatCurrency } from "@/hooks/usePledges";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface PledgeSummaryCardProps {
  constituentId: string;
}

export function PledgeSummaryCard({ constituentId }: PledgeSummaryCardProps) {
  const { data: pledges, isLoading } = usePledges({ 
    constituentId,
    status: ['active', 'partially_paid', 'pending']
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!pledges || pledges.length === 0) {
    return null;
  }

  const totalPledged = pledges.reduce((sum, p) => sum + (p.pledge_total_amount || 0), 0);
  const totalBalance = pledges.reduce((sum, p) => sum + (p.pledge_balance || 0), 0);
  
  // Find next payment due
  const pledgesWithNextPayment = pledges
    .filter(p => p.pledge_next_payment_date)
    .sort((a, b) => new Date(a.pledge_next_payment_date!).getTime() - new Date(b.pledge_next_payment_date!).getTime());
  
  const nextPayment = pledgesWithNextPayment[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <HandCoins className="h-4 w-4 text-primary" />
          Active Pledges
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{pledges.length}</p>
            <p className="text-xs text-muted-foreground">Pledges</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{formatCurrency(totalPledged)}</p>
            <p className="text-xs text-muted-foreground">Total Pledged</p>
          </div>
          <div>
            <p className={cn(
              "text-2xl font-bold",
              totalBalance > 0 ? "text-orange-600" : "text-green-600"
            )}>
              {formatCurrency(totalBalance)}
            </p>
            <p className="text-xs text-muted-foreground">Outstanding</p>
          </div>
        </div>

        {nextPayment && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="text-muted-foreground mb-1">Next Payment Due</p>
            <p className="font-medium">
              {format(new Date(nextPayment.pledge_next_payment_date!), "MMM d, yyyy")}
            </p>
          </div>
        )}

        <Button variant="outline" className="w-full" asChild>
          <Link to={`/pledges?constituent=${constituentId}`}>
            View All Pledges
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
