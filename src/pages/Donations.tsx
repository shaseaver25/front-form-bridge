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
  Download,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  DollarSign,
  Users,
  TrendingUp,
  Repeat,
  CreditCard,
} from "lucide-react";
import { useStripeDonations, useDonationStats, useRecurringDonations } from "@/hooks/useDonations";
import { GivebutterSourceBadge } from "@/components/integrations/GivebutterSourceBadge";
import { format } from "date-fns";

export default function Donations() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: donations, isLoading } = useStripeDonations(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );
  const { data: stats } = useDonationStats(30);
  const { data: recurringDonations } = useRecurringDonations({ status: "active" });

  const filteredDonations = donations?.filter(
    (d) =>
      d.donor_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.donor_first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.donor_last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "succeeded":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "refunded":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    const styles: Record<string, string> = {
      succeeded: "bg-green-500/10 text-green-500 border-green-500/20",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      processing: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      failed: "bg-red-500/10 text-red-500 border-red-500/20",
      refunded: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    };
    return styles[status || "pending"] || "bg-muted text-muted-foreground";
  };

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
            <div>
              <h1 className="text-3xl font-bold tracking-tight">All Donations</h1>
              <p className="text-muted-foreground mt-1">
                View and manage donation records
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last 30 Days
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats?.totalAmount.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Donors
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.donorCount || 0}</div>
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
                ${stats?.avgGift.toFixed(0) || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Recurring
              </CardTitle>
              <Repeat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recurringDonations?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by donor..."
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
              <SelectItem value="succeeded">Succeeded</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Donations Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>CRM Sync</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredDonations && filteredDonations.length > 0 ? (
                  filteredDonations.map((donation) => (
                    <TableRow
                      key={donation.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        if (donation.constituent_id) {
                          navigate(`/constituent/${donation.constituent_id}`);
                        }
                      }}
                    >
                      <TableCell className="font-medium">
                        {donation.created_at
                          ? format(new Date(donation.created_at), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {donation.is_anonymous
                              ? "Anonymous"
                              : `${donation.donor_first_name || ""} ${donation.donor_last_name || ""}`.trim() ||
                                donation.donor_email}
                          </div>
                          {!donation.is_anonymous && (
                            <div className="text-sm text-muted-foreground">
                              {donation.donor_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${donation.amount.toLocaleString()}
                        {donation.is_recurring && (
                          <span className="text-muted-foreground text-sm">
                            /{donation.recurring_frequency?.slice(0, 2)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{donation.fund_designation || "General Fund"}</TableCell>
                      <TableCell>
                        {(donation as { source?: string }).source === "givebutter" ? (
                          <GivebutterSourceBadge 
                            transactionId={(donation as { external_id?: string }).external_id}
                            showLink
                          />
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <CreditCard className="h-3 w-3" />
                            Stripe
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {donation.is_recurring ? (
                          <Badge variant="outline" className="gap-1">
                            <Repeat className="h-3 w-3" />
                            Recurring
                          </Badge>
                        ) : (
                          <Badge variant="secondary">One-time</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(donation.status)}
                          <Badge className={getStatusBadge(donation.status)}>
                            {donation.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {donation.synced_to_crm ? (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                            Synced
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="text-muted-foreground">
                        {searchQuery || statusFilter !== "all"
                          ? "No donations match your filters"
                          : "No donations yet"}
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
