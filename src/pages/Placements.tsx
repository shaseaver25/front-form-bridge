import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Calendar, User, Briefcase } from "lucide-react";

export default function Placements() {
  const { data: placements, isLoading } = useQuery({
    queryKey: ["placements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_placements")
        .select(`
          *,
          contact:crm_contacts(id, first_name, last_name),
          job:crm_jobs(id, name, company_id, crm_companies:crm_companies(name))
        `)
        .order("placement_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Placements</h1>
          <p className="text-muted-foreground">Completed placements with salary and fee details</p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : !placements?.length ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No placements recorded yet.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Placements</p>
                  <p className="text-2xl font-bold">{placements.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Fees</p>
                  <p className="text-2xl font-bold">
                    ${placements.reduce((sum, p) => sum + (Number(p.fee_amount) || 0), 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Salary Placed</p>
                  <p className="text-2xl font-bold">
                    ${placements.reduce((sum, p) => sum + (Number(p.salary) || 0), 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Avg Fee %</p>
                  <p className="text-2xl font-bold">
                    {(placements.reduce((sum, p) => sum + (Number(p.fee_percent) || 0), 0) / placements.length).toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Placement list */}
            <div className="space-y-4">
              {placements.map((p: any) => (
                <Card key={p.id}>
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">
                            {p.contact ? `${p.contact.first_name || ""} ${p.contact.last_name || ""}`.trim() : "Unknown Contact"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {p.job?.name || "Unknown Job"}
                            {p.job?.crm_companies?.name && ` at ${p.job.crm_companies.name}`}
                          </p>
                        </div>
                        {p.placement_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Placed: {new Date(p.placement_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {p.salary && (
                          <Badge variant="secondary" className="gap-1">
                            <DollarSign className="h-3 w-3" />
                            Salary: ${Number(p.salary).toLocaleString()}
                          </Badge>
                        )}
                        {p.fee_amount && (
                          <Badge variant="outline" className="gap-1">
                            Fee: ${Number(p.fee_amount).toLocaleString()}
                          </Badge>
                        )}
                        {p.fee_percent && (
                          <Badge variant="outline">
                            {Number(p.fee_percent)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    {p.notes && (
                      <p className="text-sm text-muted-foreground mt-3 border-t pt-3">{p.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
