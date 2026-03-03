import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  RefreshCw, 
  Pause,
  Play,
  XCircle,
  ExternalLink,
  Calendar,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useGivebutterPlans } from "@/hooks/useGivebutter";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export function GivebutterPlansView() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: plans, isLoading } = useGivebutterPlans(
    statusFilter === "all" ? undefined : statusFilter
  );

  // Calculate stats
  const stats = plans?.reduce((acc, plan) => {
    if (plan.status === "active") {
      acc.activePlans++;
      const amount = Number(plan.amount) || 0;
      switch (plan.frequency) {
        case "monthly":
          acc.mrr += amount;
          break;
        case "quarterly":
          acc.mrr += amount / 3;
          break;
        case "yearly":
          acc.mrr += amount / 12;
          break;
      }
    } else if (plan.status === "paused") {
      acc.pausedPlans++;
    } else if (plan.status === "canceled") {
      acc.canceledPlans++;
    }
    return acc;
  }, { activePlans: 0, pausedPlans: 0, canceledPlans: 0, mrr: 0 }) || { activePlans: 0, pausedPlans: 0, canceledPlans: 0, mrr: 0 };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500"><Play className="h-3 w-3 mr-1" />Active</Badge>;
      case "paused":
        return <Badge variant="secondary"><Pause className="h-3 w-3 mr-1" />Paused</Badge>;
      case "canceled":
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "monthly":
        return "Monthly";
      case "quarterly":
        return "Quarterly";
      case "yearly":
        return "Yearly";
      default:
        return frequency;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePlans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused Plans</CardTitle>
            <Pause className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pausedPlans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceled Plans</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.canceledPlans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(stats.mrr).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Recurring Plans
              </CardTitle>
              <CardDescription>
                Manage recurring donation plans from Givebutter.
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!plans?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No recurring plans found with the selected filter.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Billing</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {plan.first_name} {plan.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {plan.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {Number(plan.amount).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getFrequencyLabel(plan.frequency)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(plan.status)}</TableCell>
                    <TableCell>
                      {plan.next_billing_date ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(plan.next_billing_date), "MMM d, yyyy")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {plan.campaign_code ? (
                        <Badge variant="outline">{plan.campaign_code}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {plan.plan_created_at ? (
                        <span className="text-sm">
                          {format(new Date(plan.plan_created_at), "MMM d, yyyy")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {plan.constituent_id && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/constituents/${plan.constituent_id}`}>
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {plan.pledge_id && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/pledges/${plan.pledge_id}`}>
                              View Pledge
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
