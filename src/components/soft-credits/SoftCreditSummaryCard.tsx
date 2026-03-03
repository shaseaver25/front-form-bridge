import { useState } from 'react';
import { ChevronDown, ChevronUp, Award, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  useConstituentSoftCredits,
  CREDIT_TYPE_LABELS,
  CREDIT_TYPE_COLORS,
} from '@/hooks/useSoftCredits';
import { formatDistanceToNow } from 'date-fns';

interface SoftCreditSummaryCardProps {
  constituentId: string;
  totalSoftCreditAmount?: number;
  softCreditCount?: number;
  lastSoftCreditDate?: string | null;
}

export function SoftCreditSummaryCard({
  constituentId,
  totalSoftCreditAmount,
  softCreditCount,
  lastSoftCreditDate,
}: SoftCreditSummaryCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  const { data, isLoading } = useConstituentSoftCredits(constituentId);

  // Use database rollup values or calculated values
  const totalAmount = totalSoftCreditAmount ?? 
    (data?.credits.reduce((sum, c) => sum + Number(c.amount), 0) || 0);
  const count = softCreditCount ?? (data?.credits.length || 0);
  const lastDate = lastSoftCreditDate ?? data?.credits[0]?.created_at;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (count === 0 && !isLoading) {
    return null; // Don't show card if no soft credits
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="w-5 h-5" />
          Soft Credits Received
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : (
          <>
            {/* Total Amount */}
            <div>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(totalAmount)}
              </p>
              <p className="text-sm text-muted-foreground">
                from {count} {count === 1 ? 'gift' : 'gifts'}
              </p>
              {lastDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last credit:{' '}
                  {formatDistanceToNow(new Date(lastDate), { addSuffix: true })}
                </p>
              )}
            </div>

            {/* Breakdown by Type */}
            {data?.byType && Object.keys(data.byType).length > 0 && (
              <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span>Breakdown by Type</span>
                    {showBreakdown ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-2">
                  {Object.entries(data.byType).map(([type, { count, total }]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={CREDIT_TYPE_COLORS[type]}
                        >
                          {CREDIT_TYPE_LABELS[type] || type}
                        </Badge>
                        <span className="text-muted-foreground">({count})</span>
                      </div>
                      <span className="font-medium">{formatCurrency(total)}</span>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* View Details */}
            {data?.credits && data.credits.length > 0 && (
              <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    {showDetails ? 'Hide Details' : 'View Details'}
                    {showDetails ? (
                      <ChevronUp className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-2">
                  {data.credits.map((credit) => (
                    <div
                      key={credit.id}
                      className="flex items-center justify-between p-2 rounded border bg-muted/30"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${CREDIT_TYPE_COLORS[credit.credit_type]}`}
                          >
                            {CREDIT_TYPE_LABELS[credit.credit_type] || credit.credit_type}
                          </Badge>
                          <span className="font-medium">
                            {formatCurrency(Number(credit.amount))}
                          </span>
                        </div>
                        {credit.gift && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Gift of {formatCurrency(Number(credit.gift.amount))} on{' '}
                            {new Date(credit.gift.date_received).toLocaleDateString()}
                          </p>
                        )}
                        {credit.notes && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {credit.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
