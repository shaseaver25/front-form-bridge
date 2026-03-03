import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Target, TrendingUp, AlertCircle, CheckCircle2, Clock, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProgramMetrics {
  id: string;
  name: string;
  status: string;
  annual_budget: number;
  total_beneficiaries: number;
  metrics_count: number;
  metrics_on_track: number;
  metrics_at_risk: number;
  program_area: string | null;
}

interface OverallMetrics {
  total_programs: number;
  active_programs: number;
  total_budget: number;
  total_beneficiaries: number;
  overall_health_score: number;
}

export function ProgrammingHealth() {
  const [programMetrics, setProgramMetrics] = useState<ProgramMetrics[]>([]);
  const [overallMetrics, setOverallMetrics] = useState<OverallMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProgramData();
  }, []);

  const fetchProgramData = async () => {
    try {
      setLoading(true);

      // Fetch all programs
      const { data: programs, error: programsError } = await supabase
        .from("programs")
        .select("*");

      if (programsError) throw programsError;

      if (!programs || programs.length === 0) {
        setOverallMetrics({
          total_programs: 0,
          active_programs: 0,
          total_budget: 0,
          total_beneficiaries: 0,
          overall_health_score: 0,
        });
        setProgramMetrics([]);
        setLoading(false);
        return;
      }

      // Fetch beneficiaries for all programs
      const { data: beneficiaries, error: bError } = await supabase
        .from("program_beneficiaries")
        .select("program_id, total_served");

      if (bError) throw bError;

      // Fetch outcome metrics and measurements
      const { data: outcomeMetrics, error: mError } = await supabase
        .from("outcome_metrics")
        .select("id, program_id, target_value, is_key_metric");

      if (mError) throw mError;

      const { data: measurements, error: measError } = await supabase
        .from("outcome_measurements")
        .select("metric_id, actual_value, measurement_date")
        .order("measurement_date", { ascending: false });

      if (measError) throw measError;

      // Calculate beneficiaries per program
      const beneficiariesByProgram: Record<string, number> = {};
      beneficiaries?.forEach((b) => {
        beneficiariesByProgram[b.program_id] = (beneficiariesByProgram[b.program_id] || 0) + (b.total_served || 0);
      });

      // Get latest measurement per metric
      const latestMeasurements: Record<string, number> = {};
      measurements?.forEach((m) => {
        if (!latestMeasurements[m.metric_id]) {
          latestMeasurements[m.metric_id] = m.actual_value;
        }
      });

      // Calculate metrics health per program
      const metricsHealth: Record<string, { total: number; onTrack: number; atRisk: number }> = {};
      outcomeMetrics?.forEach((metric) => {
        if (!metric.program_id) return;
        if (!metricsHealth[metric.program_id]) {
          metricsHealth[metric.program_id] = { total: 0, onTrack: 0, atRisk: 0 };
        }
        metricsHealth[metric.program_id].total += 1;

        const latestValue = latestMeasurements[metric.id];
        const targetValue = metric.target_value || 0;
        
        if (latestValue !== undefined && targetValue > 0) {
          const progress = (latestValue / targetValue) * 100;
          if (progress >= 70) {
            metricsHealth[metric.program_id].onTrack += 1;
          } else {
            metricsHealth[metric.program_id].atRisk += 1;
          }
        }
      });

      // Build program metrics
      const programData: ProgramMetrics[] = programs.map((program) => ({
        id: program.id,
        name: program.name,
        status: program.status || "planning",
        annual_budget: program.annual_budget || 0,
        total_beneficiaries: beneficiariesByProgram[program.id] || 0,
        metrics_count: metricsHealth[program.id]?.total || 0,
        metrics_on_track: metricsHealth[program.id]?.onTrack || 0,
        metrics_at_risk: metricsHealth[program.id]?.atRisk || 0,
        program_area: program.program_area,
      }));

      setProgramMetrics(programData);

      // Calculate overall metrics
      const activePrograms = programs.filter((p) => p.status === "active").length;
      const totalBudget = programs.reduce((sum, p) => sum + (p.annual_budget || 0), 0);
      const totalBeneficiaries = Object.values(beneficiariesByProgram).reduce((a, b) => a + b, 0);
      
      const totalMetrics = Object.values(metricsHealth).reduce((sum, h) => sum + h.total, 0);
      const totalOnTrack = Object.values(metricsHealth).reduce((sum, h) => sum + h.onTrack, 0);
      const healthScore = totalMetrics > 0 ? (totalOnTrack / totalMetrics) * 100 : 100;

      setOverallMetrics({
        total_programs: programs.length,
        active_programs: activePrograms,
        total_budget: totalBudget,
        total_beneficiaries: totalBeneficiaries,
        overall_health_score: healthScore,
      });

    } catch (error: unknown) {
      console.error("Error fetching program data:", error);
      toast({
        title: "Error",
        description: "Failed to load programming health data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500",
      planning: "bg-blue-500",
      completed: "bg-gray-500",
      suspended: "bg-yellow-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getHealthBadge = (onTrack: number, total: number) => {
    if (total === 0) return <Badge variant="outline">No metrics</Badge>;
    const percentage = (onTrack / total) * 100;
    if (percentage >= 70) return <Badge className="bg-green-500">Healthy</Badge>;
    if (percentage >= 40) return <Badge className="bg-yellow-500">At Risk</Badge>;
    return <Badge variant="destructive">Needs Attention</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading programming health data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-6 w-6 text-green-600" />
              Overall Health Score
            </CardTitle>
            <CardDescription>Program performance across metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {overallMetrics?.overall_health_score.toFixed(0) || 0}%
            </div>
            <Progress 
              value={overallMetrics?.overall_health_score || 0} 
              className="mt-3 h-2"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Based on outcome metrics progress
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              Total Beneficiaries
            </CardTitle>
            <CardDescription>People served across programs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">
              {(overallMetrics?.total_beneficiaries || 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Across {overallMetrics?.active_programs || 0} active programs
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-6 w-6 text-purple-600" />
              Total Program Budget
            </CardTitle>
            <CardDescription>Annual investment in programs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600">
              {formatCurrency(overallMetrics?.total_budget || 0)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {overallMetrics?.total_programs || 0} total programs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Program Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallMetrics?.total_programs || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallMetrics?.active_programs || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Budget per Program</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                overallMetrics?.total_programs 
                  ? (overallMetrics.total_budget / overallMetrics.total_programs) 
                  : 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Beneficiaries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallMetrics?.active_programs 
                ? Math.round(overallMetrics.total_beneficiaries / overallMetrics.active_programs).toLocaleString()
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per active program</p>
          </CardContent>
        </Card>
      </div>

      {/* Program Health Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Program Health Overview
          </CardTitle>
          <CardDescription>Individual program performance and metrics status</CardDescription>
        </CardHeader>
        <CardContent>
          {programMetrics.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No programs have been created yet</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programMetrics.map((program) => (
                <div key={program.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{program.name}</span>
                    <Badge className={`${getStatusColor(program.status)} text-white`}>
                      {program.status}
                    </Badge>
                  </div>
                  
                  {program.program_area && (
                    <p className="text-sm text-muted-foreground">{program.program_area}</p>
                  )}

                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> Beneficiaries:
                      </span>
                      <span className="font-semibold">{program.total_beneficiaries.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Annual Budget:</span>
                      <span className="font-semibold">{formatCurrency(program.annual_budget)}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">Metrics Health:</span>
                      {getHealthBadge(program.metrics_on_track, program.metrics_count)}
                    </div>
                    {program.metrics_count > 0 && (
                      <div className="flex gap-2 text-xs">
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" /> {program.metrics_on_track} on track
                        </span>
                        {program.metrics_at_risk > 0 && (
                          <span className="flex items-center gap-1 text-yellow-600">
                            <Clock className="h-3 w-3" /> {program.metrics_at_risk} at risk
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Programming Health Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 bg-primary rounded-full mt-2" />
              <div>
                <p className="font-medium">Program Reach</p>
                <p className="text-sm text-muted-foreground">
                  Your programs are currently serving{" "}
                  <span className="font-semibold text-blue-600">
                    {(overallMetrics?.total_beneficiaries || 0).toLocaleString()}
                  </span>{" "}
                  beneficiaries across {overallMetrics?.active_programs || 0} active programs.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 bg-primary rounded-full mt-2" />
              <div>
                <p className="font-medium">Outcome Tracking</p>
                <p className="text-sm text-muted-foreground">
                  Programs with outcome metrics defined help demonstrate impact to funders. 
                  Consider adding metrics to programs without tracking in place.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
