import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Pause,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useRecurringDonations } from "@/hooks/useDonations";
import { format } from "date-fns";

export default function RecurringDonations() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");

  const { data: donations, isLoading } = useRecurringDonations(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );

  const activeCount = donations?.filter((d) => d.status === "active").length || 0;
  const monthlyRevenue = donations
    ?.filter((d) => d.status === "active")
    .reduce((sum, d) => {
      const amount = Number(d.amount);
      if (d.frequency === "monthly") return sum + amount;
      if (d.frequency === "quarterly") return sum + amount / 3;
      if (d.frequency === "annually") return sum + amount / 12;
      return sum;
    }, 0) || 0;
  const avgGift = activeCount > 0 ? monthlyRevenue / activeCount : 0;

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "paused":
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case "past_due":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    const styles: Record<string, string> = {
      active: "bg-green-500/10 text-green-500 border-green-500/20",
      paused: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      past_due: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
      incomplete: "bg-muted text-muted-foreground",
    };
    return styles[status || "active"] || "bg-muted text-muted-foreground";
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      monthly: "/mo",
      quarterly: "/qtr",
      annually: "/yr",
    };
    return labels[frequency] || "";
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate("/donations")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to All Donations
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Recurring Donors</h1>
              <p className="text-muted-foreground mt-1">
                Manage monthly sustainers and subscriptions
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Recurring
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Gift
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${avgGift.toFixed(0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Past Due
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {donations?.filter((d) => d.status === "past_due").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="past_due">Past Due</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recurring Donations Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Since</TableHead>
                  <TableHead>Total Donated</TableHead>
                  <TableHead>Next Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : donations && donations.length > 0 ? (
                  donations.map((donation) => (
                    <TableRow
                      key={donation.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        if (donation.constituent_id) {
                          navigate(`/constituent/${donation.constituent_id}`);
                        }
                      }}
                    >
                      <TableCell>
                        <div className="font-medium">
                          Recurring Donor
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {donation.stripe_subscription_id.slice(0, 12)}...
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${Number(donation.amount).toLocaleString()}
                        <span className="text-muted-foreground text-sm">
                          {getFrequencyLabel(donation.frequency)}
                        </span>
                      </TableCell>
                      <TableCell className="capitalize">{donation.frequency}</TableCell>
                      <TableCell>
                        {donation.start_date
                          ? format(new Date(donation.start_date), "MMM yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${(donation.total_donated || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {donation.next_payment_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(donation.next_payment_date), "MMM d, yyyy")}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(donation.status)}
                          <Badge className={getStatusBadge(donation.status)}>
                            {donation.status === "past_due" ? "Past Due" : donation.status}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="text-muted-foreground">
                        No recurring donations found
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
