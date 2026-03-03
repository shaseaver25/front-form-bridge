import { useState } from "react";
import { Navigate } from "react-router-dom";
import { format } from "date-fns";
import { Shield, Star, Users, Calendar, Filter, Download, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useEmployeeFeedback, useEmployeeFeedbackStats, useFeedbackAdminCheck } from "@/hooks/useEmployeeFeedback";
import { usePoolMembers } from "@/hooks/usePoolMembers";
import type { FeedbackType, EvaluatorType } from "@/types/employee-feedback";
import { GenerateFeedbackLinkDialog } from "@/components/employee-feedback/GenerateFeedbackLinkDialog";
import Layout from "@/components/Layout";

export default function EmployeeFeedbackDashboard() {
  const { data: isAdmin, isLoading: checkingAdmin } = useFeedbackAdminCheck();
  const [employeeFilter, setEmployeeFilter] = useState<string>("");
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState<FeedbackType | "">("");
  const [evaluatorTypeFilter, setEvaluatorTypeFilter] = useState<EvaluatorType | "">("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const { data: stats, isLoading: loadingStats } = useEmployeeFeedbackStats();
  const { data: feedback, isLoading: loadingFeedback } = useEmployeeFeedback({
    employeeId: employeeFilter || undefined,
    feedbackType: feedbackTypeFilter || undefined,
    evaluatorType: evaluatorTypeFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const { data: poolMembers } = usePoolMembers();

  if (checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const getAverageRating = (ratings: { score: number }[]) => {
    if (!ratings || ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
  };

  const exportToCsv = () => {
    if (!feedback) return;
    const headers = ["Employee ID", "Feedback Type", "Evaluator Type", "Evaluator Name", "Event Name", "Event Date", "Average Rating", "Created At"];
    const rows = feedback.map((fb) => [
      fb.employee_id,
      fb.feedback_type,
      fb.evaluator_type,
      fb.evaluator_name,
      fb.event_name,
      fb.event_date,
      getAverageRating(fb.ratings || []).toFixed(2),
      fb.created_at,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const getEmployeeName = (employeeId: string) => {
    const member = poolMembers?.find((m) => m.id === employeeId);
    return member ? `${member.first_name} ${member.last_name}` : "Unknown";
  };

  return (
    <Layout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Employee Feedback Dashboard</h1>
            <p className="text-muted-foreground">Confidential performance reviews</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowLinkDialog(true)}>
            Generate Feedback Link
          </Button>
          <Button variant="outline" onClick={exportToCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalCount || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Employees Reviewed</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                {Object.keys(stats?.employeeStats || {}).length}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Overall Rating</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                {stats?.employeeStats
                  ? (
                      Object.values(stats.employeeStats).reduce((sum, s) => sum + s.averageRating, 0) /
                      Object.keys(stats.employeeStats).length
                    ).toFixed(1)
                  : "N/A"}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                {stats?.recentSubmissions?.length || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={employeeFilter || "all"} onValueChange={(v) => setEmployeeFilter(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All Employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {poolMembers?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={feedbackTypeFilter || "all"} onValueChange={(v) => setFeedbackTypeFilter(v === "all" ? "" : v as FeedbackType | "")}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="speaker">Speaker</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
              </SelectContent>
            </Select>
            <Select value={evaluatorTypeFilter || "all"} onValueChange={(v) => setEvaluatorTypeFilter(v === "all" ? "" : v as EvaluatorType | "")}>
              <SelectTrigger>
                <SelectValue placeholder="All Evaluators" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Evaluators</SelectItem>
                <SelectItem value="site_manager">Site Manager</SelectItem>
                <SelectItem value="audience">Audience</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Entries ({feedback?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingFeedback ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : feedback?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No feedback entries found
            </div>
          ) : (
            <div className="space-y-3">
              {feedback?.map((fb) => {
                const avgRating = getAverageRating(fb.ratings || []);
                const hasLowRating = fb.ratings?.some((r) => r.score <= 2);
                const isExpanded = expandedFeedback === fb.id;

                return (
                  <Collapsible key={fb.id} open={isExpanded} onOpenChange={() => setExpandedFeedback(isExpanded ? null : fb.id)}>
                    <div className={`border rounded-lg p-4 ${hasLowRating ? "border-destructive/50 bg-destructive/5" : ""}`}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {hasLowRating && <AlertTriangle className="h-5 w-5 text-destructive" />}
                            <div className="text-left">
                              <div className="font-medium">{getEmployeeName(fb.employee_id)}</div>
                              <div className="text-sm text-muted-foreground">
                                {fb.event_name} • {format(new Date(fb.event_date), "MMM d, yyyy")}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={fb.feedback_type === "speaker" ? "default" : "secondary"}>
                              {fb.feedback_type}
                            </Badge>
                            <Badge variant="outline">{fb.evaluator_type.replace("_", " ")}</Badge>
                            <div className="flex items-center gap-1">
                              <Star className={`h-4 w-4 ${avgRating >= 4 ? "text-yellow-500 fill-yellow-500" : avgRating <= 2 ? "text-destructive" : "text-muted-foreground"}`} />
                              <span className={avgRating <= 2 ? "text-destructive font-bold" : ""}>{avgRating.toFixed(1)}</span>
                            </div>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-4 pt-4 border-t space-y-4">
                          <div>
                            <div className="text-sm font-medium mb-2">Evaluator</div>
                            <div className="text-sm text-muted-foreground">
                              {fb.evaluator_name}
                              {fb.evaluator_email && ` (${fb.evaluator_email})`}
                            </div>
                          </div>
                          {fb.ratings && fb.ratings.length > 0 && (
                            <div>
                              <div className="text-sm font-medium mb-2">Ratings</div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {fb.ratings.map((rating) => (
                                  <div key={rating.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                    <span className="text-sm capitalize">{rating.category.replace(/_/g, " ")}</span>
                                    <div className="flex items-center gap-1">
                                      <Star className={`h-4 w-4 ${rating.score >= 4 ? "text-yellow-500 fill-yellow-500" : rating.score <= 2 ? "text-destructive" : "text-muted-foreground"}`} />
                                      <span className={rating.score <= 2 ? "text-destructive font-bold" : ""}>{rating.score}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {fb.comments && fb.comments.length > 0 && (
                            <div>
                              <div className="text-sm font-medium mb-2">Comments</div>
                              <div className="space-y-2">
                                {fb.comments.map((comment) => (
                                  <div key={comment.id} className="p-2 bg-muted rounded">
                                    <div className="text-xs font-medium text-muted-foreground capitalize mb-1">
                                      {comment.question_key.replace(/_/g, " ")}
                                    </div>
                                    <div className="text-sm">{comment.response}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Submitted: {format(new Date(fb.created_at), "MMM d, yyyy h:mm a")}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <GenerateFeedbackLinkDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        poolMembers={poolMembers || []}
      />
    </div>
    </Layout>
  );
}
