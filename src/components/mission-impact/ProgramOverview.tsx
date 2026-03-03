import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Program, OutcomeMetric, OutcomeMeasurement } from "@/hooks/useMissionImpact";
import { Users, Target, TrendingUp, DollarSign, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

interface ProgramOverviewProps {
  program: Program;
  metrics: OutcomeMetric[];
  measurements: OutcomeMeasurement[];
  totalBeneficiaries: number;
  totalFunding: number;
}

export function ProgramOverview({ 
  program, 
  metrics, 
  measurements,
  totalBeneficiaries,
  totalFunding 
}: ProgramOverviewProps) {
  const keyMetrics = metrics.filter(m => m.is_key_metric);
  
  const getLatestValue = (metricId: string) => {
    const metricMeasurements = measurements.filter(m => m.metric_id === metricId);
    if (metricMeasurements.length === 0) return null;
    return metricMeasurements.reduce((latest, m) => 
      new Date(m.measurement_date) > new Date(latest.measurement_date) ? m : latest
    );
  };

  const calculateProgress = (metric: OutcomeMetric) => {
    const latest = getLatestValue(metric.id);
    if (!latest || !metric.target_value || metric.target_value === 0) return 0;
    return Math.min(100, (latest.actual_value / metric.target_value) * 100);
  };

  const statusColors: Record<string, string> = {
    planning: "bg-muted text-muted-foreground",
    active: "bg-secondary text-secondary-foreground",
    completed: "bg-primary text-primary-foreground",
    suspended: "bg-destructive text-destructive-foreground",
  };

  const metricsOnTrack = keyMetrics.filter(m => calculateProgress(m) >= 80).length;
  const metricsAtRisk = keyMetrics.filter(m => {
    const progress = calculateProgress(m);
    return progress > 0 && progress < 80;
  }).length;

  return (
    <div className="space-y-6">
      {/* Program Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{program.name}</CardTitle>
              <p className="text-muted-foreground mt-1">{program.description}</p>
            </div>
            <Badge className={statusColors[program.status || "planning"]}>
              {program.status || "planning"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {program.program_area && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>{program.program_area}</span>
              </div>
            )}
            {program.geographic_area && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{program.geographic_area}</span>
              </div>
            )}
            {program.start_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Started {format(new Date(program.start_date), "MMM yyyy")}</span>
              </div>
            )}
            {program.target_population && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{program.target_population}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBeneficiaries.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Served</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metricsOnTrack}</p>
                <p className="text-sm text-muted-foreground">Metrics On Track</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Target className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metricsAtRisk}</p>
                <p className="text-sm text-muted-foreground">At Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalFunding.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Funding</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Metrics Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {keyMetrics.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No key metrics defined yet</p>
          ) : (
            keyMetrics.map(metric => {
              const latest = getLatestValue(metric.id);
              const progress = calculateProgress(metric);
              return (
                <div key={metric.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{metric.metric_name}</p>
                      <p className="text-sm text-muted-foreground">{metric.metric_description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {latest?.actual_value?.toLocaleString() ?? "—"}
                        {metric.metric_type === "percentage" && "%"}
                        {metric.target_value && (
                          <span className="text-muted-foreground font-normal">
                            {" "}/ {metric.target_value.toLocaleString()}
                            {metric.metric_type === "percentage" && "%"}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Progress 
                    value={progress} 
                    className={`h-2 ${progress >= 80 ? "[&>div]:bg-secondary" : progress >= 50 ? "[&>div]:bg-accent" : "[&>div]:bg-destructive"}`}
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
