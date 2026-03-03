import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Plus, DollarSign, TrendingUp, CheckCircle, Target, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useBurndownIncomeEntries,
  useBurndownIncomeCategories,
  useUpdateBurndownIncomeEntry,
  useDeleteBurndownIncomeEntry,
} from "@/hooks/useBurndownData";
import {
  BurndownIncomeEntry,
  INCOME_CATEGORY_TYPES,
  INCOME_CATEGORY_LABELS,
  INCOME_STATUS_LABELS,
  IncomeCategoryType,
  IncomeStatus,
} from "@/types/burndown";
import { formatCurrency } from "@/utils/burndown-calculations";
import { IncomeEntryForm } from "./IncomeEntryForm";

import type { FiscalYearFilter } from "@/pages/BurndownCalculator";

interface IncomeManagerProps {
  orgId: string;
  fiscalYearFilter?: FiscalYearFilter | null;
}

export function IncomeManager({ orgId, fiscalYearFilter }: IncomeManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<IncomeCategoryType | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<IncomeStatus | "all">("all");
  const [showSyncedOnly, setShowSyncedOnly] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BurndownIncomeEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<BurndownIncomeEntry | null>(null);
  const [sortField, setSortField] = useState<keyof BurndownIncomeEntry>("expected_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { data: allIncomeEntries = [], isLoading } = useBurndownIncomeEntries(orgId);
  const { data: categories = [] } = useBurndownIncomeCategories(orgId);
  const updateMutation = useUpdateBurndownIncomeEntry();
  const deleteMutation = useDeleteBurndownIncomeEntry();

  // Filter by fiscal year first
  const incomeEntries = useMemo(() => {
    if (!fiscalYearFilter) return allIncomeEntries;
    return allIncomeEntries.filter((entry) => {
      const entryDate = entry.expected_date;
      return entryDate >= fiscalYearFilter.startDate && entryDate <= fiscalYearFilter.endDate;
    });
  }, [allIncomeEntries, fiscalYearFilter]);

  // Calculate summaries
  const summaries = useMemo(() => {
    const totalProjected = incomeEntries
      .filter((e) => e.status === "projected")
      .reduce((sum, e) => sum + e.amount, 0);
    
    const totalConfirmed = incomeEntries
      .filter((e) => e.status === "confirmed")
      .reduce((sum, e) => sum + e.amount, 0);
    
    const totalReceived = incomeEntries
      .filter((e) => e.status === "received")
      .reduce((sum, e) => sum + e.amount, 0);
    
    const weightedPipeline = incomeEntries
      .filter((e) => e.status === "projected")
      .reduce((sum, e) => sum + e.amount * (e.probability_percent / 100), 0);
    
    return { totalProjected, totalConfirmed, totalReceivedYTD: totalReceived, weightedPipeline };
  }, [incomeEntries]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: incomeEntries.length };
    INCOME_CATEGORY_TYPES.forEach((type) => {
      counts[type] = incomeEntries.filter(
        (e) => e.category?.category_type === type
      ).length;
    });
    return counts;
  }, [incomeEntries]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let entries = [...incomeEntries];
    
    if (selectedCategory !== "all") {
      entries = entries.filter((e) => e.category?.category_type === selectedCategory);
    }
    
    if (selectedStatus !== "all") {
      entries = entries.filter((e) => e.status === selectedStatus);
    }
    
    if (showSyncedOnly) {
      entries = entries.filter((e) => e.is_synced);
    }
    
    // Sort
    entries.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    
    return entries;
  }, [incomeEntries, selectedCategory, selectedStatus, showSyncedOnly, sortField, sortDirection]);

  const handleSort = (field: keyof BurndownIncomeEntry) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleStatusChange = async (entry: BurndownIncomeEntry, newStatus: IncomeStatus) => {
    try {
      await updateMutation.mutateAsync({
        id: entry.id,
        status: newStatus,
      });
      toast.success("Status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;
    try {
      await deleteMutation.mutateAsync({ id: deletingEntry.id, orgId });
      toast.success("Income entry deleted");
      setDeletingEntry(null);
    } catch (error) {
      toast.error("Failed to delete entry");
    }
  };

  const getStatusBadgeVariant = (status: IncomeStatus) => {
    switch (status) {
      case "received":
        return "default";
      case "confirmed":
        return "secondary";
      case "projected":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projected</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaries.totalProjected)}</div>
            <p className="text-xs text-muted-foreground">Pending income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaries.totalConfirmed)}</div>
            <p className="text-xs text-muted-foreground">Awaiting receipt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received YTD</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summaries.totalReceivedYTD)}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weighted Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaries.weightedPipeline)}</div>
            <p className="text-xs text-muted-foreground">Projected × probability</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category chips */}
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            All ({categoryCounts.all})
          </Button>
          {INCOME_CATEGORY_TYPES.map((type) => (
            <Button
              key={type}
              variant={selectedCategory === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(type)}
            >
              {INCOME_CATEGORY_LABELS[type]} ({categoryCounts[type] || 0})
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {/* Status filter */}
          <Select
            value={selectedStatus}
            onValueChange={(v) => setSelectedStatus(v as IncomeStatus | "all")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="projected">Projected</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="received">Received</SelectItem>
            </SelectContent>
          </Select>

          {/* Synced toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="synced-filter"
              checked={showSyncedOnly}
              onCheckedChange={setShowSyncedOnly}
            />
            <Label htmlFor="synced-filter" className="text-sm">Synced only</Label>
          </div>

          {/* Add button */}
          <Button
            onClick={() => {
              setEditingEntry(null);
              setIsFormOpen(true);
            }}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Income
          </Button>
        </div>
      </div>

      {/* Income Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No income entries yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first income source or sync from CRM.
              </p>
              <Button
                onClick={() => {
                  setEditingEntry(null);
                  setIsFormOpen(true);
                }}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Income
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("source_name")}
                  >
                    Source {sortField === "source_name" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort("amount")}
                  >
                    Amount {sortField === "amount" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("expected_date")}
                  >
                    Expected Date {sortField === "expected_date" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Probability</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {entry.source_name || entry.description || "—"}
                        {entry.is_synced && (
                          <Badge variant="outline" className="text-xs">
                            CRM
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.category ? (
                        <Badge variant="secondary">
                          {INCOME_CATEGORY_LABELS[entry.category.category_type as IncomeCategoryType]}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(entry.expected_date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {entry.is_synced ? (
                        <Badge variant={getStatusBadgeVariant(entry.status)}>
                          {INCOME_STATUS_LABELS[entry.status]}
                        </Badge>
                      ) : (
                        <Select
                          value={entry.status}
                          onValueChange={(v) => handleStatusChange(entry, v as IncomeStatus)}
                        >
                          <SelectTrigger className="h-8 w-[110px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="projected">Projected</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="received">Received</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.probability_percent}%
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!entry.is_synced && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingEntry(entry);
                              setIsFormOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingEntry(entry)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Form Sheet */}
      <IncomeEntryForm
        orgId={orgId}
        categories={categories}
        entry={editingEntry}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEntry} onOpenChange={() => setDeletingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this income entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
