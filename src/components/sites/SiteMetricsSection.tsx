import { useState } from "react";
import { Plus, TrendingUp, Target, Calendar, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useSiteMetrics } from "@/hooks/useSiteMetrics";
import { format } from "date-fns";
import type { SiteMetric } from "@/types/sites";

interface SiteMetricsSectionProps {
  siteId: string;
}

export function SiteMetricsSection({ siteId }: SiteMetricsSectionProps) {
  const { metrics, isLoading, createMetric, updateMetric, deleteMetric } = useSiteMetrics(siteId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<SiteMetric | null>(null);

  const [metricName, setMetricName] = useState("");
  const [metricType, setMetricType] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [measurementDate, setMeasurementDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setMetricName("");
    setMetricType("");
    setTargetValue("");
    setCurrentValue("");
    setMeasurementDate(new Date().toISOString().split('T')[0]);
    setNotes("");
    setEditingMetric(null);
  };

  const openEditDialog = (metric: SiteMetric) => {
    setEditingMetric(metric);
    setMetricName(metric.metric_name);
    setMetricType(metric.metric_type ?? "");
    setTargetValue(metric.target_value?.toString() ?? "");
    setCurrentValue(metric.current_value?.toString() ?? "");
    setMeasurementDate(metric.measurement_date);
    setNotes(metric.notes ?? "");
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!metricName) return;

    const data = {
      metric_name: metricName,
      metric_type: metricType || undefined,
      target_value: targetValue ? parseFloat(targetValue) : undefined,
      current_value: currentValue ? parseFloat(currentValue) : undefined,
      measurement_date: measurementDate,
      notes: notes || undefined,
    };

    if (editingMetric) {
      await updateMetric.mutateAsync({ id: editingMetric.id, ...data });
    } else {
      await createMetric.mutateAsync({ site_id: siteId, ...data });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Site Metrics</CardTitle>
          <CardDescription>Track outcomes and measurements at this site</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Metric
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMetric ? "Edit Metric" : "Add New Metric"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Metric Name *</Label>
                <Input
                  placeholder="e.g., Students Enrolled"
                  value={metricName}
                  onChange={(e) => setMetricName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Metric Type</Label>
                <Input
                  placeholder="e.g., Attendance, Enrollment, Outcome"
                  value={metricType}
                  onChange={(e) => setMetricType(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Target Value</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Value</Label>
                  <Input
                    type="number"
                    placeholder="75"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Measurement Date</Label>
                <Input
                  type="date"
                  value={measurementDate}
                  onChange={(e) => setMeasurementDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional context..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!metricName || createMetric.isPending || updateMetric.isPending}
                >
                  {createMetric.isPending || updateMetric.isPending ? "Saving..." : editingMetric ? "Update" : "Add Metric"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {metrics.length === 0 ? (
          <EmptyState
            type="no-data"
            entityName="Metric"
            onAction={() => setIsDialogOpen(true)}
            actionLabel="Add Metric"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric) => {
              const progress = metric.target_value && metric.current_value
                ? Math.min((metric.current_value / metric.target_value) * 100, 100)
                : null;

              return (
                <Card key={metric.id} className="relative group">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(metric)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Metric</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this metric?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMetric.mutate(metric.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{metric.metric_name}</CardTitle>
                    </div>
                    {metric.metric_type && (
                      <CardDescription>{metric.metric_type}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-2xl font-bold">
                        <span>{metric.current_value ?? 0}</span>
                        {metric.target_value && (
                          <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {metric.target_value}
                          </span>
                        )}
                      </div>
                      {progress !== null && (
                        <Progress value={progress} className="h-2" />
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(metric.measurement_date), "MMM d, yyyy")}
                      </div>
                      {metric.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{metric.notes}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
