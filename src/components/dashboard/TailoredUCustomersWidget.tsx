import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSaasOrganizations } from "@/hooks/useSaasOrganizations";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Skeleton } from "@/components/ui/skeleton";

export function TailoredUCustomersWidget() {
  const { isSuperAdmin, isLoading: loadingSuperAdmin } = useSuperAdmin();
  const { data: organizations, isLoading: loadingOrgs } = useSaasOrganizations();

  // Don't show for non-super admins
  if (!isSuperAdmin && !loadingSuperAdmin) {
    return null;
  }

  if (loadingSuperAdmin || loadingOrgs) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const activeCount = organizations.filter((o) => o.status === "active").length;
  const pendingCount = organizations.filter(
    (o) => o.status === "pending" || o.status === "provisioning"
  ).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">cM Customers</CardTitle>
        <Building2 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 mb-4">
          <div>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Pending
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/admin/customers">
            Manage Customers
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
