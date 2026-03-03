import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Package, TrendingUp, AlertCircle } from "lucide-react";
import { useRevenueByEvent, useRevenueByProgram } from "@/hooks/useRevenueReports";

export function RevenueReportsSection() {
  const { data: eventRevenue = [], isLoading: loadingEvents } = useRevenueByEvent();
  const { data: programRevenue = [], isLoading: loadingPrograms } = useRevenueByProgram();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const isLoading = loadingEvents || loadingPrograms;
  const hasData = eventRevenue.length > 0 || programRevenue.length > 0;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Revenue by Event
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Revenue by Program
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasData) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Revenue by Event */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Revenue by Event
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventRevenue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No event revenue recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {eventRevenue.slice(0, 5).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                    <span className="text-sm truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">{item.count} sales</span>
                    <span className="font-semibold text-sm">{formatCurrency(item.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue by Program */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Revenue by Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          {programRevenue.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No program revenue recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {programRevenue.slice(0, 5).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                    <span className="text-sm truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">{item.count} enrollments</span>
                    <span className="font-semibold text-sm">{formatCurrency(item.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
