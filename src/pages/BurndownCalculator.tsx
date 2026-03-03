import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TrendingDown, DollarSign, ArrowDownCircle, Layers, CalendarRange, Settings, Info } from "lucide-react";
import { BurndownDashboard } from "@/components/burndown/BurndownDashboard";
import { IncomeManager } from "@/components/burndown/IncomeManager";
import { ExpenseManager } from "@/components/burndown/ExpenseManager";
import { ScenarioPlanner } from "@/components/burndown/ScenarioPlanner";
import { FiscalYearSettings } from "@/components/burndown/FiscalYearSettings";
import { useOrganizationSettings } from "@/hooks/useOrganizationSettings";
import { 
  getFiscalYearOptions, 
  getDefaultFiscalYearValue, 
  getCurrentFiscalYear,
  getFullFiscalYearRange,
  getFiscalYearLabel,
} from "@/utils/fiscal-year";

// Placeholder org ID - in production, get from context/auth
const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

export interface FiscalYearFilter {
  startDate: string;
  endDate: string;
  label: string;
}

export default function BurndownCalculator() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showFiscalYearSetup, setShowFiscalYearSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Fetch organization settings to get fiscal year start month
  const { data: orgSettings, isLoading: settingsLoading } = useOrganizationSettings(DEMO_ORG_ID);
  
  // Default to 1 (January) if not set
  const fiscalStartMonth = orgSettings?.fiscal_year_start_month ?? 1;
  
  // Generate fiscal year options based on org's fiscal start month
  const fiscalYearOptions = useMemo(
    () => getFiscalYearOptions(fiscalStartMonth, 2, 1),
    [fiscalStartMonth]
  );
  
  // Default to current fiscal year
  const defaultFY = useMemo(
    () => getDefaultFiscalYearValue(fiscalStartMonth),
    [fiscalStartMonth]
  );
  
  const [selectedFY, setSelectedFY] = useState<string | null>(null);
  
  // Use defaultFY when it's computed and selectedFY is not set
  const effectiveFY = selectedFY ?? defaultFY;
  
  const selectedFYOption = fiscalYearOptions.find(fy => fy.value === effectiveFY);
  const fiscalYearFilter: FiscalYearFilter | null = selectedFYOption ? {
    startDate: selectedFYOption.startDate,
    endDate: selectedFYOption.endDate,
    label: selectedFYOption.label,
  } : null;

  // Get current FY info for header display
  const currentFY = getCurrentFiscalYear(fiscalStartMonth);
  const currentFYRange = getFullFiscalYearRange(new Date(), fiscalStartMonth);

  // Check if this is first time setup (fiscal year never configured - still at default)
  const isFirstTimeSetup = !settingsLoading && orgSettings?.fiscal_year_start_month === 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0D7377] to-[#14919B] -mx-4 -mt-6 px-6 py-8 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Financial Runway Calculator</h1>
              <p className="text-white/80">
                {currentFY.label} ({currentFYRange})
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Fiscal Year Selector */}
            <div className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-white/80" />
              <Select value={effectiveFY} onValueChange={setSelectedFY}>
                <SelectTrigger className="w-[160px] bg-white/20 border-white/30 text-white">
                  <SelectValue placeholder="Select FY" />
                </SelectTrigger>
                <SelectContent>
                  {fiscalYearOptions.map((fy) => (
                    <SelectItem key={fy.value} value={fy.value}>
                      {fy.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Settings Button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/20"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* First-time setup banner */}
      {isFirstTimeSetup && (
        <Alert className="border-[#14919B] bg-[#14919B]/10">
          <Info className="h-4 w-4 text-[#14919B]" />
          <AlertDescription className="flex items-center justify-between flex-wrap gap-4">
            <span>
              <strong>Configure your fiscal year:</strong> Your fiscal year is set to calendar year (January - December). 
              If your organization uses a different fiscal year, please configure it in settings.
            </span>
            <Button 
              size="sm" 
              onClick={() => setShowSettings(true)}
              className="bg-[#14919B] hover:bg-[#0D7377]"
            >
              Configure Fiscal Year
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="income" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Income</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Scenarios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <BurndownDashboard 
            orgId={DEMO_ORG_ID} 
            fiscalYearFilter={fiscalYearFilter}
          />
        </TabsContent>

        <TabsContent value="income" className="mt-6">
          <IncomeManager 
            orgId={DEMO_ORG_ID} 
            fiscalYearFilter={fiscalYearFilter}
          />
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <ExpenseManager 
            orgId={DEMO_ORG_ID} 
            fiscalYearFilter={fiscalYearFilter}
          />
        </TabsContent>

        <TabsContent value="scenarios" className="mt-6">
          <ScenarioPlanner 
            orgId={DEMO_ORG_ID} 
            fiscalYearFilter={fiscalYearFilter}
          />
        </TabsContent>
      </Tabs>

      {/* Fiscal Year Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Financial Settings</DialogTitle>
            <DialogDescription>
              Configure your organization's financial year settings
            </DialogDescription>
          </DialogHeader>
          <FiscalYearSettings 
            orgId={DEMO_ORG_ID}
            onSaved={() => setShowSettings(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
