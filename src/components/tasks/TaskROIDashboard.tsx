import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { DollarSign, Clock, TrendingUp, Target } from "lucide-react";
import { useTaskROIByCategory, useTaskROIByUser, useTaskSummaryStats } from "@/hooks/useTaskROI";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#ff7c43"];

function SummaryCards({ stats }: { stats: ReturnType<typeof useTaskSummaryStats>["data"] }) {
  const cards = [
    { icon: Clock, label: "Time Invested", value: `${stats?.totalTimeHours || 0}h`, bg: "bg-blue-100", fg: "text-blue-600" },
    { icon: DollarSign, label: "Total Placement Fees", value: `$${stats?.totalOutcome?.toLocaleString() || 0}`, bg: "bg-green-100", fg: "text-green-600" },
    { icon: TrendingUp, label: "Revenue/Hour", value: `$${stats?.revenuePerHour?.toLocaleString() || 0}`, bg: "bg-purple-100", fg: "text-purple-600" },
    { icon: Target, label: "Placement Rate", value: `${stats?.conversionRate || 0}%`, bg: "bg-orange-100", fg: "text-orange-600" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map(({ icon: Icon, label, value, bg, fg }) => (
        <Card key={label}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${bg}`}>
                <Icon className={`h-6 w-6 ${fg}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CategoryChart({ data, isLoading }: { data: ReturnType<typeof useTaskROIByCategory>["data"]; isLoading: boolean }) {
  const chartData = data?.filter(c => c.task_category).map(c => ({
    name: c.task_category?.replace("_", " ") || "Unknown",
    revenuePerHour: c.revenue_per_hour || 0,
  })) || [];

  return (
    <Card>
      <CardHeader><CardTitle>ROI by Task Category</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-[300px] w-full" /> : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => [`$${Number(value).toFixed(0)}/hr`, "Revenue/Hour"]} />
              <Bar dataKey="revenuePerHour" fill="#8884d8" name="revenuePerHour" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No category data yet — assign categories and log time on tasks
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimeDistributionChart({ data, isLoading }: { data: ReturnType<typeof useTaskROIByCategory>["data"]; isLoading: boolean }) {
  const pieData = data?.filter(c => c.task_category && (c.total_time_invested || 0) > 0).map(c => ({
    name: c.task_category?.replace("_", " ") || "Unknown",
    value: Math.round((c.total_time_invested || 0) / 60),
  })) || [];

  return (
    <Card>
      <CardHeader><CardTitle>Time Investment by Category</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-[300px] w-full" /> : pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}h`, "Hours"]} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No time logged yet — use "Log Time" on tasks to track hours
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TeamPerformanceTable({ data, isLoading }: { data: ReturnType<typeof useTaskROIByUser>["data"]; isLoading: boolean }) {
  return (
    <Card>
      <CardHeader><CardTitle>Team ROI Performance</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-[200px] w-full" /> : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Team Member</th>
                  <th className="text-right p-3 font-medium">Tasks Completed</th>
                  <th className="text-right p-3 font-medium">Hours Invested</th>
                  <th className="text-right p-3 font-medium">Placement Fees</th>
                  <th className="text-right p-3 font-medium">Revenue/Hour</th>
                </tr>
              </thead>
              <tbody>
                {data.map((user) => (
                  <tr key={user.user_id} className="border-b hover:bg-muted/50">
                    <td className="p-3">{user.full_name}</td>
                    <td className="text-right p-3">{user.completed_tasks}</td>
                    <td className="text-right p-3">{Math.round((user.total_time_invested || 0) / 60)}h</td>
                    <td className="text-right p-3">${(user.total_outcome_amount || 0).toLocaleString()}</td>
                    <td className="text-right p-3 font-medium">${(user.revenue_per_hour || 0).toFixed(0)}/hr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No team data yet — assign tasks to team members to see performance
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TaskROIDashboard() {
  const { data: categoryROI, isLoading: loadingCategory } = useTaskROIByCategory();
  const { data: userROI, isLoading: loadingUser } = useTaskROIByUser();
  const { data: summaryStats, isLoading: loadingStats } = useTaskSummaryStats();

  if (loadingStats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-16" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SummaryCards stats={summaryStats} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryChart data={categoryROI} isLoading={loadingCategory} />
        <TimeDistributionChart data={categoryROI} isLoading={loadingCategory} />
      </div>
      <TeamPerformanceTable data={userROI} isLoading={loadingUser} />
    </div>
  );
}
