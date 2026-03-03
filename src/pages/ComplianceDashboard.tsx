import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Calendar, TrendingUp, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, isBefore, addDays, isWithinInterval } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface GrantDetail {
  id: string;
  title: string;
  requested_amount: number;
  awarded_amount: number;
}

interface GrantStatus {
  status_stage: string;
  current_fy_count: number;
  current_fy_requested: number;
  current_fy_awarded: number;
  current_fy_grants: GrantDetail[];
  last_fy_count: number;
  last_fy_requested: number;
  last_fy_awarded: number;
  last_fy_grants: GrantDetail[];
  total_count: number;
  total_requested: number;
  total_awarded: number;
  total_grants: GrantDetail[];
}

interface FiscalYearStats {
  current_fy_awarded: number;
  current_fy_count: number;
  last_fy_awarded: number;
  last_fy_count: number;
  total_awarded: number;
  total_count: number;
}

interface UpcomingDeadline {
  id: string;
  title: string;
  submission_deadline: string;
  compliance_reporting_deadline: string | null;
  status_stage: string;
  days_until_deadline: number;
}

interface PledgeAging {
  id: string;
  constituent_name: string;
  expected_amount: number;
  expected_date: string | null;
  stage: string;
  days_in_stage: number;
}

const ComplianceDashboard = () => {
  const [grantStatus, setGrantStatus] = useState<GrantStatus[]>([]);
  const [fiscalYearStats, setFiscalYearStats] = useState<FiscalYearStats>({
    current_fy_awarded: 0,
    current_fy_count: 0,
    last_fy_awarded: 0,
    last_fy_count: 0,
    total_awarded: 0,
    total_count: 0,
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [pledgeAging, setPledgeAging] = useState<PledgeAging[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStatus, setExpandedStatus] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Define fiscal year periods
  const currentFYStart = new Date('2025-07-01');
  const currentFYEnd = new Date('2026-06-30');
  const lastFYStart = new Date('2024-07-01');
  const lastFYEnd = new Date('2025-06-30');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch Grant Status breakdown
      const { data: grants, error: grantsError } = await supabase
        .from("grant_opportunities")
        .select("id, title, status_stage, requested_amount, awarded_amount, decision_date, contract_date, created_at");

      if (grantsError) throw grantsError;

      // Aggregate grant status data with fiscal year breakdowns
      const statusMap = new Map<string, GrantStatus>();
      const fyStats: FiscalYearStats = {
        current_fy_awarded: 0,
        current_fy_count: 0,
        last_fy_awarded: 0,
        last_fy_count: 0,
        total_awarded: 0,
        total_count: 0,
      };

      grants?.forEach((grant) => {
        const existing = statusMap.get(grant.status_stage) || {
          status_stage: grant.status_stage,
          current_fy_count: 0,
          current_fy_requested: 0,
          current_fy_awarded: 0,
          current_fy_grants: [],
          last_fy_count: 0,
          last_fy_requested: 0,
          last_fy_awarded: 0,
          last_fy_grants: [],
          total_count: 0,
          total_requested: 0,
          total_awarded: 0,
          total_grants: [],
        };

        // Determine the relevant date for fiscal year classification
        const relevantDate = grant.decision_date ? new Date(grant.decision_date) : 
                            grant.contract_date ? new Date(grant.contract_date) :
                            grant.created_at ? new Date(grant.created_at) : null;

        const requestedAmount = Number(grant.requested_amount || 0);
        const awardedAmount = Number(grant.awarded_amount || 0);

        const grantDetail: GrantDetail = {
          id: grant.id,
          title: grant.title,
          requested_amount: requestedAmount,
          awarded_amount: awardedAmount,
        };

        // Total (all time)
        existing.total_count += 1;
        existing.total_requested += requestedAmount;
        existing.total_awarded += awardedAmount;
        existing.total_grants.push(grantDetail);

        if (relevantDate) {
          // Current FY (July 1, 2025 - June 30, 2026)
          if (isWithinInterval(relevantDate, { start: currentFYStart, end: currentFYEnd })) {
            existing.current_fy_count += 1;
            existing.current_fy_requested += requestedAmount;
            existing.current_fy_awarded += awardedAmount;
            existing.current_fy_grants.push(grantDetail);
          }
          
          // Last FY (July 1, 2024 - June 30, 2025)
          if (isWithinInterval(relevantDate, { start: lastFYStart, end: lastFYEnd })) {
            existing.last_fy_count += 1;
            existing.last_fy_requested += requestedAmount;
            existing.last_fy_awarded += awardedAmount;
            existing.last_fy_grants.push(grantDetail);
          }
        }

        statusMap.set(grant.status_stage, existing);

        // Calculate fiscal year stats for awarded grants only
        if (grant.status_stage === 'awarded' && awardedAmount > 0) {
          fyStats.total_awarded += awardedAmount;
          fyStats.total_count += 1;

          if (relevantDate) {
            if (isWithinInterval(relevantDate, { start: currentFYStart, end: currentFYEnd })) {
              fyStats.current_fy_awarded += awardedAmount;
              fyStats.current_fy_count += 1;
            }
            
            if (isWithinInterval(relevantDate, { start: lastFYStart, end: lastFYEnd })) {
              fyStats.last_fy_awarded += awardedAmount;
              fyStats.last_fy_count += 1;
            }
          }
        }
      });
      
      setGrantStatus(Array.from(statusMap.values()));
      setFiscalYearStats(fyStats);

      // Fetch Upcoming Deadlines (next 60 days)
      const today = new Date();
      const sixtyDaysFromNow = addDays(today, 60);

      const { data: deadlineGrants, error: deadlinesError } = await supabase
        .from("grant_opportunities")
        .select("id, title, submission_deadline, compliance_reporting_deadline, status_stage, created_at")
        .or(`submission_deadline.lte.${format(sixtyDaysFromNow, "yyyy-MM-dd")},compliance_reporting_deadline.lte.${format(sixtyDaysFromNow, "yyyy-MM-dd")}`)
        .order("submission_deadline", { ascending: true, nullsFirst: false });

      if (deadlinesError) throw deadlinesError;

      const deadlinesWithDays = deadlineGrants
        ?.map((grant) => {
          const submissionDate = grant.submission_deadline ? new Date(grant.submission_deadline) : null;
          const complianceDate = grant.compliance_reporting_deadline ? new Date(grant.compliance_reporting_deadline) : null;
          
          // Use the earliest upcoming deadline
          let nextDeadline = submissionDate;
          if (complianceDate && (!nextDeadline || isBefore(complianceDate, nextDeadline))) {
            nextDeadline = complianceDate;
          }

          return {
            ...grant,
            days_until_deadline: nextDeadline ? differenceInDays(nextDeadline, today) : 999,
          };
        })
        .filter((grant) => grant.days_until_deadline >= 0)
        .sort((a, b) => a.days_until_deadline - b.days_until_deadline)
        .slice(0, 10) || [];

      setUpcomingDeadlines(deadlinesWithDays);

      // Fetch Pledge Aging (Major Gifts not yet received)
      const { data: pledges, error: pledgesError } = await supabase
        .from("major_gift_opportunities")
        .select(`
          id,
          expected_amount,
          expected_date,
          stage,
          created_at,
          constituents (
            full_legal_name
          )
        `)
        .in("stage", ["qualification", "cultivation", "solicitation"]);

      if (pledgesError) throw pledgesError;

      const pledgesWithAging = pledges?.map((pledge) => {
        const constituent = Array.isArray(pledge.constituents) ? pledge.constituents[0] : pledge.constituents;
        return {
          id: pledge.id,
          constituent_name: constituent?.full_legal_name || "Unknown",
          expected_amount: pledge.expected_amount || 0,
          expected_date: pledge.expected_date,
          stage: pledge.stage,
          days_in_stage: differenceInDays(today, new Date(pledge.created_at)),
        };
      }) || [];

      setPledgeAging(pledgesWithAging.sort((a, b) => b.days_in_stage - a.days_in_stage).slice(0, 10));

    } catch (error: unknown) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      prospecting: "bg-blue-500",
      in_progress: "bg-yellow-500",
      submitted: "bg-purple-500",
      awarded: "bg-green-500",
      declined: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getUrgencyBadge = (days: number) => {
    if (days <= 7) return <Badge variant="destructive">Urgent</Badge>;
    if (days <= 30) return <Badge className="bg-yellow-500">Soon</Badge>;
    return <Badge variant="outline">Upcoming</Badge>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Funding Stream Compliance & Deadline Tracker</h1>
          <p className="text-muted-foreground mt-2">
            Monitor grant status, upcoming deadlines, and pledge pipeline
          </p>
        </div>

        {/* Awarded Grants by Fiscal Year */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Awarded Grants by Fiscal Year
            </CardTitle>
            <CardDescription>Grants awarded by fiscal year period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Fiscal Year */}
              <div className="p-4 border rounded-lg space-y-2 bg-green-50 dark:bg-green-950">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Current FY</span>
                  <Badge variant="default">Jul 2025 - Jun 2026</Badge>
                </div>
                <div className="text-2xl font-bold text-green-600">{fiscalYearStats.current_fy_count}</div>
                <div className="text-sm text-muted-foreground">
                  <div className="text-green-600 font-semibold">${fiscalYearStats.current_fy_awarded.toLocaleString()}</div>
                </div>
              </div>

              {/* Last Fiscal Year */}
              <div className="p-4 border rounded-lg space-y-2 bg-blue-50 dark:bg-blue-950">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Last FY</span>
                  <Badge variant="secondary">Jul 2024 - Jun 2025</Badge>
                </div>
                <div className="text-2xl font-bold text-blue-600">{fiscalYearStats.last_fy_count}</div>
                <div className="text-sm text-muted-foreground">
                  <div className="text-blue-600 font-semibold">${fiscalYearStats.last_fy_awarded.toLocaleString()}</div>
                </div>
              </div>

              {/* Total */}
              <div className="p-4 border rounded-lg space-y-2 bg-purple-50 dark:bg-purple-950">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total (All Time)</span>
                  <Badge variant="outline">All Years</Badge>
                </div>
                <div className="text-2xl font-bold text-purple-600">{fiscalYearStats.total_count}</div>
                <div className="text-sm text-muted-foreground">
                  <div className="text-purple-600 font-semibold">${fiscalYearStats.total_awarded.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grant Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Grant Status Overview by Fiscal Year
            </CardTitle>
            <CardDescription>Breakdown of grants by stage and fiscal year period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {grantStatus.map((status) => (
                <Collapsible 
                  key={status.status_stage}
                  open={expandedStatus[status.status_stage]}
                  onOpenChange={(open) => setExpandedStatus(prev => ({ ...prev, [status.status_stage]: open }))}
                >
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${getStatusColor(status.status_stage)}`} />
                        <span className="font-semibold text-lg capitalize">{status.status_stage.replace("_", " ")}</span>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {expandedStatus[status.status_stage] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="ml-2">View Grants</span>
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Current FY */}
                      <div className="p-3 bg-green-50 dark:bg-green-950 rounded border">
                        <div className="text-xs text-muted-foreground mb-1">Current FY (Jul 2025 - Jun 2026)</div>
                        <div className="text-xl font-bold">{status.current_fy_count}</div>
                        <div className="text-xs space-y-0.5 mt-1">
                          <div>Requested: ${status.current_fy_requested.toLocaleString()}</div>
                          {status.current_fy_awarded > 0 && (
                            <div className="text-green-600 font-medium">Awarded: ${status.current_fy_awarded.toLocaleString()}</div>
                          )}
                        </div>
                      </div>

                      {/* Last FY */}
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded border">
                        <div className="text-xs text-muted-foreground mb-1">Last FY (Jul 2024 - Jun 2025)</div>
                        <div className="text-xl font-bold">{status.last_fy_count}</div>
                        <div className="text-xs space-y-0.5 mt-1">
                          <div>Requested: ${status.last_fy_requested.toLocaleString()}</div>
                          {status.last_fy_awarded > 0 && (
                            <div className="text-blue-600 font-medium">Awarded: ${status.last_fy_awarded.toLocaleString()}</div>
                          )}
                        </div>
                      </div>

                      {/* Total */}
                      <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded border">
                        <div className="text-xs text-muted-foreground mb-1">Total (All Time)</div>
                        <div className="text-xl font-bold">{status.total_count}</div>
                        <div className="text-xs space-y-0.5 mt-1">
                          <div>Requested: ${status.total_requested.toLocaleString()}</div>
                          {status.total_awarded > 0 && (
                            <div className="text-purple-600 font-medium">Awarded: ${status.total_awarded.toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <CollapsibleContent className="space-y-3 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Current FY Grants */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-green-700 dark:text-green-400">Current FY Grants:</div>
                          {status.current_fy_grants.length > 0 ? (
                            <div className="space-y-1">
                              {status.current_fy_grants.map((grant) => (
                                <div key={grant.id} className="text-xs p-2 bg-white dark:bg-gray-800 rounded border">
                                  <Link 
                                    to="/grants" 
                                    state={{ selectedGrantId: grant.id }}
                                    className="font-medium truncate text-primary hover:underline block"
                                  >
                                    {grant.title}
                                  </Link>
                                  <div className="text-muted-foreground">
                                    Requested: ${grant.requested_amount.toLocaleString()}
                                    {grant.awarded_amount > 0 && (
                                      <span className="text-green-600 ml-2">
                                        Awarded: ${grant.awarded_amount.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground italic">No grants in this period</div>
                          )}
                        </div>

                        {/* Last FY Grants */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-blue-700 dark:text-blue-400">Last FY Grants:</div>
                          {status.last_fy_grants.length > 0 ? (
                            <div className="space-y-1">
                              {status.last_fy_grants.map((grant) => (
                                <div key={grant.id} className="text-xs p-2 bg-white dark:bg-gray-800 rounded border">
                                  <Link 
                                    to="/grants" 
                                    state={{ selectedGrantId: grant.id }}
                                    className="font-medium truncate text-primary hover:underline block"
                                  >
                                    {grant.title}
                                  </Link>
                                  <div className="text-muted-foreground">
                                    Requested: ${grant.requested_amount.toLocaleString()}
                                    {grant.awarded_amount > 0 && (
                                      <span className="text-blue-600 ml-2">
                                        Awarded: ${grant.awarded_amount.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground italic">No grants in this period</div>
                          )}
                        </div>

                        {/* Total Grants */}
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-purple-700 dark:text-purple-400">All Grants:</div>
                          {status.total_grants.length > 0 ? (
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                              {status.total_grants.map((grant) => (
                                <div key={grant.id} className="text-xs p-2 bg-white dark:bg-gray-800 rounded border">
                                  <Link 
                                    to="/grants" 
                                    state={{ selectedGrantId: grant.id }}
                                    className="font-medium truncate text-primary hover:underline block"
                                  >
                                    {grant.title}
                                  </Link>
                                  <div className="text-muted-foreground">
                                    Requested: ${grant.requested_amount.toLocaleString()}
                                    {grant.awarded_amount > 0 && (
                                      <span className="text-purple-600 ml-2">
                                        Awarded: ${grant.awarded_amount.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground italic">No grants in this status</div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Submission & Compliance Deadlines
            </CardTitle>
            <CardDescription>Next 60 days of critical dates</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No upcoming deadlines in the next 60 days</AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grant Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submission Deadline</TableHead>
                    <TableHead>Compliance Deadline</TableHead>
                    <TableHead>Days Until</TableHead>
                    <TableHead>Urgency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingDeadlines.map((deadline) => (
                    <TableRow key={deadline.id}>
                      <TableCell className="font-medium">{deadline.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {deadline.status_stage.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {deadline.submission_deadline
                          ? format(new Date(deadline.submission_deadline), "MMM dd, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {deadline.compliance_reporting_deadline
                          ? format(new Date(deadline.compliance_reporting_deadline), "MMM dd, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>{deadline.days_until_deadline} days</TableCell>
                      <TableCell>{getUrgencyBadge(deadline.days_until_deadline)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pledge Aging */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pledge Aging Report
            </CardTitle>
            <CardDescription>Major gift opportunities in progress by stage duration</CardDescription>
          </CardHeader>
          <CardContent>
            {pledgeAging.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No active pledges in the pipeline</AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Constituent</TableHead>
                    <TableHead>Expected Amount</TableHead>
                    <TableHead>Expected Date</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Days in Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pledgeAging.map((pledge) => (
                    <TableRow key={pledge.id}>
                      <TableCell className="font-medium">{pledge.constituent_name}</TableCell>
                      <TableCell>${pledge.expected_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        {pledge.expected_date ? format(new Date(pledge.expected_date), "MMM dd, yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {pledge.stage}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={pledge.days_in_stage > 90 ? "text-red-600 font-semibold" : ""}>
                          {pledge.days_in_stage} days
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ComplianceDashboard;
