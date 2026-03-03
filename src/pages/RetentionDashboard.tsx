import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, DollarSign, TrendingUp, AlertCircle, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfYear, endOfYear, subYears } from "date-fns";

interface RetentionMetrics {
  retention_rate: number;
  donors_last_year: number;
  donors_this_year: number;
  retained_donors: number;
  new_donors_this_year: number;
  lapsed_donors: number;
}

interface LTVDistribution {
  range: string;
  count: number;
  total_value: number;
}

interface TopDonor {
  id: string;
  name: string;
  ltv: number;
  gift_count: number;
  first_gift_date: string;
  last_gift_date: string;
}

const RetentionDashboard = () => {
  const [retentionMetrics, setRetentionMetrics] = useState<RetentionMetrics | null>(null);
  const [ltvDistribution, setLtvDistribution] = useState<LTVDistribution[]>([]);
  const [topDonors, setTopDonors] = useState<TopDonor[]>([]);
  const [totalLTV, setTotalLTV] = useState(0);
  const [avgLTV, setAvgLTV] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;

      const currentYearStart = format(startOfYear(new Date(currentYear, 0, 1)), "yyyy-MM-dd");
      const currentYearEnd = format(endOfYear(new Date(currentYear, 11, 31)), "yyyy-MM-dd");
      const lastYearStart = format(startOfYear(new Date(lastYear, 0, 1)), "yyyy-MM-dd");
      const lastYearEnd = format(endOfYear(new Date(lastYear, 11, 31)), "yyyy-MM-dd");

      // Fetch all gifts with constituent info
      const { data: gifts, error: giftsError } = await supabase
        .from("gifts")
        .select(`
          id,
          amount,
          date_received,
          constituent_id,
          constituents!inner (
            id,
            full_legal_name
          )
        `)
        .order("date_received", { ascending: true });

      if (giftsError) throw giftsError;

      // Calculate donor retention metrics
      const lastYearDonors = new Set<string>();
      const thisYearDonors = new Set<string>();

      gifts?.forEach((gift) => {
        const giftDate = new Date(gift.date_received);
        const giftYear = giftDate.getFullYear();

        if (giftYear === lastYear) {
          lastYearDonors.add(gift.constituent_id);
        }
        if (giftYear === currentYear) {
          thisYearDonors.add(gift.constituent_id);
        }
      });

      // Calculate retained donors (gave last year AND this year)
      const retainedDonors = Array.from(lastYearDonors).filter((id) => thisYearDonors.has(id));
      const retentionRate = lastYearDonors.size > 0 ? (retainedDonors.length / lastYearDonors.size) * 100 : 0;

      // Calculate new donors (gave this year but NOT last year)
      const newDonorsThisYear = Array.from(thisYearDonors).filter((id) => !lastYearDonors.has(id));

      // Calculate lapsed donors (gave last year but NOT this year)
      const lapsedDonors = Array.from(lastYearDonors).filter((id) => !thisYearDonors.has(id));

      setRetentionMetrics({
        retention_rate: retentionRate,
        donors_last_year: lastYearDonors.size,
        donors_this_year: thisYearDonors.size,
        retained_donors: retainedDonors.length,
        new_donors_this_year: newDonorsThisYear.length,
        lapsed_donors: lapsedDonors.length,
      });

      // Calculate LTV per constituent
      const constituentLTV = new Map<string, { name: string; ltv: number; count: number; firstDate: string; lastDate: string }>();

      gifts?.forEach((gift) => {
        const constituent = Array.isArray(gift.constituents) ? gift.constituents[0] : gift.constituents;
        const constituentId = gift.constituent_id;
        const amount = Number(gift.amount || 0);

        const existing = constituentLTV.get(constituentId);
        if (existing) {
          existing.ltv += amount;
          existing.count += 1;
          // Update first and last dates
          if (gift.date_received < existing.firstDate) {
            existing.firstDate = gift.date_received;
          }
          if (gift.date_received > existing.lastDate) {
            existing.lastDate = gift.date_received;
          }
        } else {
          constituentLTV.set(constituentId, {
            name: constituent?.full_legal_name || "Unknown",
            ltv: amount,
            count: 1,
            firstDate: gift.date_received,
            lastDate: gift.date_received,
          });
        }
      });

      // Calculate total and average LTV
      const ltvValues = Array.from(constituentLTV.values());
      const totalLTVValue = ltvValues.reduce((sum, c) => sum + c.ltv, 0);
      const avgLTVValue = ltvValues.length > 0 ? totalLTVValue / ltvValues.length : 0;

      setTotalLTV(totalLTVValue);
      setAvgLTV(avgLTVValue);

      // Create LTV distribution buckets
      const buckets: LTVDistribution[] = [
        { range: "$0-$100", count: 0, total_value: 0 },
        { range: "$100-$500", count: 0, total_value: 0 },
        { range: "$500-$1,000", count: 0, total_value: 0 },
        { range: "$1,000-$5,000", count: 0, total_value: 0 },
        { range: "$5,000-$10,000", count: 0, total_value: 0 },
        { range: "$10,000+", count: 0, total_value: 0 },
      ];

      ltvValues.forEach((c) => {
        if (c.ltv < 100) {
          buckets[0].count += 1;
          buckets[0].total_value += c.ltv;
        } else if (c.ltv < 500) {
          buckets[1].count += 1;
          buckets[1].total_value += c.ltv;
        } else if (c.ltv < 1000) {
          buckets[2].count += 1;
          buckets[2].total_value += c.ltv;
        } else if (c.ltv < 5000) {
          buckets[3].count += 1;
          buckets[3].total_value += c.ltv;
        } else if (c.ltv < 10000) {
          buckets[4].count += 1;
          buckets[4].total_value += c.ltv;
        } else {
          buckets[5].count += 1;
          buckets[5].total_value += c.ltv;
        }
      });

      setLtvDistribution(buckets);

      // Get top 10 donors by LTV
      const topDonorsList = Array.from(constituentLTV.entries())
        .map(([id, data]) => ({
          id,
          name: data.name,
          ltv: data.ltv,
          gift_count: data.count,
          first_gift_date: data.firstDate,
          last_gift_date: data.lastDate,
        }))
        .sort((a, b) => b.ltv - a.ltv)
        .slice(0, 10);

      setTopDonors(topDonorsList);

    } catch (error: unknown) {
      console.error("Error fetching retention dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load retention dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-3xl font-bold">Donor Retention and LTV Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor donor retention rates, lifetime value, and organizational health metrics
          </p>
        </div>

        {/* Executive Summary - Prominent KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                Total Lifetime Value
              </CardTitle>
              <CardDescription>All-time giving across all donors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{formatCurrency(totalLTV)}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Average: {formatCurrency(avgLTV)} per donor
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                Donor Retention Rate
              </CardTitle>
              <CardDescription>Year-over-year donor loyalty</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">
                {retentionMetrics?.retention_rate.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {retentionMetrics?.retained_donors} of {retentionMetrics?.donors_last_year} donors retained
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-6 w-6 text-purple-600" />
                Donor Acquisition Cost
              </CardTitle>
              <CardDescription>Cost to acquire each new donor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600">
                {retentionMetrics && retentionMetrics.new_donors_this_year > 0 
                  ? formatCurrency(totalLTV * 0.15 / retentionMetrics.new_donors_this_year)
                  : "$0"}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {retentionMetrics?.new_donors_this_year || 0} new donors this year
              </p>
              <Alert className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Estimated at 15% of LTV. Configure actual marketing costs for precise DAC tracking.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Retention Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {retentionMetrics?.retention_rate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {retentionMetrics?.retained_donors} of {retentionMetrics?.donors_last_year} donors retained
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total LTV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalLTV)}</div>
              <p className="text-xs text-muted-foreground mt-1">All-time giving</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average LTV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(avgLTV)}</div>
              <p className="text-xs text-muted-foreground mt-1">Per donor</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Donors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{retentionMetrics?.donors_this_year || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {retentionMetrics?.new_donors_this_year} new this year
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Retention Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Donor Retention Breakdown
            </CardTitle>
            <CardDescription>Year-over-year donor behavior analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Retained Donors</span>
                  <Badge className="bg-green-500">Healthy</Badge>
                </div>
                <div className="text-3xl font-bold">{retentionMetrics?.retained_donors || 0}</div>
                <p className="text-sm text-muted-foreground">
                  Gave in {new Date().getFullYear() - 1} and {new Date().getFullYear()}
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">New Donors</span>
                  <Badge className="bg-blue-500">Growth</Badge>
                </div>
                <div className="text-3xl font-bold">{retentionMetrics?.new_donors_this_year || 0}</div>
                <p className="text-sm text-muted-foreground">
                  First gift in {new Date().getFullYear()}
                </p>
              </div>

              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Lapsed Donors</span>
                  <Badge variant="destructive">At Risk</Badge>
                </div>
                <div className="text-3xl font-bold">{retentionMetrics?.lapsed_donors || 0}</div>
                <p className="text-sm text-muted-foreground">
                  Gave in {new Date().getFullYear() - 1} but not {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LTV Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Lifetime Value Distribution
            </CardTitle>
            <CardDescription>Donor segmentation by total giving</CardDescription>
          </CardHeader>
          <CardContent>
            {ltvDistribution.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No donor data available</AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>LTV Range</TableHead>
                    <TableHead>Number of Donors</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>% of Total LTV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ltvDistribution.map((bucket, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{bucket.range}</TableCell>
                      <TableCell>{bucket.count}</TableCell>
                      <TableCell>{formatCurrency(bucket.total_value)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full"
                              style={{
                                width: `${totalLTV > 0 ? (bucket.total_value / totalLTV) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {totalLTV > 0 ? ((bucket.total_value / totalLTV) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Donors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Donors by Lifetime Value
            </CardTitle>
            <CardDescription>Your most valuable long-term supporters</CardDescription>
          </CardHeader>
          <CardContent>
            {topDonors.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>No donor data available</AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Donor Name</TableHead>
                    <TableHead>Lifetime Value</TableHead>
                    <TableHead>Total Gifts</TableHead>
                    <TableHead>First Gift</TableHead>
                    <TableHead>Last Gift</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topDonors.map((donor, idx) => (
                    <TableRow key={donor.id}>
                      <TableCell>
                        <Badge variant={idx < 3 ? "default" : "outline"}>#{idx + 1}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{donor.name}</TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        {formatCurrency(donor.ltv)}
                      </TableCell>
                      <TableCell>{donor.gift_count}</TableCell>
                      <TableCell>{format(new Date(donor.first_gift_date), "MMM yyyy")}</TableCell>
                      <TableCell>{format(new Date(donor.last_gift_date), "MMM yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Organizational Health Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-2 w-2 bg-primary rounded-full mt-2" />
                <div>
                  <p className="font-medium">Retention Health</p>
                  <p className="text-sm text-muted-foreground">
                    {retentionMetrics && retentionMetrics.retention_rate >= 60 ? (
                      <>
                        Excellent retention rate of {retentionMetrics.retention_rate.toFixed(1)}%. This is above the
                        nonprofit industry average of 40-45%. Continue nurturing donor relationships.
                      </>
                    ) : retentionMetrics && retentionMetrics.retention_rate >= 40 ? (
                      <>
                        Solid retention rate of {retentionMetrics.retention_rate.toFixed(1)}%, aligned with industry
                        average. Focus on upgrading engagement with mid-level donors.
                      </>
                    ) : (
                      <>
                        Retention rate of {retentionMetrics?.retention_rate.toFixed(1)}% needs improvement.
                        Implement reactivation campaigns and strengthen stewardship programs.
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-2 w-2 bg-primary rounded-full mt-2" />
                <div>
                  <p className="font-medium">Donor Acquisition Note</p>
                  <p className="text-sm text-muted-foreground">
                    To calculate Donor Acquisition Cost (DAC), integrate marketing and campaign spend data. DAC =
                    Total Marketing Costs / New Donors Acquired. Industry benchmark: $100-$300 per donor.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-2 w-2 bg-primary rounded-full mt-2" />
                <div>
                  <p className="font-medium">Value Concentration</p>
                  <p className="text-sm text-muted-foreground">
                    Review the top 10% of donors to ensure your organization isn't over-reliant on a small group.
                    Diversification reduces risk and ensures sustainable funding.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RetentionDashboard;
