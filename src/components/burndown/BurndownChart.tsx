import { useState } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { format, parseISO } from "date-fns";
import type { BurndownDataPoint } from "@/types/burndown";
import { formatCurrency } from "@/utils/burndown-calculations";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface BurndownChartProps {
  dataPoints: BurndownDataPoint[];
}

export function BurndownChart({ dataPoints }: BurndownChartProps) {
  const maxMonths = dataPoints.length;
  const [visibleMonths, setVisibleMonths] = useState(maxMonths);

  if (dataPoints.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No projection data available. Add income and expense entries to see the chart.
      </div>
    );
  }

  // Slice data points based on visible months
  const visibleDataPoints = dataPoints.slice(0, visibleMonths);

  // Format data for chart
  const chartData = visibleDataPoints.map((dp) => ({
    ...dp,
    monthLabel: format(parseISO(`${dp.date}-01`), "MMM ''yy"),
  }));

  // Find min value for Y axis (to show negative balances)
  const minBalance = Math.min(...visibleDataPoints.map(d => d.projectedBalance));
  const yAxisMin = minBalance < 0 ? Math.floor(minBalance / 10000) * 10000 : 0;

  return (
    <div className="space-y-4">
      {/* Time Range Slider */}
      <div className="flex items-center gap-4 px-2">
        <Label htmlFor="time-range" className="text-sm text-muted-foreground whitespace-nowrap">
          Time Range:
        </Label>
        <div className="flex-1 max-w-md">
          <Slider
            id="time-range"
            min={3}
            max={maxMonths}
            step={1}
            value={[visibleMonths]}
            onValueChange={(value) => setVisibleMonths(value[0])}
            className="w-full"
          />
        </div>
        <span className="text-sm font-medium text-foreground min-w-[80px]">
          {visibleMonths} months
        </span>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D7377" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#0D7377" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="confirmedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14919B" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#14919B" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            
            <XAxis 
              dataKey="monthLabel" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            
            <YAxis 
              tickFormatter={(value) => {
                if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                return `$${value}`;
              }}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              domain={[yAxisMin, 'auto']}
            />
            
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: '#0D7377', strokeWidth: 1, strokeDasharray: '5 5' }}
            />
            
            {/* Zero reference line */}
            <ReferenceLine 
              y={0} 
              stroke="#FF6B35" 
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: "$0", position: "right", fill: "#FF6B35", fontSize: 12 }}
            />
            
            {/* Confirmed balance (more conservative) */}
            <Area
              type="monotone"
              dataKey="confirmedBalance"
              stroke="#14919B"
              strokeWidth={1}
              strokeDasharray="3 3"
              fill="url(#confirmedGradient)"
              name="Confirmed"
            />
            
            {/* Projected balance (includes probability-weighted) */}
            <Area
              type="monotone"
              dataKey="projectedBalance"
              stroke="#0D7377"
              strokeWidth={2}
              fill="url(#balanceGradient)"
              name="Projected"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload as BurndownDataPoint & { monthLabel: string };

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-foreground mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Projected:</span>
          <span className={`font-medium ${data.projectedBalance >= 0 ? "text-[#0D7377]" : "text-red-600"}`}>
            {formatCurrency(data.projectedBalance)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Confirmed:</span>
          <span className="font-medium text-[#14919B]">
            {formatCurrency(data.confirmedBalance)}
          </span>
        </div>
        <hr className="my-2 border-border" />
        <div className="flex justify-between gap-4">
          <span className="text-green-600">Income:</span>
          <span className="text-green-600">+{formatCurrency(data.income)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-red-600">Expenses:</span>
          <span className="text-red-600">-{formatCurrency(data.expenses)}</span>
        </div>
      </div>
    </div>
  );
}
