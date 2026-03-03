import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, DollarSign, AlertCircle, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StageMetrics {
  stage: string;
  count: number;
  total_expected: number;
  avg_probability: number;
  weighted_value: number;
}

interface ConversionRate {
  from_stage: string;
  to_stage: string;
  conversion_rate: number;
  count_moved: number;
}

interface LTVMetrics {
  total_pipeline_value: number;
  weighted_pipeline_value: number;
  avg_gift_size: number;
  total_opportunities: number;
}

export function GiftPipelineHealth() {
  const [stageMetrics, setStageMetrics] = useState<StageMetrics[]>([]);
  const [ltvMetrics, setLTVMetrics] = useState<LTVMetrics | null>(null);
  const [conversionRates, setConversionRates] = useState<ConversionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const { data: opportunities, error: oppError } = await supabase
        .from("major_gift_opportunities")
        .select("*");

      if (oppError) throw oppError;

      if (!opportunities || opportunities.length === 0) {
        setStageMetrics([]);
        setLTVMetrics({
          total_pipeline_value: 0,
          weighted_pipeline_value: 0,
          avg_gift_size: 0,
          total_opportunities: 0,
        });
        setConversionRates([]);
        setLoading(false);
        return;
      }

      const stageMap = new Map<string, StageMetrics>();
      const stages = ["identification", "qualification", "cultivation", "solicitation", "stewardship"];
      
      stages.forEach((stage) => {
        stageMap.set(stage, {
          stage,
          count: 0,
          total_expected: 0,
          avg_probability: 0,
          weighted_value: 0,
        });
      });

      const totalProbability: Record<string, number> = {};
      opportunities.forEach((opp) => {
        const existing = stageMap.get(opp.stage);
        if (existing) {
          existing.count += 1;
          const expectedAmount = Number(opp.expected_amount || 0);
          existing.total_expected += expectedAmount;
          
          const probability = Number(opp.probability_percent || 0);
          totalProbability[opp.stage] = (totalProbability[opp.stage] || 0) + probability;
          
          existing.weighted_value += (expectedAmount * probability) / 100;
        }
      });

      stageMap.forEach((metrics, stage) => {
        if (metrics.count > 0) {
          metrics.avg_probability = totalProbability[stage] / metrics.count;
        }
      });

      setStageMetrics(Array.from(stageMap.values()).filter((m) => m.count > 0));

      const totalPipelineValue = opportunities.reduce(
        (sum, opp) => sum + Number(opp.expected_amount || 0),
        0
      );
      const weightedPipelineValue = opportunities.reduce(
        (sum, opp) => sum + (Number(opp.expected_amount || 0) * Number(opp.probability_percent || 0)) / 100,
        0
      );
      const avgGiftSize = totalPipelineValue / opportunities.length;

      setLTVMetrics({
        total_pipeline_value: totalPipelineValue,
        weighted_pipeline_value: weightedPipelineValue,
        avg_gift_size: avgGiftSize,
        total_opportunities: opportunities.length,
      });

      const stageOrder = ["identification", "qualification", "cultivation", "solicitation", "stewardship"];
      const conversions: ConversionRate[] = [];

      for (let i = 0; i < stageOrder.length - 1; i++) {
        const fromStage = stageOrder[i];
        const toStage = stageOrder[i + 1];
        
        const fromCount = opportunities.filter((o) => {
          const currentIndex = stageOrder.indexOf(o.stage);
          return currentIndex >= i;
        }).length;
        
        const toCount = opportunities.filter((o) => {
          const currentIndex = stageOrder.indexOf(o.stage);
          return currentIndex >= i + 1;
        }).length;

        const conversionRate = fromCount > 0 ? (toCount / fromCount) * 100 : 0;

        conversions.push({
          from_stage: fromStage,
          to_stage: toStage,
          conversion_rate: conversionRate,
          count_moved: toCount,
        });
      }

      setConversionRates(conversions);

    } catch (error: unknown) {
      console.error("Error fetching pipeline dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load pipeline dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      identification: "bg-blue-500",
      qualification: "bg-yellow-500",
      cultivation: "bg-purple-500",
      solicitation: "bg-orange-500",
      stewardship: "bg-green-500",
    };
    return colors[stage] || "bg-gray-500";
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
        <p className="text-muted-foreground">Loading gift pipeline data...</p>
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
              <DollarSign className="h-6 w-6 text-green-600" />
              Total Lifetime Value
            </CardTitle>
            <CardDescription>Realized + pipeline value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {formatCurrency((ltvMetrics?.total_pipeline_value || 0))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Weighted: {formatCurrency(ltvMetrics?.weighted_pipeline_value || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              Pipeline Conversion
            </CardTitle>
            <CardDescription>Overall pipeline health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">
              {conversionRates.length > 0 
                ? (conversionRates.reduce((sum, c) => sum + c.conversion_rate, 0) / conversionRates.length).toFixed(1)
                : "0.0"}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Average across all stages
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-6 w-6 text-purple-600" />
              Donor Acquisition Cost
            </CardTitle>
            <CardDescription>Cost efficiency metric</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600">
              {ltvMetrics && ltvMetrics.total_opportunities > 0
                ? formatCurrency((ltvMetrics.total_pipeline_value * 0.15) / ltvMetrics.total_opportunities)
                : "$0"}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Per opportunity (estimated)
            </p>
            <Alert className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Estimated at 15% of pipeline value. Configure tracking for precise DAC.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* LTV Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(ltvMetrics?.total_pipeline_value || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Sum of all expected amounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weighted Pipeline Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(ltvMetrics?.weighted_pipeline_value || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Adjusted for probability</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Gift Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(ltvMetrics?.avg_gift_size || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per opportunity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ltvMetrics?.total_opportunities || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active major gifts</p>
          </CardContent>
        </Card>
      </div>

      {/* Stage Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Pipeline Stage Distribution
          </CardTitle>
          <CardDescription>Current opportunities by stage with weighted values</CardDescription>
        </CardHeader>
        <CardContent>
          {stageMetrics.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No major gift opportunities in the pipeline</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stageMetrics.map((stage) => (
                <div key={stage.stage} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{stage.stage}</span>
                    <div className={`h-3 w-3 rounded-full ${getStageColor(stage.stage)}`} />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-2xl font-bold">{stage.count}</div>
                      <div className="text-xs text-muted-foreground">Opportunities</div>
                    </div>
                    <div className="pt-2 border-t space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Expected:</span>
                        <span className="font-semibold">{formatCurrency(stage.total_expected)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg Probability:</span>
                        <span className="font-semibold">{stage.avg_probability.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Weighted Value:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(stage.weighted_value)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Stage-to-Stage Conversion Rates
          </CardTitle>
          <CardDescription>Progression through the major gift pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          {conversionRates.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No conversion data available</AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From Stage</TableHead>
                  <TableHead>To Stage</TableHead>
                  <TableHead>Opportunities Progressed</TableHead>
                  <TableHead>Conversion Rate</TableHead>
                  <TableHead>Health Indicator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversionRates.map((conversion, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {conversion.from_stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {conversion.to_stage}
                      </Badge>
                    </TableCell>
                    <TableCell>{conversion.count_moved}</TableCell>
                    <TableCell>
                      <span className="font-semibold">{conversion.conversion_rate.toFixed(1)}%</span>
                    </TableCell>
                    <TableCell>
                      {conversion.conversion_rate >= 50 ? (
                        <Badge className="bg-green-500">Healthy</Badge>
                      ) : conversion.conversion_rate >= 30 ? (
                        <Badge className="bg-yellow-500">Moderate</Badge>
                      ) : (
                        <Badge variant="destructive">Needs Attention</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pipeline Health Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ltvMetrics && (
              <>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-primary rounded-full mt-2" />
                  <div>
                    <p className="font-medium">Expected Revenue</p>
                    <p className="text-sm text-muted-foreground">
                      Based on probability weighting, expect to realize approximately{" "}
                      <span className="font-semibold text-green-600">
                        {formatCurrency(ltvMetrics.weighted_pipeline_value)}
                      </span>{" "}
                      ({ltvMetrics.total_pipeline_value > 0 
                        ? ((ltvMetrics.weighted_pipeline_value / ltvMetrics.total_pipeline_value) * 100).toFixed(0)
                        : 0}%
                      of total pipeline value)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-primary rounded-full mt-2" />
                  <div>
                    <p className="font-medium">Pipeline Velocity</p>
                    <p className="text-sm text-muted-foreground">
                      Monitor conversion rates to identify bottlenecks. Stages with conversion rates below 30%
                      may require additional cultivation strategies or resource allocation.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
