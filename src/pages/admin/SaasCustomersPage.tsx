import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, Plus, Search, MoreHorizontal, ExternalLink, RefreshCw, Eye, Users, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useSaasOrganizations } from "@/hooks/useSaasOrganizations";
import { useSyncCustomerConfig } from "@/hooks/useSyncCustomerConfig";
import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";

export default function SaasCustomersPage() {
  const { data: organizations, isLoading, error } = useSaasOrganizations();
  const syncConfig = useSyncCustomerConfig();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Compute stats
  const stats = useMemo(() => {
    const total = organizations.length;
    const active = organizations.filter(o => o.status === "active").length;
    const pending = organizations.filter(o => o.status === "pending" || o.status === "provisioning").length;
    const pastDue = organizations.filter(o => o.subscription_status === "past_due").length;
    return { total, active, pending, pastDue };
  }, [organizations]);

  // Filter organizations
  const filteredOrganizations = useMemo(() => {
    return organizations.filter(org => {
      const matchesSearch = !search || 
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        org.contact_email.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || org.status === statusFilter;
      const matchesTier = tierFilter === "all" || org.subscription_tier === tierFilter;
      const matchesType = typeFilter === "all" || org.organization_type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesTier && matchesType;
    });
  }, [organizations, search, statusFilter, tierFilter, typeFilter]);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "provisioning":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Provisioning</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Suspended</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "starter":
        return <Badge variant="secondary">Starter</Badge>;
      case "professional":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Professional</Badge>;
      case "enterprise":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Enterprise</Badge>;
      default:
        return <Badge variant="secondary">{tier}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "nonprofit":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Nonprofit</Badge>;
      case "education":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Education</Badge>;
      case "small_business":
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Small Business</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const handleSyncConfig = (orgId: string) => {
    syncConfig.mutate(orgId);
  };

  const handleOpenInstance = (url: string | null) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-muted-foreground">Failed to load customers</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">TailoredU Customers</h1>
            <p className="text-muted-foreground">
              Manage your SaaS customer accounts
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/customers/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Setup</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Past Due</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pastDue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="nonprofit">Nonprofit</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="small_business">Small Business</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Table or Empty State */}
        {filteredOrganizations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No customers yet</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-4">
                Add your first TailoredU customer to get started
              </p>
              <Button asChild>
                <Link to="/admin/customers/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <Link 
                        to={`/admin/customers/${org.id}`}
                        className="font-medium hover:underline text-primary"
                      >
                        {org.name}
                      </Link>
                    </TableCell>
                    <TableCell>{getTypeBadge(org.organization_type)}</TableCell>
                    <TableCell>{getTierBadge(org.subscription_tier)}</TableCell>
                    <TableCell>{getStatusBadge(org.status)}</TableCell>
                    <TableCell className="text-muted-foreground">{org.contact_email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {org.current_user_count ?? 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {org.last_config_sync_at 
                        ? formatDistanceToNow(new Date(org.last_config_sync_at), { addSuffix: true })
                        : "Never"
                      }
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/customers/${org.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSyncConfig(org.id)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync Config
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleOpenInstance(org.deployment_url)}
                            disabled={!org.deployment_url}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Instance
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </Layout>
  );
}
