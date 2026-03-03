import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2, Filter, Upload, MailX } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ConstituentForm from "./ConstituentForm";
import ConstituentDetail from "./ConstituentDetail";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { RecordAvatar } from "@/components/ui/record-avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { ListCard } from "@/components/ui/list-card";
import { FloatingActions } from "@/components/ui/floating-actions";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { SearchFilterBar, FilterChip } from "@/components/ui/search-filter-bar";
import { DensityToggle } from "@/components/ui/density-toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { BulkImportConstituents } from "./constituents/BulkImportConstituents";
import { BulkEmailCleanup } from "./constituents/BulkEmailCleanup";

type Constituent = any;

const ConstituentList = () => {
  const [constituents, setConstituents] = useState<Constituent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConstituent, setSelectedConstituent] = useState<Constituent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [lybuntFilter, setLybuntFilter] = useState(false);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [importOpen, setImportOpen] = useState(false);
  const [cleanupOpen, setCleanupOpen] = useState(false);

  const fetchConstituents = async () => {
    setLoading(true);

    if (lybuntFilter) {
      const currentYear = new Date().getFullYear();
      const prevYearStart = `${currentYear - 1}-01-01`;
      const prevYearEnd = `${currentYear - 1}-12-31`;
      const currentYearStart = `${currentYear}-01-01`;
      const currentYearEnd = `${currentYear}-12-31`;

      const { data: allConstituents, error: constituentError } = await supabase
        .from("constituents_with_ltv")
        .select("*");

      if (constituentError) {
        toast.error("Failed to load constituents");
        setLoading(false);
        return;
      }

      const lybuntConstituents = [];
      for (const constituent of allConstituents || []) {
        const { data: prevYearGifts } = await supabase
          .from("gifts")
          .select("amount")
          .eq("constituent_id", constituent.id)
          .gte("date_received", prevYearStart)
          .lte("date_received", prevYearEnd);

        const { data: currentYearGifts } = await supabase
          .from("gifts")
          .select("amount")
          .eq("constituent_id", constituent.id)
          .gte("date_received", currentYearStart)
          .lte("date_received", currentYearEnd);

        const prevYearTotal = (prevYearGifts || []).reduce(
          (sum, gift) => sum + parseFloat(gift.amount.toString()),
          0
        );
        const currentYearTotal = (currentYearGifts || []).reduce(
          (sum, gift) => sum + parseFloat(gift.amount.toString()),
          0
        );

        if (prevYearTotal >= 1.0 && currentYearTotal === 0) {
          lybuntConstituents.push({
            ...constituent,
            prev_year_total: prevYearTotal,
            current_year_total: currentYearTotal,
          });
        }
      }

      setConstituents(lybuntConstituents);
    } else {
      const { data, error } = await supabase
        .from("constituents_with_ltv")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load constituents");
      } else {
        setConstituents(data || []);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConstituents();
  }, [lybuntFilter]);

  const filteredConstituents = constituents.filter(
    (c) =>
      c.full_legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.primary_email && c.primary_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (constituent: Constituent) => {
    setSelectedConstituent(constituent);
    setFormOpen(true);
  };

  const handleView = (constituent: Constituent) => {
    setSelectedConstituent(constituent);
    setDetailOpen(true);
  };

  const handleDeleteClick = (constituent: Constituent) => {
    setSelectedConstituent(constituent);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedConstituent) return;

    setDeleteLoading(true);
    const { error } = await supabase.from("constituents").delete().eq("id", selectedConstituent.id);

    setDeleteLoading(false);
    setDeleteDialogOpen(false);

    if (error) {
      toast.error("Failed to delete constituent");
    } else {
      toast.success("Contact deleted successfully");
      fetchConstituents();
    }
  };

  const activeFilters: FilterChip[] = lybuntFilter
    ? [{ id: "lybunt", label: "Returning Clients Filter Active" }]
    : [];

  const handleClearFilters = () => {
    setSearchTerm("");
    setLybuntFilter(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Contacts</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your contacts and client database
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DensityToggle value={density} onChange={setDensity} />
              <Button variant="outline" onClick={() => setCleanupOpen(true)}>
                <MailX className="w-4 h-4 mr-2" />
                Clean Emails
              </Button>
              <Button variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
              <Button
                onClick={() => {
                  setSelectedConstituent(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <SearchFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filters={activeFilters}
              onFilterRemove={() => setLybuntFilter(false)}
              onClearAll={handleClearFilters}
              totalCount={constituents.length}
              filteredCount={filteredConstituents.length}
              placeholder="Search by name or email..."
            />

            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="lybunt-filter" className="flex-1 cursor-pointer">
                <div className="font-medium">Returning Clients</div>
                <div className="text-xs text-muted-foreground">
                  Clients who were active last year but have no activity this year
                </div>
              </Label>
              <Switch id="lybunt-filter" checked={lybuntFilter} onCheckedChange={setLybuntFilter} />
            </div>
          </div>

          {loading ? (
            <SkeletonCard type="constituent" count={6} />
          ) : filteredConstituents.length === 0 ? (
            <EmptyState
              type={searchTerm || lybuntFilter ? "no-results" : "no-data"}
              searchTerm={searchTerm}
              entityName="Contact"
              onAction={
                !searchTerm && !lybuntFilter
                  ? () => {
                      setSelectedConstituent(null);
                      setFormOpen(true);
                    }
                  : undefined
              }
              actionLabel="Add Contact"
            />
          ) : (
            <div
              className={
                density === "comfortable"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in"
                  : "space-y-3 animate-fade-in"
              }
            >
              {filteredConstituents.map((constituent) => (
                <ListCard
                  key={constituent.id}
                  onClick={() => handleView(constituent)}
                  className={density === "compact" ? "p-4" : ""}
                >
                  <FloatingActions
                    onView={() => handleView(constituent)}
                    onEdit={() => handleEdit(constituent)}
                    onDelete={() => handleDeleteClick(constituent)}
                  />

                  <div className="flex items-start gap-4">
                    <RecordAvatar
                      type="constituent"
                      name={constituent.full_legal_name}
                      size={density === "compact" ? "sm" : "md"}
                    />

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold text-foreground truncate ${density === "compact" ? "text-base" : "text-lg"}`}
                      >
                        {constituent.full_legal_name}
                      </h3>
                      {constituent.employer && (
                        <p className="text-sm font-medium text-muted-foreground truncate">
                          {constituent.employer}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground truncate">
                        {constituent.primary_email || "No email"}
                      </p>

                      {density === "comfortable" && (
                        <>
                          {constituent.communication_preference && (
                            <div className="mt-2">
                              <StatusBadge
                                status={constituent.communication_preference}
                                type="communication"
                              />
                            </div>
                          )}

                          <div className="h-px bg-border my-4" />

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                Total LTV
                              </p>
                              <p className="font-mono font-semibold text-primary">
                                $
                                {Number(constituent.total_ltv || 0).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                            </div>

                            {lybuntFilter && (
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                  Prev Year
                                </p>
                                <p className="font-mono font-semibold text-secondary">
                                  $
                                  {Number((constituent as Record<string, unknown>).prev_year_total || 0).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {density === "compact" && (
                        <div className="flex items-center gap-4 mt-2">
                          <span className="font-mono text-sm font-semibold text-primary">
                            $
                            {Number(constituent.total_ltv || 0).toLocaleString("en-US", {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                          {constituent.communication_preference && (
                            <StatusBadge
                              status={constituent.communication_preference}
                              type="communication"
                              showIcon={false}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </ListCard>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConstituentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={fetchConstituents}
        constituent={selectedConstituent}
      />

      <ConstituentDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        constituent={selectedConstituent}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedConstituent?.full_legal_name} from your
              database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkImportConstituents
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={fetchConstituents}
      />

      <BulkEmailCleanup
        open={cleanupOpen}
        onOpenChange={setCleanupOpen}
        onSuccess={fetchConstituents}
      />
    </>
  );
};

export default ConstituentList;
