import { useState, useMemo } from "react";
import { format, isBefore, startOfDay } from "date-fns";
import {
  Plus,
  ArrowDownCircle,
  DollarSign,
  Users,
  Clock,
  Repeat,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useBurndownExpenseEntries,
  useBurndownExpenseCategories,
  useUpdateBurndownExpenseEntry,
  useDeleteBurndownExpenseEntry,
} from "@/hooks/useBurndownData";
import {
  BurndownExpenseEntry,
  EXPENSE_CATEGORY_TYPES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  ExpenseCategoryType,
  ExpenseStatus,
} from "@/types/burndown";
import { formatCurrency } from "@/utils/burndown-calculations";
import { ExpenseEntryForm } from "./ExpenseEntryForm";

import type { FiscalYearFilter } from "@/pages/BurndownCalculator";

interface ExpenseManagerProps {
  orgId: string;
  fiscalYearFilter?: FiscalYearFilter | null;
}

export function ExpenseManager({ orgId, fiscalYearFilter }: ExpenseManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategoryType | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<ExpenseStatus | "all">("all");
  const [fixedFilter, setFixedFilter] = useState<"all" | "fixed" | "variable">("all");
  const [showSyncedOnly, setShowSyncedOnly] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BurndownExpenseEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<BurndownExpenseEntry | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<keyof BurndownExpenseEntry>("due_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [payrollOpen, setPayrollOpen] = useState(false);

  const { data: allExpenseEntries = [], isLoading } = useBurndownExpenseEntries(orgId);
  const { data: categories = [] } = useBurndownExpenseCategories(orgId);
  const updateMutation = useUpdateBurndownExpenseEntry();
  const deleteMutation = useDeleteBurndownExpenseEntry();

  // Filter by fiscal year first
  const expenseEntries = useMemo(() => {
    if (!fiscalYearFilter) return allExpenseEntries;
    return allExpenseEntries.filter((entry) => {
      const entryDate = entry.due_date;
      return entryDate >= fiscalYearFilter.startDate && entryDate <= fiscalYearFilter.endDate;
    });
  }, [allExpenseEntries, fiscalYearFilter]);

  // Calculate summaries
  const summaries = useMemo(() => {
    const fixedEntries = expenseEntries.filter((e) => e.category?.is_fixed);
    const variableEntries = expenseEntries.filter((e) => !e.category?.is_fixed);
    const payrollEntries = expenseEntries.filter((e) => e.category?.category_type === "payroll");

    // Get unique months for averaging
    const months = new Set(
      expenseEntries.map((e) => format(new Date(e.due_date), "yyyy-MM"))
    );
    const monthCount = Math.max(months.size, 1);

    const monthlyFixed = fixedEntries.reduce((sum, e) => sum + e.amount, 0) / monthCount;
    const monthlyVariable = variableEntries.reduce((sum, e) => sum + e.amount, 0) / monthCount;

    const totalOutstanding = expenseEntries
      .filter((e) => e.status !== "paid")
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpenses = expenseEntries.reduce((sum, e) => sum + e.amount, 0);
    const totalPayroll = payrollEntries.reduce((sum, e) => sum + e.amount, 0);
    const payrollPercent = totalExpenses > 0 ? (totalPayroll / totalExpenses) * 100 : 0;

    return { monthlyFixed, monthlyVariable, totalOutstanding, payrollPercent, totalPayroll };
  }, [expenseEntries]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: expenseEntries.length };
    EXPENSE_CATEGORY_TYPES.forEach((type) => {
      counts[type] = expenseEntries.filter(
        (e) => e.category?.category_type === type
      ).length;
    });
    return counts;
  }, [expenseEntries]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let entries = [...expenseEntries];

    if (selectedCategory !== "all") {
      entries = entries.filter((e) => e.category?.category_type === selectedCategory);
    }

    if (selectedStatus !== "all") {
      entries = entries.filter((e) => e.status === selectedStatus);
    }

    if (fixedFilter === "fixed") {
      entries = entries.filter((e) => e.category?.is_fixed);
    } else if (fixedFilter === "variable") {
      entries = entries.filter((e) => !e.category?.is_fixed);
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
  }, [expenseEntries, selectedCategory, selectedStatus, fixedFilter, showSyncedOnly, sortField, sortDirection]);

  // Payroll entries for the breakdown panel
  const payrollEntries = useMemo(
    () => expenseEntries.filter((e) => e.category?.category_type === "payroll"),
    [expenseEntries]
  );

  const handleSort = (field: keyof BurndownExpenseEntry) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleStatusChange = async (entry: BurndownExpenseEntry, newStatus: ExpenseStatus) => {
    try {
      await updateMutation.mutateAsync({
        id: entry.id,
        status: newStatus,
        paid_date: newStatus === "paid" ? format(new Date(), "yyyy-MM-dd") : null,
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
      toast.success("Expense entry deleted");
      setDeletingEntry(null);
    } catch (error) {
      toast.error("Failed to delete entry");
    }
  };

  const handleBulkMarkPaid = async () => {
    try {
      const promises = Array.from(selectedIds).map((id) =>
        updateMutation.mutateAsync({
          id,
          status: "paid" as ExpenseStatus,
          paid_date: format(new Date(), "yyyy-MM-dd"),
        })
      );
      await Promise.all(promises);
      toast.success(`${selectedIds.size} items marked as paid`);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error("Failed to update some entries");
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEntries.filter((e) => !e.is_synced).length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEntries.filter((e) => !e.is_synced).map((e) => e.id)));
    }
  };

  const isOverdue = (entry: BurndownExpenseEntry) => {
    if (entry.status === "paid") return false;
    return isBefore(new Date(entry.due_date), startOfDay(new Date()));
  };

  const getStatusBadgeVariant = (status: ExpenseStatus) => {
    switch (status) {
      case "paid":
        return "default";
      case "approved":
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
            <CardTitle className="text-sm font-medium">Monthly Fixed Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaries.monthlyFixed)}</div>
            <p className="text-xs text-muted-foreground">Rent, utilities, etc.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Variable Costs</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaries.monthlyVariable)}</div>
            <p className="text-xs text-muted-foreground">Program costs, supplies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(summaries.totalOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground">Projected + approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payroll % of Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaries.payrollPercent.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summaries.totalPayroll)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            All ({categoryCounts.all})
          </Button>
          {EXPENSE_CATEGORY_TYPES.map((type) => (
            <Button
              key={type}
              variant={selectedCategory === type ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(type)}
            >
              {EXPENSE_CATEGORY_LABELS[type]} ({categoryCounts[type] || 0})
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Fixed/Variable toggle */}
          <Select value={fixedFilter} onValueChange={(v) => setFixedFilter(v as typeof fixedFilter)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="fixed">Fixed Only</SelectItem>
              <SelectItem value="variable">Variable Only</SelectItem>
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select
            value={selectedStatus}
            onValueChange={(v) => setSelectedStatus(v as ExpenseStatus | "all")}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="projected">Projected</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>

          {/* Synced toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="synced-filter-expense"
              checked={showSyncedOnly}
              onCheckedChange={setShowSyncedOnly}
            />
            <Label htmlFor="synced-filter-expense" className="text-sm">QB Only</Label>
          </div>

          {/* Add button */}
          <Button
            onClick={() => {
              setEditingEntry(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedIds.size} item(s) selected</span>
          <Button size="sm" onClick={handleBulkMarkPaid}>
            <Check className="w-4 h-4 mr-2" />
            Mark as Paid
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            Clear Selection
          </Button>
        </div>
      )}

      {/* Expense Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <ArrowDownCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No expense entries yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first expense or sync from QuickBooks.
              </p>
              <Button
                onClick={() => {
                  setEditingEntry(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        selectedIds.size > 0 &&
                        selectedIds.size === filteredEntries.filter((e) => !e.is_synced).length
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("description")}
                  >
                    Description {sortField === "description" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort("amount")}
                  >
                    Amount {sortField === "amount" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("due_date")}
                  >
                    Due Date {sortField === "due_date" && (sortDirection === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className={cn(isOverdue(entry) && "bg-red-50 dark:bg-red-950/20")}
                  >
                    <TableCell>
                      {!entry.is_synced && (
                        <Checkbox
                          checked={selectedIds.has(entry.id)}
                          onCheckedChange={() => toggleSelection(entry.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {entry.description || "—"}
                        {entry.is_synced && (
                          <Badge variant="outline" className="text-xs">
                            QB
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.vendor_name || "—"}
                    </TableCell>
                    <TableCell>
                      {entry.category ? (
                        <Badge variant="secondary">
                          {EXPENSE_CATEGORY_LABELS[entry.category.category_type as ExpenseCategoryType]}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell>
                      <span className={cn(isOverdue(entry) && "text-red-600 font-medium")}>
                        {format(new Date(entry.due_date), "MMM d, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>
                      {entry.is_synced ? (
                        <Badge variant={getStatusBadgeVariant(entry.status)}>
                          {EXPENSE_STATUS_LABELS[entry.status]}
                        </Badge>
                      ) : (
                        <Select
                          value={entry.status}
                          onValueChange={(v) => handleStatusChange(entry, v as ExpenseStatus)}
                        >
                          <SelectTrigger className="h-8 w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="projected">Projected</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.is_recurring && (
                        <Repeat className="w-4 h-4 text-muted-foreground" />
                      )}
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

      {/* Payroll Summary Panel */}
      {payrollEntries.length > 0 && (
        <Collapsible open={payrollOpen} onOpenChange={setPayrollOpen}>
          <Card className="bg-muted/30">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Payroll Breakdown
                  </CardTitle>
                  {payrollOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Payroll entries list */}
                  <div className="space-y-2">
                    {payrollEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                      >
                        <div>
                          <p className="font-medium">{entry.description || entry.vendor_name || "Payroll"}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {format(new Date(entry.due_date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(entry.amount)}</p>
                          <Badge variant={getStatusBadgeVariant(entry.status)} className="text-xs">
                            {EXPENSE_STATUS_LABELS[entry.status]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Monthly</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(summaries.totalPayroll / Math.max(payrollEntries.length, 1))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Annualized</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(summaries.totalPayroll * 12 / Math.max(payrollEntries.length, 1))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">% of Budget</p>
                      <p className="text-lg font-bold">{summaries.payrollPercent.toFixed(1)}%</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground italic">
                    Payroll represents {summaries.payrollPercent.toFixed(1)}% of your total expenses.
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Add/Edit Form Sheet */}
      <ExpenseEntryForm
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
            <AlertDialogTitle>Delete Expense Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense entry? This action cannot be undone.
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
