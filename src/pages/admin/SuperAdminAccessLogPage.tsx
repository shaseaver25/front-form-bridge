import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SuperAdminAccessLogPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["super-admin-access-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("super_admin_access_log")
        .select("*")
        .order("accessed_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Access Log</h1>
          <p className="text-muted-foreground">
            Transparency log of TailoredU support team access to this instance.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Access History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !logs?.length ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No support access has been recorded.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const metadata = log.metadata as Record<string, unknown> | null;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">{log.admin_email}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {metadata?.path as string || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(log.accessed_at), "MMM d, yyyy h:mm a")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
