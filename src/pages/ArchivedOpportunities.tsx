import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Archive, RotateCcw, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { RestoreOpportunityDialog } from "@/components/pipeline/RestoreOpportunityDialog";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useNavigate } from "react-router-dom";

interface ArchivedOpportunity {
  id: string;
  constituent_id: string;
  stage: string;
  expected_amount: number | null;
  expected_date: string | null;
  probability_percent: number | null;
  archived_at: string;
  archived_by: string | null;
  archive_reason: string | null;
  constituents: {
    full_legal_name: string;
  } | null;
}

const ArchivedOpportunities = () => {
  const [opportunities, setOpportunities] = useState<ArchivedOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArchivedOpportunity | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchArchivedOpportunities();
  }, []);

  const fetchArchivedOpportunities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("major_gift_opportunities")
        .select(`
          *,
          constituents (
            full_legal_name
          )
        `)
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error: unknown) {
      console.error("Error fetching archived opportunities:", error);
      toast.error("Failed to load archived opportunities");
    } finally {
      setLoading(false);
    }
  };

  const filteredOpportunities = opportunities.filter((opp) =>
    opp.constituents?.full_legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.archive_reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRestoreClick = (opportunity: ArchivedOpportunity) => {
    setSelectedOpportunity(opportunity);
    setRestoreDialogOpen(true);
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/major-gifts")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Archive className="h-8 w-8 text-muted-foreground" />
              Archived Opportunities
            </h1>
            <p className="text-muted-foreground mt-1">
              View and restore archived major gift opportunities
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Archived Pipeline Records</CardTitle>
            <CardDescription>
              These opportunities have been removed from active views. Only admins can view and restore them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <SkeletonCard type="major-gift" count={5} />
            ) : filteredOpportunities.length === 0 ? (
              <EmptyState
                type={searchTerm ? "no-results" : "no-data"}
                searchTerm={searchTerm}
                entityName="Archived Opportunity"
              />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Constituent</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Expected Amount</TableHead>
                      <TableHead>Archived Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOpportunities.map((opp) => (
                      <TableRow key={opp.id} className="group">
                        <TableCell className="font-medium">
                          {opp.constituents?.full_legal_name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {opp.stage.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(opp.expected_amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(opp.archived_at)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground italic">
                          {opp.archive_reason || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestoreClick(opp)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredOpportunities.length} of {opportunities.length} archived opportunities
            </div>
          </CardContent>
        </Card>
      </div>

      <RestoreOpportunityDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        opportunity={selectedOpportunity ? {
          id: selectedOpportunity.id,
          name: selectedOpportunity.constituents?.full_legal_name || "Unknown"
        } : null}
        onSuccess={fetchArchivedOpportunities}
      />
    </Layout>
  );
};

export default ArchivedOpportunities;
