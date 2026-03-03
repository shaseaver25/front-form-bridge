import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CalendarRange, Check, Info } from "lucide-react";
import { useOrganizationSettings, useUpdateOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { 
  MONTH_LABELS, 
  COMMON_FISCAL_STARTS,
  getCurrentFiscalYear,
  getFullFiscalYearRange,
  getFiscalYearDateRange,
} from "@/utils/fiscal-year";
import { format, subYears } from "date-fns";

interface FiscalYearSettingsProps {
  orgId: string;
  onSaved?: () => void;
}

export function FiscalYearSettings({ orgId, onSaved }: FiscalYearSettingsProps) {
  const { data: settings, isLoading } = useOrganizationSettings(orgId);
  const updateSettings = useUpdateOrganizationSettings();
  
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings?.fiscal_year_start_month) {
      setSelectedMonth(settings.fiscal_year_start_month);
    }
  }, [settings?.fiscal_year_start_month]);

  const handleMonthChange = (value: string) => {
    const month = parseInt(value, 10);
    setSelectedMonth(month);
    setHasChanges(month !== settings?.fiscal_year_start_month);
  };

  const handleSave = async () => {
    await updateSettings.mutateAsync({
      orgId,
      fiscal_year_start_month: selectedMonth,
    });
    setHasChanges(false);
    onSaved?.();
  };

  // Preview fiscal years based on selection
  const currentFY = getCurrentFiscalYear(selectedMonth);
  const previousFYDate = subYears(currentFY.start, 1);
  const previousFYRange = getFullFiscalYearRange(previousFYDate, selectedMonth);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-10 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-[#14919B]" />
          <CardTitle>Fiscal Year Configuration</CardTitle>
        </div>
        <CardDescription>
          Select the first month of your organization's fiscal year. This affects all financial projections and reports.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Selection for Common Options */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Common Fiscal Year Options</label>
          <div className="flex flex-wrap gap-2">
            {COMMON_FISCAL_STARTS.map((option) => (
              <Button
                key={option.month}
                variant={selectedMonth === option.month ? "default" : "outline"}
                size="sm"
                onClick={() => handleMonthChange(option.month.toString())}
                className={selectedMonth === option.month ? "bg-[#14919B] hover:bg-[#0D7377]" : ""}
              >
                {selectedMonth === option.month && <Check className="h-3 w-3 mr-1" />}
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Full Month Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Or Select Any Month</label>
          <Select 
            value={selectedMonth.toString()} 
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select start month" />
            </SelectTrigger>
            <SelectContent>
              {MONTH_LABELS.map((month, index) => (
                <SelectItem key={index + 1} value={(index + 1).toString()}>
                  {month} ({getFiscalYearDateRange(index + 1)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Preview</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Current Fiscal Year</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-[#14919B]/10 text-[#14919B]">
                  {currentFY.label}
                </Badge>
                <span className="text-sm">
                  {getFullFiscalYearRange(new Date(), selectedMonth)}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Previous Fiscal Year</span>
              <div className="text-sm text-muted-foreground">
                {previousFYRange}
              </div>
            </div>
          </div>
        </div>

        {/* Alert for first-time setup */}
        {settings?.fiscal_year_start_month === 1 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your fiscal year is currently set to calendar year (January - December). 
              If your organization uses a different fiscal year, please update the setting above.
            </AlertDescription>
          </Alert>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateSettings.isPending}
            className="bg-[#14919B] hover:bg-[#0D7377]"
          >
            {updateSettings.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
