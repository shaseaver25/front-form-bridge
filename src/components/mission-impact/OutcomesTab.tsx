import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { OutcomeMetric, OutcomeMeasurement, useCreateMetric, useRecordMeasurement } from "@/hooks/useMissionImpact";
import { Plus, TrendingUp, Calendar, Target } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface OutcomesTabProps {
  programId: string;
  metrics: OutcomeMetric[];
  measurements: OutcomeMeasurement[];
}

export function OutcomesTab({ programId, metrics, measurements }: OutcomesTabProps) {
  const [selectedMetric, setSelectedMetric] = useState<OutcomeMetric | null>(null);
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [showRecordMeasurement, setShowRecordMeasurement] = useState(false);
  
  const createMetric = useCreateMetric();
  const recordMeasurement = useRecordMeasurement();

  const [newMetric, setNewMetric] = useState({
    metric_name: "",
    metric_description: "",
    metric_type: "number",
    target_value: "",
    target_date: "",
    measurement_frequency: "monthly",
    is_key_metric: false,
  });

  const [newMeasurement, setNewMeasurement] = useState({
    measurement_date: format(new Date(), "yyyy-MM-dd"),
    actual_value: "",
    notes: "",
  });

  const handleCreateMetric = () => {
    createMetric.mutate({
      program_id: programId,
      metric_name: newMetric.metric_name,
      metric_description: newMetric.metric_description || null,
      metric_type: newMetric.metric_type,
      target_value: newMetric.target_value ? parseFloat(newMetric.target_value) : null,
      target_date: newMetric.target_date || null,
      measurement_frequency: newMetric.measurement_frequency,
      is_key_metric: newMetric.is_key_metric,
    }, {
      onSuccess: () => {
        setShowAddMetric(false);
        setNewMetric({
          metric_name: "",
          metric_description: "",
          metric_type: "number",
          target_value: "",
          target_date: "",
          measurement_frequency: "monthly",
          is_key_metric: false,
        });
      }
    });
  };

  const handleRecordMeasurement = () => {
    if (!selectedMetric) return;
    recordMeasurement.mutate({
      metric_id: selectedMetric.id,
      measurement_date: newMeasurement.measurement_date,
      actual_value: parseFloat(newMeasurement.actual_value),
      notes: newMeasurement.notes || null,
    }, {
      onSuccess: () => {
        setShowRecordMeasurement(false);
        setNewMeasurement({
          measurement_date: format(new Date(), "yyyy-MM-dd"),
          actual_value: "",
          notes: "",
        });
      }
    });
  };

  const getMetricMeasurements = (metricId: string) => {
    return measurements
      .filter(m => m.metric_id === metricId)
      .sort((a, b) => new Date(a.measurement_date).getTime() - new Date(b.measurement_date).getTime());
  };

  const metricTypeLabels: Record<string, string> = {
    number: "Number",
    percentage: "Percentage",
    currency: "Currency",
    yes_no: "Yes/No",
    rating: "Rating",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Outcome Metrics</h3>
        <Dialog open={showAddMetric} onOpenChange={setShowAddMetric}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Metric
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Outcome Metric</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Metric Name</Label>
                <Input
                  value={newMetric.metric_name}
                  onChange={(e) => setNewMetric({ ...newMetric, metric_name: e.target.value })}
                  placeholder="e.g., Students Served"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newMetric.metric_description}
                  onChange={(e) => setNewMetric({ ...newMetric, metric_description: e.target.value })}
                  placeholder="What does this metric measure?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Type</Label>
                  <Select value={newMetric.metric_type} onValueChange={(v) => setNewMetric({ ...newMetric, metric_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="currency">Currency</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Frequency</Label>
                  <Select value={newMetric.measurement_frequency} onValueChange={(v) => setNewMetric({ ...newMetric, measurement_frequency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target Value</Label>
                  <Input
                    type="number"
                    value={newMetric.target_value}
                    onChange={(e) => setNewMetric({ ...newMetric, target_value: e.target.value })}
                    placeholder="e.g., 500"
                  />
                </div>
                <div>
                  <Label>Target Date</Label>
                  <Input
                    type="date"
                    value={newMetric.target_date}
                    onChange={(e) => setNewMetric({ ...newMetric, target_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_key_metric"
                  checked={newMetric.is_key_metric}
                  onChange={(e) => setNewMetric({ ...newMetric, is_key_metric: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_key_metric">Key Metric (show on overview)</Label>
              </div>
              <Button onClick={handleCreateMetric} disabled={!newMetric.metric_name || createMetric.isPending}>
                Create Metric
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {metrics.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No outcome metrics defined yet</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowAddMetric(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Metric
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {metrics.map(metric => {
            const metricData = getMetricMeasurements(metric.id);
            const chartData = metricData.map(m => ({
              date: format(new Date(m.measurement_date), "MMM yy"),
              value: m.actual_value,
            }));
            const latestValue = metricData[metricData.length - 1]?.actual_value;

            return (
              <Card key={metric.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{metric.metric_name}</CardTitle>
                        {metric.is_key_metric && (
                          <Badge variant="secondary" className="text-xs">Key Metric</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{metric.metric_description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{metricTypeLabels[metric.metric_type]}</Badge>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedMetric(metric);
                          setShowRecordMeasurement(true);
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Record
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={150}>
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip />
                            {metric.target_value && (
                              <ReferenceLine 
                                y={metric.target_value} 
                                stroke="hsl(var(--secondary))" 
                                strokeDasharray="5 5"
                                label={{ value: "Target", position: "right", fontSize: 10 }}
                              />
                            )}
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              dot={{ fill: "hsl(var(--primary))" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                          No measurements recorded yet
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Current:</span>
                        <span className="font-semibold">
                          {latestValue?.toLocaleString() ?? "—"}
                          {metric.metric_type === "percentage" && "%"}
                        </span>
                      </div>
                      {metric.target_value && (
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Target:</span>
                          <span className="font-semibold">
                            {metric.target_value.toLocaleString()}
                            {metric.metric_type === "percentage" && "%"}
                          </span>
                        </div>
                      )}
                      {metric.target_date && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">By:</span>
                          <span>{format(new Date(metric.target_date), "MMM d, yyyy")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Record Measurement Dialog */}
      <Dialog open={showRecordMeasurement} onOpenChange={setShowRecordMeasurement}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Measurement: {selectedMetric?.metric_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={newMeasurement.measurement_date}
                onChange={(e) => setNewMeasurement({ ...newMeasurement, measurement_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Value</Label>
              <Input
                type="number"
                value={newMeasurement.actual_value}
                onChange={(e) => setNewMeasurement({ ...newMeasurement, actual_value: e.target.value })}
                placeholder={selectedMetric?.metric_type === "percentage" ? "e.g., 85" : "e.g., 150"}
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={newMeasurement.notes}
                onChange={(e) => setNewMeasurement({ ...newMeasurement, notes: e.target.value })}
                placeholder="Any context for this measurement"
              />
            </div>
            <Button 
              onClick={handleRecordMeasurement} 
              disabled={!newMeasurement.actual_value || recordMeasurement.isPending}
            >
              Save Measurement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
