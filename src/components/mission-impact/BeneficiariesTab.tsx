import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProgramBeneficiary, useCreateBeneficiaryRecord } from "@/hooks/useMissionImpact";
import { Plus, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts";

interface BeneficiariesTabProps {
  programId: string;
  beneficiaries: ProgramBeneficiary[];
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(210, 70%, 60%)",
  "hsl(280, 60%, 55%)",
  "hsl(30, 80%, 55%)",
];

export function BeneficiariesTab({ programId, beneficiaries }: BeneficiariesTabProps) {
  const [showAddRecord, setShowAddRecord] = useState(false);
  const createRecord = useCreateBeneficiaryRecord();

  const [newRecord, setNewRecord] = useState({
    period_start: "",
    period_end: "",
    total_served: "",
    unique_individuals: "",
    notes: "",
  });

  const handleCreateRecord = () => {
    createRecord.mutate({
      program_id: programId,
      period_start: newRecord.period_start,
      period_end: newRecord.period_end,
      total_served: parseInt(newRecord.total_served),
      unique_individuals: newRecord.unique_individuals ? parseInt(newRecord.unique_individuals) : null,
      notes: newRecord.notes || null,
    }, {
      onSuccess: () => {
        setShowAddRecord(false);
        setNewRecord({
          period_start: "",
          period_end: "",
          total_served: "",
          unique_individuals: "",
          notes: "",
        });
      }
    });
  };

  // Aggregate demographics from all periods
  const aggregateDemographics = () => {
    const demographics: Record<string, Record<string, number>> = {};
    
    beneficiaries.forEach(b => {
      if (b.demographic_data && typeof b.demographic_data === "object") {
        Object.entries(b.demographic_data).forEach(([category, values]) => {
          if (typeof values === "object" && values !== null) {
            if (!demographics[category]) demographics[category] = {};
            Object.entries(values as Record<string, number>).forEach(([key, value]) => {
              demographics[category][key] = (demographics[category][key] || 0) + (value as number);
            });
          }
        });
      }
    });
    
    return demographics;
  };

  const demographics = aggregateDemographics();
  
  const totalServed = beneficiaries.reduce((sum, b) => sum + b.total_served, 0);

  // Prepare chart data
  const timelineData = [...beneficiaries]
    .sort((a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime())
    .map(b => ({
      period: format(new Date(b.period_start), "MMM yy"),
      served: b.total_served,
      unique: b.unique_individuals || 0,
    }));

  const preparePieData = (data: Record<string, number>) => {
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Beneficiaries</h3>
        <Dialog open={showAddRecord} onOpenChange={setShowAddRecord}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Beneficiary Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Period Start</Label>
                  <Input
                    type="date"
                    value={newRecord.period_start}
                    onChange={(e) => setNewRecord({ ...newRecord, period_start: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Period End</Label>
                  <Input
                    type="date"
                    value={newRecord.period_end}
                    onChange={(e) => setNewRecord({ ...newRecord, period_end: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total Served</Label>
                  <Input
                    type="number"
                    value={newRecord.total_served}
                    onChange={(e) => setNewRecord({ ...newRecord, total_served: e.target.value })}
                    placeholder="e.g., 150"
                  />
                </div>
                <div>
                  <Label>Unique Individuals</Label>
                  <Input
                    type="number"
                    value={newRecord.unique_individuals}
                    onChange={(e) => setNewRecord({ ...newRecord, unique_individuals: e.target.value })}
                    placeholder="e.g., 120"
                  />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newRecord.notes}
                  onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                  placeholder="Any notes about this period"
                />
              </div>
              <Button 
                onClick={handleCreateRecord} 
                disabled={!newRecord.period_start || !newRecord.period_end || !newRecord.total_served || createRecord.isPending}
              >
                Add Record
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalServed.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Served</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{beneficiaries.length}</p>
                <p className="text-sm text-muted-foreground">Reporting Periods</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {beneficiaries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No beneficiary data recorded yet</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowAddRecord(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Record
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Beneficiaries Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="served" name="Total Served" fill="hsl(var(--primary))" />
                  <Bar dataKey="unique" name="Unique Individuals" fill="hsl(var(--secondary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Demographics Charts */}
          {Object.keys(demographics).length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(demographics).map(([category, data]) => (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm capitalize">{category.replace("_", " ")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={preparePieData(data)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {preparePieData(data).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Period Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Period</th>
                      <th className="text-right py-2 px-3 font-medium">Total Served</th>
                      <th className="text-right py-2 px-3 font-medium">Unique</th>
                      <th className="text-left py-2 px-3 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beneficiaries.map(b => (
                      <tr key={b.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">
                          {format(new Date(b.period_start), "MMM d")} - {format(new Date(b.period_end), "MMM d, yyyy")}
                        </td>
                        <td className="py-2 px-3 text-right font-medium">{b.total_served.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right">{b.unique_individuals?.toLocaleString() ?? "—"}</td>
                        <td className="py-2 px-3 text-muted-foreground">{b.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
