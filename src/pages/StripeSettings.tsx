import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Users,
  TrendingUp,
  Repeat,
  ExternalLink,
  Settings,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDonationStats, useRecurringDonations } from "@/hooks/useDonations";

export default function StripeSettings() {
  const navigate = useNavigate();

  const { data: stripeConfig, isLoading: configLoading } = useQuery({
    queryKey: ["stripe-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stripe_config")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: stats, isLoading: statsLoading } = useDonationStats(30);
  const { data: recurringDonations } = useRecurringDonations({ status: "active" });

  const isConnected = stripeConfig?.is_connected || false;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate("/integrations")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Integrations
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#635BFF]/10 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-[#635BFF]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Stripe Integration</h1>
                <p className="text-muted-foreground mt-1">
                  Accept online donations and recurring gifts
                </p>
              </div>
            </div>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Connection Status</CardTitle>
              {configLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : isConnected ? (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Not Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {configLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : isConnected ? (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Account</span>
                    <p className="font-mono">{stripeConfig?.stripe_account_id || "acct_xxxxx"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nonprofit Rate</span>
                    <p className="flex items-center gap-1">
                      {stripeConfig?.nonprofit_rate_approved ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Approved (2.2% + $0.30)
                        </>
                      ) : (
                        "Standard (2.9% + $0.30)"
                      )}
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open Stripe Dashboard
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground">
                  Connect your Stripe account to start accepting online donations.
                </p>
                <Button className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Connect Stripe
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <DollarSign className="h-4 w-4" />
                  Total
                </div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="text-2xl font-bold">
                    ${(stats?.totalAmount || 0).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Users className="h-4 w-4" />
                  Donors
                </div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.donorCount || 0}</p>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <TrendingUp className="h-4 w-4" />
                  Avg Gift
                </div>
                {statsLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">${(stats?.avgGift || 0).toFixed(0)}</p>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Repeat className="h-4 w-4" />
                  Recurring
                </div>
                <p className="text-2xl font-bold">{recurringDonations?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/donations")}
          >
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                View All Donations
              </CardTitle>
              <CardDescription>
                Browse and manage all donation records
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/donation-campaigns")}
          >
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Manage Campaigns
              </CardTitle>
              <CardDescription>
                Create and manage fundraising campaigns
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/donations/recurring")}
          >
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Repeat className="h-5 w-5 text-primary" />
                Recurring Donors
              </CardTitle>
              <CardDescription>
                Manage monthly sustainers and subscriptions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate("/donate/general")}
          >
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-primary" />
                Preview Donation Page
              </CardTitle>
              <CardDescription>
                See what donors experience
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
