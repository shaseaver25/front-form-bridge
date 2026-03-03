import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Copy, Trash2, Calculator, TrendingUp, TrendingDown, Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useBurndownScenarios, useCreateScenario, useUpdateScenario, useDeleteScenario, useDuplicateScenario, ExtendedScenarioAdjustments, ScenarioEvent } from '@/hooks/useScenarioData';
import { useBurndownDashboardData } from '@/hooks/useBurndownData';
import { calculateBurndownProjection, calculateBurndownSummary, formatCurrency, formatRunway, getRunwayStatusColor } from '@/utils/burndown-calculations';
import { BurndownScenario, BurndownIncomeEntry, BurndownExpenseEntry } from '@/types/burndown';
import { Label } from '@/components/ui/label';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine, Legend } from 'recharts';
import { format, parseISO, addYears, isBefore, startOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

import type { FiscalYearFilter } from "@/pages/BurndownCalculator";

interface ScenarioPlannerProps {
  orgId: string;
  fiscalYearFilter?: FiscalYearFilter | null;
}

export function ScenarioPlanner({ orgId, fiscalYearFilter }: ScenarioPlannerProps) {
  const { data: scenarios = [], isLoading: scenariosLoading } = useBurndownScenarios(orgId);
  const { incomeEntries: allIncomeEntries = [], expenseEntries: allExpenseEntries = [], latestSnapshot } = useBurndownDashboardData(orgId);

  // Filter by fiscal year
  const incomeEntries = useMemo(() => {
    if (!fiscalYearFilter) return allIncomeEntries;
    return allIncomeEntries.filter((entry) => {
      const entryDate = entry.expected_date;
      return entryDate >= fiscalYearFilter.startDate && entryDate <= fiscalYearFilter.endDate;
    });
  }, [allIncomeEntries, fiscalYearFilter]);

  const expenseEntries = useMemo(() => {
    if (!fiscalYearFilter) return allExpenseEntries;
    return allExpenseEntries.filter((entry) => {
      const entryDate = entry.due_date;
      return entryDate >= fiscalYearFilter.startDate && entryDate <= fiscalYearFilter.endDate;
    });
  }, [allExpenseEntries, fiscalYearFilter]);
  
  const createScenario = useCreateScenario();
  const updateScenario = useUpdateScenario();
  const deleteScenario = useDeleteScenario();
  const duplicateScenario = useDuplicateScenario();

  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [showNewScenarioDialog, setShowNewScenarioDialog] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showQuickWhatIf, setShowQuickWhatIf] = useState(false);
  const [quickIncomeChange, setQuickIncomeChange] = useState(0);
  const [quickExpenseChange, setQuickExpenseChange] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showEventDialog, setShowEventDialog] = useState<'income' | 'expense' | null>(null);
  const [eventDescription, setEventDescription] = useState('');
  const [eventAmount, setEventAmount] = useState('');
  const [eventDate, setEventDate] = useState('');

  // Local state for slider/input values to prevent jank during updates
  const [localIncomeMultiplier, setLocalIncomeMultiplier] = useState<number | null>(null);
  const [localExpenseMultiplier, setLocalExpenseMultiplier] = useState<number | null>(null);
  const [localNetChange, setLocalNetChange] = useState<string>('');
  const [localProjectHistorical, setLocalProjectHistorical] = useState<boolean>(false);

  // Calculate baseline data
  const currentBalance = latestSnapshot?.actual_balance ?? 0;
  const baselineProjection = useMemo(() => 
    calculateBurndownProjection(currentBalance, incomeEntries, expenseEntries, 24),
    [currentBalance, incomeEntries, expenseEntries]
  );
  const baselineSummary = useMemo(() => 
    calculateBurndownSummary(baselineProjection, currentBalance),
    [baselineProjection, currentBalance]
  );

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);
  
  // Get adjustments for selected scenario
  const getAdjustments = (scenario: BurndownScenario): ExtendedScenarioAdjustments => {
    return (scenario.adjustments as ExtendedScenarioAdjustments) || {};
  };

  // Sync local state when scenario changes
  useEffect(() => {
    if (selectedScenario) {
      const adj = getAdjustments(selectedScenario);
      setLocalIncomeMultiplier(adj.incomeMultiplier ?? adj.income_multiplier ?? 1);
      setLocalExpenseMultiplier(adj.expenseMultiplier ?? adj.expense_multiplier ?? 1);
      setLocalNetChange(adj.monthlyNetChange?.toString() ?? '');
      setLocalProjectHistorical(adj.projectHistoricalIncome ?? false);
    } else {
      setLocalIncomeMultiplier(null);
      setLocalExpenseMultiplier(null);
      setLocalNetChange('');
      setLocalProjectHistorical(false);
    }
  }, [selectedScenario?.id, selectedScenario?.adjustments]);

  // Get effective values (local state takes precedence for responsive UI)
  const effectiveIncomeMultiplier = localIncomeMultiplier ?? (selectedScenario ? (getAdjustments(selectedScenario).incomeMultiplier ?? 1) : 1);
  const effectiveExpenseMultiplier = localExpenseMultiplier ?? (selectedScenario ? (getAdjustments(selectedScenario).expenseMultiplier ?? 1) : 1);
  const effectiveNetChange = localNetChange !== '' ? parseFloat(localNetChange) || 0 : (selectedScenario ? (getAdjustments(selectedScenario).monthlyNetChange ?? 0) : 0);
  const effectiveProjectHistorical = localProjectHistorical;

  // Helper to shift historical income forward into future (for grant projections)
  const shiftIncomeToFuture = (entries: BurndownIncomeEntry[]): BurndownIncomeEntry[] => {
    const today = startOfMonth(new Date());
    return entries.map(entry => {
      const entryDate = parseISO(entry.expected_date);
      if (isBefore(entryDate, today)) {
        // Shift forward by 12-month increments until it's in the future
        let shiftedDate = entryDate;
        while (isBefore(shiftedDate, today)) {
          shiftedDate = addYears(shiftedDate, 1);
        }
        return {
          ...entry,
          expected_date: format(shiftedDate, 'yyyy-MM-dd'),
          status: 'projected' as const, // Mark as projected since it's now future
        };
      }
      return entry;
    });
  };

  // Calculate scenario-adjusted projection
  const calculateScenarioProjection = (scenario: BurndownScenario, overrideIncMult?: number, overrideExpMult?: number, overrideNetChange?: number, overrideProjectHistorical?: boolean) => {
    const adj = getAdjustments(scenario);
    const incomeMultiplier = overrideIncMult ?? adj.incomeMultiplier ?? adj.income_multiplier ?? 1;
    const expenseMultiplier = overrideExpMult ?? adj.expenseMultiplier ?? adj.expense_multiplier ?? 1;
    const monthlyNetChange = overrideNetChange ?? adj.monthlyNetChange ?? 0;
    const projectHistoricalIncome = overrideProjectHistorical ?? adj.projectHistoricalIncome ?? false;
    
    // Start with income entries, optionally shifting historical ones forward
    const baseIncome = projectHistoricalIncome ? shiftIncomeToFuture(incomeEntries) : incomeEntries;
    
    const adjustedIncome: BurndownIncomeEntry[] = baseIncome.map(e => ({
      ...e,
      amount: e.amount * incomeMultiplier,
    }));
    
    const adjustedExpenses: BurndownExpenseEntry[] = expenseEntries.map(e => ({
      ...e,
      amount: e.amount * expenseMultiplier,
    }));
    
    // Add one-time events
    const incomeEvents = adj.additionalIncomeEvents || [];
    const expenseEvents = adj.additionalExpenseEvents || [];
    
    incomeEvents.forEach(event => {
      adjustedIncome.push({
        id: `event-${event.date}-${event.amount}`,
        organization_id: orgId,
        category_id: null,
        donation_id: null,
        opportunity_id: null,
        amount: event.amount,
        description: event.description,
        source_name: event.description,
        expected_date: event.date,
        actual_date: null,
        status: 'projected',
        probability_percent: 100,
        is_recurring: false,
        recurrence_end_date: null,
        is_synced: false,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
    
    expenseEvents.forEach(event => {
      adjustedExpenses.push({
        id: `event-${event.date}-${event.amount}`,
        organization_id: orgId,
        category_id: null,
        quickbooks_expense_id: null,
        amount: event.amount,
        description: event.description,
        vendor_name: event.description,
        due_date: event.date,
        paid_date: null,
        status: 'projected',
        is_recurring: false,
        recurrence_end_date: null,
        is_synced: false,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
    
    // Add monthly net change as recurring entries
    if (monthlyNetChange !== 0) {
      const today = new Date();
      for (let i = 0; i < 24; i++) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const dateStr = monthDate.toISOString().split('T')[0];
        
        if (monthlyNetChange > 0) {
          adjustedIncome.push({
            id: `net-change-${i}`,
            organization_id: orgId,
            category_id: null,
            donation_id: null,
            opportunity_id: null,
            amount: monthlyNetChange,
            description: 'Monthly Net Change',
            source_name: 'Scenario Adjustment',
            expected_date: dateStr,
            actual_date: null,
            status: 'projected',
            probability_percent: 100,
            is_recurring: false,
            recurrence_end_date: null,
            is_synced: false,
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } else {
          adjustedExpenses.push({
            id: `net-change-${i}`,
            organization_id: orgId,
            category_id: null,
            quickbooks_expense_id: null,
            amount: Math.abs(monthlyNetChange),
            description: 'Monthly Net Change',
            vendor_name: 'Scenario Adjustment',
            due_date: dateStr,
            paid_date: null,
            status: 'projected',
            is_recurring: false,
            recurrence_end_date: null,
            is_synced: false,
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
    }
    
    return calculateBurndownProjection(currentBalance, adjustedIncome, adjustedExpenses, 24);
  };

  // Use local state for responsive UI when adjusting sliders/inputs
  const selectedProjection = selectedScenario 
    ? calculateScenarioProjection(selectedScenario, effectiveIncomeMultiplier, effectiveExpenseMultiplier, effectiveNetChange, effectiveProjectHistorical) 
    : baselineProjection;
  
  const selectedSummary = selectedScenario
    ? calculateBurndownSummary(selectedProjection, currentBalance)
    : baselineSummary;

  const runwayDifference = selectedScenario 
    ? selectedSummary.monthsOfRunway - baselineSummary.monthsOfRunway
    : 0;

  const handleCreateScenario = () => {
    if (!newScenarioName.trim()) return;
    createScenario.mutate({
      organization_id: orgId,
      name: newScenarioName,
      adjustments: { incomeMultiplier: 1, expenseMultiplier: 1 },
    }, {
      onSuccess: (data) => {
        setSelectedScenarioId(data.id);
        setShowNewScenarioDialog(false);
        setNewScenarioName('');
      }
    });
  };

  const handleUpdateAdjustment = (key: keyof ExtendedScenarioAdjustments, value: number | boolean | ScenarioEvent[]) => {
    if (!selectedScenario || selectedScenario.is_baseline) return;
    const currentAdj = getAdjustments(selectedScenario);
    updateScenario.mutate({
      id: selectedScenario.id,
      adjustments: { ...currentAdj, [key]: value },
    });
  };

  const handleAddEvent = (type: 'income' | 'expense') => {
    if (!selectedScenario || !eventDescription || !eventAmount || !eventDate) return;
    const adj = getAdjustments(selectedScenario);
    const event: ScenarioEvent = {
      description: eventDescription,
      amount: parseFloat(eventAmount),
      date: eventDate,
    };
    
    if (type === 'income') {
      const events = [...(adj.additionalIncomeEvents || []), event];
      handleUpdateAdjustment('additionalIncomeEvents', events);
    } else {
      const events = [...(adj.additionalExpenseEvents || []), event];
      handleUpdateAdjustment('additionalExpenseEvents', events);
    }
    
    setShowEventDialog(null);
    setEventDescription('');
    setEventAmount('');
    setEventDate('');
  };

  const handleRemoveEvent = (type: 'income' | 'expense', index: number) => {
    if (!selectedScenario) return;
    const adj = getAdjustments(selectedScenario);
    if (type === 'income') {
      const events = [...(adj.additionalIncomeEvents || [])];
      events.splice(index, 1);
      handleUpdateAdjustment('additionalIncomeEvents', events);
    } else {
      const events = [...(adj.additionalExpenseEvents || [])];
      events.splice(index, 1);
      handleUpdateAdjustment('additionalExpenseEvents', events);
    }
  };

  const calculateQuickWhatIf = () => {
    const incomeMultiplier = 1 + quickIncomeChange / 100;
    const expenseMultiplier = 1 + quickExpenseChange / 100;
    
    const adjustedIncome = incomeEntries.map(e => ({ ...e, amount: e.amount * incomeMultiplier }));
    const adjustedExpenses = expenseEntries.map(e => ({ ...e, amount: e.amount * expenseMultiplier }));
    
    const projection = calculateBurndownProjection(currentBalance, adjustedIncome, adjustedExpenses, 24);
    return calculateBurndownSummary(projection, currentBalance);
  };

  const quickWhatIfSummary = calculateQuickWhatIf();

  const handleSaveQuickWhatIf = () => {
    createScenario.mutate({
      organization_id: orgId,
      name: `What-If: Income ${quickIncomeChange >= 0 ? '+' : ''}${quickIncomeChange}%, Expenses ${quickExpenseChange >= 0 ? '+' : ''}${quickExpenseChange}%`,
      adjustments: {
        incomeMultiplier: 1 + quickIncomeChange / 100,
        expenseMultiplier: 1 + quickExpenseChange / 100,
      },
    }, {
      onSuccess: () => {
        setShowQuickWhatIf(false);
        setQuickIncomeChange(0);
        setQuickExpenseChange(0);
      }
    });
  };

  // Comparison chart data
  const comparisonChartData = useMemo(() => {
    if (!showComparison || compareIds.length === 0) return [];
    
    const allData: Array<{ date: string; Baseline: number; [key: string]: number | string }> = [];
    
    // Always include baseline
    baselineProjection.forEach((dp, idx) => {
      if (!allData[idx]) allData[idx] = { date: dp.date, Baseline: 0 };
      allData[idx].Baseline = dp.projectedBalance;
    });
    
    compareIds.forEach(id => {
      const scenario = scenarios.find(s => s.id === id);
      if (!scenario) return;
      const projection = calculateScenarioProjection(scenario);
      projection.forEach((dp, idx) => {
        if (!allData[idx]) allData[idx] = { date: dp.date, Baseline: 0 };
        allData[idx][scenario.name] = dp.projectedBalance;
      });
    });
    
    return allData;
  }, [showComparison, compareIds, scenarios, baselineProjection]);

  const scenarioColors = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  if (scenariosLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading scenarios...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Scenario Planning</h2>
          <p className="text-sm text-muted-foreground">Model what-if scenarios to plan for different outcomes</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showComparison ? 'default' : 'outline'}
            onClick={() => setShowComparison(!showComparison)}
          >
            <Layers className="h-4 w-4 mr-2" />
            {showComparison ? 'Exit Comparison' : 'Compare Scenarios'}
          </Button>
        </div>
      </div>

      {showComparison ? (
        // Comparison View
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Scenarios to Compare</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {scenarios.filter(s => !s.is_baseline).map(scenario => (
                  <label key={scenario.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={compareIds.includes(scenario.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setCompareIds([...compareIds, scenario.id].slice(0, 3));
                        } else {
                          setCompareIds(compareIds.filter(id => id !== scenario.id));
                        }
                      }}
                    />
                    <span>{scenario.name}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {compareIds.length > 0 && (
            <>
              {/* Comparison Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Projection Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={comparisonChartData}>
                        <XAxis
                          dataKey="date"
                          tickFormatter={(val) => format(parseISO(val), 'MMM yy')}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis
                          tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => format(parseISO(label), 'MMMM yyyy')}
                        />
                        <Legend />
                        <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                        <Area
                          type="monotone"
                          dataKey="Baseline"
                          stroke="hsl(var(--muted-foreground))"
                          fill="transparent"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                        />
                        {compareIds.map((id, idx) => {
                          const scenario = scenarios.find(s => s.id === id);
                          if (!scenario) return null;
                          return (
                            <Area
                              key={id}
                              type="monotone"
                              dataKey={scenario.name}
                              stroke={scenarioColors[idx % scenarioColors.length]}
                              fill={scenarioColors[idx % scenarioColors.length]}
                              fillOpacity={0.1}
                              strokeWidth={2}
                            />
                          );
                        })}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Comparison Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Key Metrics Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Metric</th>
                          <th className="text-right py-2 px-4">Baseline</th>
                          {compareIds.map(id => {
                            const scenario = scenarios.find(s => s.id === id);
                            return <th key={id} className="text-right py-2 px-4">{scenario?.name}</th>;
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-4">Runway</td>
                          <td className="text-right py-2 px-4">{formatRunway(baselineSummary.monthsOfRunway)}</td>
                          {compareIds.map(id => {
                            const scenario = scenarios.find(s => s.id === id);
                            if (!scenario) return <td key={id} />;
                            const proj = calculateScenarioProjection(scenario);
                            const sum = calculateBurndownSummary(proj, currentBalance);
                            return <td key={id} className="text-right py-2 px-4">{formatRunway(sum.monthsOfRunway)}</td>;
                          })}
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-4">Monthly Net</td>
                          <td className="text-right py-2 px-4">{formatCurrency(baselineSummary.netMonthlyChange)}</td>
                          {compareIds.map(id => {
                            const scenario = scenarios.find(s => s.id === id);
                            if (!scenario) return <td key={id} />;
                            const proj = calculateScenarioProjection(scenario);
                            const sum = calculateBurndownSummary(proj, currentBalance);
                            return <td key={id} className="text-right py-2 px-4">{formatCurrency(sum.netMonthlyChange)}</td>;
                          })}
                        </tr>
                        <tr>
                          <td className="py-2 px-4">Projected Runout</td>
                          <td className="text-right py-2 px-4">
                            {baselineSummary.projectedRunoutDate 
                              ? format(parseISO(baselineSummary.projectedRunoutDate), 'MMM yyyy')
                              : 'Sustainable'}
                          </td>
                          {compareIds.map(id => {
                            const scenario = scenarios.find(s => s.id === id);
                            if (!scenario) return <td key={id} />;
                            const proj = calculateScenarioProjection(scenario);
                            const sum = calculateBurndownSummary(proj, currentBalance);
                            return (
                              <td key={id} className="text-right py-2 px-4">
                                {sum.projectedRunoutDate 
                                  ? format(parseISO(sum.projectedRunoutDate), 'MMM yyyy')
                                  : 'Sustainable'}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      ) : (
        // Editor View
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Scenario List */}
          <div className="space-y-3">
            {/* Baseline Card */}
            <Card
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                selectedScenarioId === null && 'ring-2 ring-primary'
              )}
              onClick={() => setSelectedScenarioId(null)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Baseline</p>
                    <p className="text-sm text-muted-foreground">Current projections</p>
                  </div>
                  <Badge variant="secondary">{formatRunway(baselineSummary.monthsOfRunway)}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* User Scenarios */}
            {scenarios.filter(s => !s.is_baseline).map(scenario => {
              const proj = calculateScenarioProjection(scenario);
              const sum = calculateBurndownSummary(proj, currentBalance);
              return (
                <Card
                  key={scenario.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    selectedScenarioId === scenario.id && 'ring-2 ring-primary'
                  )}
                  onClick={() => setSelectedScenarioId(scenario.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{scenario.name}</p>
                        <p className="text-sm text-muted-foreground">{formatRunway(sum.monthsOfRunway)}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateScenario.mutate(scenario);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(scenario.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowNewScenarioDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Scenario
              </Button>
              
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  createScenario.mutate({
                    organization_id: orgId,
                    name: 'Grant Projection',
                    description: 'Projects historical grant income forward assuming annual cycles repeat',
                    adjustments: { 
                      incomeMultiplier: 1, 
                      expenseMultiplier: 1,
                      projectHistoricalIncome: true,
                    },
                  }, {
                    onSuccess: (data) => {
                      setSelectedScenarioId(data.id);
                    }
                  });
                }}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Create Grant Projection
              </Button>
            </div>
          </div>

          {/* Right Side - Editor */}
          <div className="lg:col-span-2 space-y-6">
            {selectedScenario ? (
              <>
                {/* Scenario Header */}
                <Card>
                  <CardContent className="p-4">
                    <Input
                      value={selectedScenario.name}
                      onChange={(e) => updateScenario.mutate({ id: selectedScenario.id, name: e.target.value })}
                      className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
                      placeholder="Scenario name"
                    />
                    <Textarea
                      value={selectedScenario.description || ''}
                      onChange={(e) => updateScenario.mutate({ id: selectedScenario.id, description: e.target.value })}
                      className="mt-2 border-none p-0 resize-none focus-visible:ring-0"
                      placeholder="Add a description..."
                      rows={2}
                    />
                  </CardContent>
                </Card>

                {/* Global Adjustments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Global Adjustments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Adjust All Income</Label>
                        <Badge variant="outline">
                          Income × {(effectiveIncomeMultiplier * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <Slider
                        value={[(effectiveIncomeMultiplier - 1) * 100]}
                        min={-50}
                        max={100}
                        step={5}
                        onValueChange={([val]) => setLocalIncomeMultiplier(1 + val / 100)}
                        onValueCommit={([val]) => handleUpdateAdjustment('incomeMultiplier', 1 + val / 100)}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>-50%</span>
                        <span>0%</span>
                        <span>+100%</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Adjust All Expenses</Label>
                        <Badge variant="outline">
                          Expenses × {(effectiveExpenseMultiplier * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <Slider
                        value={[(effectiveExpenseMultiplier - 1) * 100]}
                        min={-50}
                        max={100}
                        step={5}
                        onValueChange={([val]) => setLocalExpenseMultiplier(1 + val / 100)}
                        onValueCommit={([val]) => handleUpdateAdjustment('expenseMultiplier', 1 + val / 100)}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>-50%</span>
                        <span>0%</span>
                        <span>+100%</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <Label>Monthly Net Change</Label>
                        <Badge variant={effectiveNetChange >= 0 ? 'default' : 'destructive'}>
                          {effectiveNetChange >= 0 ? '+' : ''}{formatCurrency(effectiveNetChange)}/mo
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={localNetChange}
                          onChange={(e) => setLocalNetChange(e.target.value)}
                          onBlur={() => {
                            const val = parseFloat(localNetChange) || 0;
                            handleUpdateAdjustment('monthlyNetChange', val);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = parseFloat(localNetChange) || 0;
                              handleUpdateAdjustment('monthlyNetChange', val);
                            }
                          }}
                          placeholder="0"
                          className="max-w-[150px]"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter a positive amount for additional income or negative for additional expenses each month.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="project-historical"
                          checked={effectiveProjectHistorical}
                          onCheckedChange={(checked) => {
                            setLocalProjectHistorical(!!checked);
                            handleUpdateAdjustment('projectHistoricalIncome', !!checked);
                          }}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="project-historical" className="cursor-pointer">
                            Project Historical Income Forward
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Shifts past-dated income (like grants) forward into future projection periods, assuming annual cycles repeat.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* One-Time Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">One-Time Events</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowEventDialog('income')}>
                        <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                        Add Income Event
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowEventDialog('expense')}>
                        <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
                        Add Expense Event
                      </Button>
                    </div>

                    {/* Income Events */}
                    {(getAdjustments(selectedScenario).additionalIncomeEvents || []).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-600">Income Events</p>
                        {(getAdjustments(selectedScenario).additionalIncomeEvents || []).map((event, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-md">
                            <div>
                              <p className="text-sm font-medium">{event.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(event.amount)} on {format(parseISO(event.date), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleRemoveEvent('income', idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expense Events */}
                    {(getAdjustments(selectedScenario).additionalExpenseEvents || []).length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-red-600">Expense Events</p>
                        {(getAdjustments(selectedScenario).additionalExpenseEvents || []).map((event, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded-md">
                            <div>
                              <p className="text-sm font-medium">{event.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(event.amount)} on {format(parseISO(event.date), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleRemoveEvent('expense', idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Scenario Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Scenario Impact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">{formatRunway(selectedSummary.monthsOfRunway)}</p>
                        <p className="text-sm text-muted-foreground">Runway</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-2xl font-bold">
                          {selectedSummary.projectedRunoutDate 
                            ? format(parseISO(selectedSummary.projectedRunoutDate), 'MMM yyyy')
                            : 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground">Runout Date</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className={cn(
                          'text-2xl font-bold flex items-center justify-center gap-1',
                          runwayDifference > 0 ? 'text-green-600' : runwayDifference < 0 ? 'text-red-600' : ''
                        )}>
                          {runwayDifference > 0 ? <ArrowUpRight className="h-5 w-5" /> : runwayDifference < 0 ? <ArrowDownRight className="h-5 w-5" /> : null}
                          {runwayDifference > 0 ? '+' : ''}{runwayDifference.toFixed(1)} mo
                        </div>
                        <p className="text-sm text-muted-foreground">vs Baseline</p>
                      </div>
                    </div>

                    {/* Mini Chart */}
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={selectedProjection.map((dp, idx) => ({
                          ...dp,
                          baseline: baselineProjection[idx]?.projectedBalance ?? 0,
                        }))}>
                          <XAxis
                            dataKey="date"
                            tickFormatter={(val) => format(parseISO(val), 'MMM')}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                          />
                          <YAxis
                            tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={10}
                          />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            labelFormatter={(label) => format(parseISO(label), 'MMMM yyyy')}
                          />
                          <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                          <Area
                            type="monotone"
                            dataKey="baseline"
                            stroke="hsl(var(--muted-foreground))"
                            fill="transparent"
                            strokeDasharray="5 5"
                            name="Baseline"
                          />
                          <Area
                            type="monotone"
                            dataKey="projectedBalance"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.2}
                            name="This Scenario"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              // Baseline View
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="mb-4">
                    <Calculator className="h-12 w-12 mx-auto text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Baseline Projections</h3>
                  <p className="text-muted-foreground mb-6">
                    This represents your current financial trajectory based on actual data.
                  </p>
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className={cn('text-2xl font-bold', getRunwayStatusColor(baselineSummary.monthsOfRunway))}>
                        {formatRunway(baselineSummary.monthsOfRunway)}
                      </p>
                      <p className="text-sm text-muted-foreground">Runway</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold">{formatCurrency(baselineSummary.netMonthlyChange)}</p>
                      <p className="text-sm text-muted-foreground">Monthly Net</p>
                    </div>
                  </div>
                  <Button
                    className="mt-6"
                    onClick={() => setShowNewScenarioDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Scenario
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Quick What-If FAB */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        onClick={() => setShowQuickWhatIf(true)}
      >
        <Calculator className="h-6 w-6" />
      </Button>

      {/* New Scenario Dialog */}
      <Dialog open={showNewScenarioDialog} onOpenChange={setShowNewScenarioDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Scenario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Scenario Name</Label>
              <Input
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                placeholder="e.g., Conservative Growth, Emergency Grant"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewScenarioDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateScenario} disabled={!newScenarioName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Dialog */}
      <Dialog open={!!showEventDialog} onOpenChange={() => setShowEventDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {showEventDialog === 'income' ? 'Income' : 'Expense'} Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder={showEventDialog === 'income' ? 'e.g., Emergency grant' : 'e.g., New hire'}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                value={eventAmount}
                onChange={(e) => setEventAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(null)}>Cancel</Button>
            <Button 
              onClick={() => showEventDialog && handleAddEvent(showEventDialog)}
              disabled={!eventDescription || !eventAmount || !eventDate}
            >
              Add Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick What-If Dialog */}
      <Dialog open={showQuickWhatIf} onOpenChange={setShowQuickWhatIf}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick What-If Calculator</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>If income changes by</Label>
                <Badge variant="outline">{quickIncomeChange >= 0 ? '+' : ''}{quickIncomeChange}%</Badge>
              </div>
              <Slider
                value={[quickIncomeChange]}
                min={-50}
                max={100}
                step={5}
                onValueChange={([val]) => setQuickIncomeChange(val)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>If expenses change by</Label>
                <Badge variant="outline">{quickExpenseChange >= 0 ? '+' : ''}{quickExpenseChange}%</Badge>
              </div>
              <Slider
                value={[quickExpenseChange]}
                min={-50}
                max={100}
                step={5}
                onValueChange={([val]) => setQuickExpenseChange(val)}
              />
            </div>

            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">New Runway</p>
              <p className={cn('text-3xl font-bold', getRunwayStatusColor(quickWhatIfSummary.monthsOfRunway))}>
                {formatRunway(quickWhatIfSummary.monthsOfRunway)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {quickWhatIfSummary.monthsOfRunway - baselineSummary.monthsOfRunway > 0 ? '+' : ''}
                {(quickWhatIfSummary.monthsOfRunway - baselineSummary.monthsOfRunway).toFixed(1)} months vs baseline
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickWhatIf(false)}>Close</Button>
            <Button onClick={handleSaveQuickWhatIf}>Save as Scenario</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scenario?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The scenario will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirmId) {
                  deleteScenario.mutate({ id: deleteConfirmId, orgId });
                  if (selectedScenarioId === deleteConfirmId) {
                    setSelectedScenarioId(null);
                  }
                  setDeleteConfirmId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
