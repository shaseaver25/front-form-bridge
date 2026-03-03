import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { DollarSign, Clock, TrendingUp, Target } from "lucide-react";
import { useTaskROIByCategory, useTaskROIByUser, useTaskSummaryStats } from "@/hooks/useTaskROI";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#ff7c43"];

export function TaskROIDashboard() {
  const { data: categoryROI, isLoading: loadingCategory } = useTaskROIByCategory();
  const { data: userROI, isLoading: loadingUser } = useTaskROIByUser();
  const { data: summaryStats, isLoading: loadingStats } = useTaskSummaryStats();

  if (loadingStats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const categoryChartData = categoryROI?.filter(c => c.task_category).map(c => ({
    name: c.task_category?.replace("_", " ") || "Unknown",
    hours: Math.round((c.total_time_invested || 0) / 60),
    outcomes: c.total_outcome_amount || 0,
    revenuePerHour: c.revenue_per_hour || 0,
  })) || [];

  const pieData = categoryROI?.filter(c => c.task_category && (c.total_time_invested || 0) > 0).map(c => ({
    name: c.task_category?.replace("_", " ") || "Unknown",
    value: Math.round((c.total_time_invested || 0) / 60),
  })) || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Invested</p>
                <p className="text-2xl font-bold">{summaryStats?.totalTimeHours || 0}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Outcomes</p>
                <p className="text-2xl font-bold">
                  ${summaryStats?.totalOutcome?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue/Hour</p>
                <p className="text-2xl font-bold">
                  ${summaryStats?.revenuePerHour?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Outcome Rate</p>
                <p className="text-2xl font-bold">{summaryStats?.conversionRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROI by Category */}
        <Card>
          <CardHeader>
            <CardTitle>ROI by Task Category</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCategory ? (
              <Skeleton className="h-[300px] w-full" />
            ) : categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === "revenuePerHour") return [`$${Number(value).toFixed(0)}/hr`, "Revenue/Hour"];
                      if (name === "outcomes") return [`$${Number(value).toLocaleString()}`, "Total Outcomes"];
                      if (name === "hours") return [`${value}h`, "Hours"];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="revenuePerHour" fill="#8884d8" name="revenuePerHour" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Time Investment by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCategory ? (
              <Skeleton className="h-[300px] w-full" />
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}h`, "Hours"]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No time logged yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Team ROI Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUser ? (
            <Skeleton className="h-[200px] w-full" />
          ) : userROI && userROI.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Team Member</th>
                    <th className="text-right p-3 font-medium">Tasks Completed</th>
                    <th className="text-right p-3 font-medium">Hours Invested</th>
                    <th className="text-right p-3 font-medium">Outcomes Generated</th>
                    <th className="text-right p-3 font-medium">Revenue/Hour</th>
                  </tr>
                </thead>
                <tbody>
                  {userROI.map((user) => (
                    <tr key={user.user_id} className="border-b hover:bg-muted/50">
                      <td className="p-3">{user.full_name}</td>
                      <td className="text-right p-3">{user.completed_tasks}</td>
                      <td className="text-right p-3">
                        {Math.round((user.total_time_invested || 0) / 60)}h
                      </td>
                      <td className="text-right p-3">
                        ${(user.total_outcome_amount || 0).toLocaleString()}
                      </td>
                      <td className="text-right p-3 font-medium">
                        ${(user.revenue_per_hour || 0).toFixed(0)}/hr
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No team data available yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
