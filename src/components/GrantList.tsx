import { useState, useEffect } from "react";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import GrantForm from "./GrantForm";
import TaskList from "./TaskList";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { RecordAvatar } from "@/components/ui/record-avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { ListCard } from "@/components/ui/list-card";
import { FloatingActions } from "@/components/ui/floating-actions";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { DensityToggle } from "@/components/ui/density-toggle";
import { EmptyState } from "@/components/ui/empty-state";

// Type for grant with relationships
type GrantWithRelations = any;

const GrantList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isReady } = useAuthReady();
  const [grants, setGrants] = useState<GrantWithRelations[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState<GrantWithRelations | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [tasksDialogOpen, setTasksDialogOpen] = useState(false);
  const [selectedGrantForTasks, setSelectedGrantForTasks] = useState<GrantWithRelations | null>(
    null
  );
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [initialGrantId, setInitialGrantId] = useState(() => searchParams.get("id"));

  const fetchGrants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("grant_opportunities")
      .select(
        `
        *,
        organizations(name),
        grant_deliverables(id, due_date, completed_date)
      `
      )
      .order("application_deadline", { ascending: true, nullsFirst: false });

    if (error) {
      toast.error("Failed to load grant opportunities");
    } else {
      setGrants(data || []);
    }
    setLoading(false);
  };

  const fetchOrganizations = async () => {
    const { data } = await supabase.from("organizations").select("*").order("name");

    if (data) {
      setOrganizations(data);
    }
  };

  useEffect(() => {
    fetchGrants();
    fetchOrganizations();
  }, []);

  // Auto-open grant form when navigating with ?id= parameter
  useEffect(() => {
    if (initialGrantId && grants.length > 0) {
      const grantToOpen = grants.find((g) => g.id === initialGrantId);
      if (grantToOpen) {
        setSelectedGrant(grantToOpen);
        setFormOpen(true);
        // Clear the state and URL param after opening (only run once)
        setInitialGrantId(null);
        setSearchParams({}, { replace: true });
      }
    }
  }, [initialGrantId, grants, setSearchParams]);

  const filteredGrants = grants.filter(
    (g) =>
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.organizations?.name &&
        g.organizations.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (grant: GrantWithRelations) => {
    setSelectedGrant(grant);
    setFormOpen(true);
  };

  const handleDeleteClick = (grant: GrantWithRelations) => {
    setSelectedGrant(grant);
    setDeleteDialogOpen(true);
  };

  const handleViewTasks = (grant: GrantWithRelations) => {
    setSelectedGrantForTasks(grant);
    setTasksDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedGrant) return;

    setDeleteLoading(true);
    const { error } = await supabase
      .from("grant_opportunities")
      .delete()
      .eq("id", selectedGrant.id);

    setDeleteLoading(false);
    setDeleteDialogOpen(false);

    if (error) {
      toast.error("Failed to delete job");
    } else {
      toast.success("Job deleted successfully");
      fetchGrants();
    }
  };

  const isDeadlineApproaching = (deadline: string | null) => {
    if (!deadline) return false;
    const daysUntil = Math.ceil(
      (new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil <= 30 && daysUntil >= 0;
  };

  const getDaysUntilDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUpcomingDeliverablesCount = (grant: GrantWithRelations) => {
    if (!grant.grant_deliverables) return 0;
    const now = new Date();
    return grant.grant_deliverables.filter((d) => !d.completed_date && new Date(d.due_date) >= now)
      .length;
    return grant.grant_deliverables.filter((d) => !d.completed_date && new Date(d.due_date) >= now)
      .length;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Grant Opportunities</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track funding opportunities and compliance deadlines
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DensityToggle value={density} onChange={setDensity} />
              <Button
                onClick={() => {
                  setSelectedGrant(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Grant
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <SearchFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              totalCount={grants.length}
              filteredCount={filteredGrants.length}
              placeholder="Search by title or organization..."
            />
          </div>

          {loading ? (
            <SkeletonCard type="grant" count={6} />
          ) : filteredGrants.length === 0 ? (
            <EmptyState
              type={searchTerm ? "no-results" : "no-data"}
              searchTerm={searchTerm}
              entityName="Grant"
              onAction={
                !searchTerm
                  ? () => {
                      setSelectedGrant(null);
                      setFormOpen(true);
                    }
                  : undefined
              }
              actionLabel="Add Grant"
            />
          ) : (
            <div
              className={
                density === "comfortable"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in"
                  : "space-y-3 animate-fade-in"
              }
            >
              {filteredGrants.map((grant) => {
                const deadline = grant.application_deadline || grant.submission_deadline;
                const daysUntil = getDaysUntilDeadline(deadline);
                const isApproaching = isDeadlineApproaching(deadline);
                const upcomingDeliverables = getUpcomingDeliverablesCount(grant);

                return (
                  <ListCard key={grant.id} className={density === "compact" ? "p-4" : ""}>
                    <FloatingActions
                      onEdit={() => handleEdit(grant)}
                      onDelete={() => handleDeleteClick(grant)}
                      onMore={() => handleViewTasks(grant)}
                    />

                    <div className="flex items-start gap-4">
                      <RecordAvatar
                        type="grant"
                        status={grant.status_stage}
                        size={density === "compact" ? "sm" : "md"}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className={`font-semibold text-foreground truncate ${density === "compact" ? "text-base" : "text-lg"}`}
                          >
                            {grant.title}
                          </h3>
                          {grant.is_renewal && (
                            <span className="shrink-0 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              Renewal
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {grant.organizations?.name || "No organization"}
                        </p>
                        {grant.program_areas && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {grant.program_areas}
                          </p>
                        )}

                        {density === "comfortable" && (
                          <>
                            <div className="mt-2 flex items-center gap-2">
                              <StatusBadge status={grant.status_stage} type="grant" />
                              {grant.priority && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    grant.priority === "high"
                                      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                      : grant.priority === "medium"
                                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {grant.priority}
                                </span>
                              )}
                            </div>

                            <div className="h-px bg-border my-4" />

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                  Deadline
                                </p>
                                {deadline ? (
                                  <div className="flex items-center gap-1">
                                    {isApproaching && (
                                      <AlertCircle className="w-3 h-3 text-orange-500 shrink-0" />
                                    )}
                                    <div>
                                      <p className="text-sm font-medium">
                                        {new Date(deadline).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                        })}
                                      </p>
                                      {isApproaching && daysUntil !== null && (
                                        <p className="text-xs text-orange-600">{daysUntil} days</p>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">—</p>
                                )}
                              </div>

                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                                  Amount
                                </p>
                                <p className="font-mono font-semibold text-primary text-sm">
                                  {grant.awarded_amount
                                    ? `$${Number(grant.awarded_amount).toLocaleString()}`
                                    : grant.requested_amount
                                      ? `$${Number(grant.requested_amount).toLocaleString()}`
                                      : "—"}
                                </p>
                              </div>
                            </div>

                            {upcomingDeliverables > 0 && (
                              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-900">
                                <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
                                  <Calendar className="w-3 h-3" />
                                  <span className="font-medium">
                                    {upcomingDeliverables} upcoming{" "}
                                    {upcomingDeliverables === 1 ? "deliverable" : "deliverables"}
                                  </span>
                                </div>
                              </div>
                            )}

                            {grant.status_stage === "awarded" &&
                              grant.compliance_reporting_deadline && (
                                <div className="mt-2 p-3 bg-primary/5 rounded-md border border-primary/10">
                                  <div className="flex items-center gap-2 text-xs text-primary">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span className="font-medium">
                                      Compliance due{" "}
                                      {new Date(
                                        grant.compliance_reporting_deadline
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              )}
                          </>
                        )}

                        {density === "compact" && (
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <StatusBadge
                              status={grant.status_stage}
                              type="grant"
                              showIcon={false}
                            />
                            {deadline && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {new Date(deadline).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                            {upcomingDeliverables > 0 && (
                              <span className="text-amber-600 dark:text-amber-400">
                                {upcomingDeliverables} due
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </ListCard>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <GrantForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={fetchGrants}
        grant={selectedGrant}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedGrant?.title}" from your database. This action
              cannot be undone.
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

      <Dialog open={tasksDialogOpen} onOpenChange={setTasksDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Tasks for {selectedGrantForTasks?.title}</DialogTitle>
          </DialogHeader>
          {selectedGrantForTasks && <TaskList grantId={selectedGrantForTasks.id} showAll={true} />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GrantList;
