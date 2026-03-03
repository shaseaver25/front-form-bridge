import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from "recharts";
import { format, parseISO } from "date-fns";
import type { BurndownDataPoint } from "@/types/burndown";
import { formatCurrency } from "@/utils/burndown-calculations";

interface CashFlowChartProps {
  dataPoints: BurndownDataPoint[];
}

export function CashFlowChart({ dataPoints }: CashFlowChartProps) {
  if (dataPoints.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No cash flow data available.
      </div>
    );
  }

  // Only show first 12 months for cash flow chart (more readable)
  const chartData = dataPoints.slice(0, 12).map((dp) => ({
    ...dp,
    monthLabel: format(parseISO(`${dp.date}-01`), "MMM ''yy"),
    netFlow: dp.income - dp.expenses,
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          
          <XAxis 
            dataKey="monthLabel" 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          
          <YAxis 
            tickFormatter={(value) => {
              if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
              if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
              return `$${value}`;
            }}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          
          <Tooltip content={<CashFlowTooltip />} />
          
          <Legend 
            wrapperStyle={{ paddingTop: 10 }}
            formatter={(value) => (
              <span className="text-sm text-muted-foreground">{value}</span>
            )}
          />
          
          <ReferenceLine y={0} stroke="#888" />
          
          <Bar 
            dataKey="income" 
            name="Income" 
            fill="#22c55e" 
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          
          <Bar 
            dataKey="expenses" 
            name="Expenses" 
            fill="#ef4444" 
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CashFlowTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  const netFlow = data.income - data.expenses;

  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-foreground mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-green-600">Income:</span>
          <span className="text-green-600 font-medium">{formatCurrency(data.income)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-red-600">Expenses:</span>
          <span className="text-red-600 font-medium">{formatCurrency(data.expenses)}</span>
        </div>
        <hr className="my-2 border-border" />
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Net:</span>
          <span className={`font-medium ${netFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
            {netFlow >= 0 ? "+" : ""}{formatCurrency(netFlow)}
          </span>
        </div>
      </div>
    </div>
  );
}
