import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, 
  Database, Users, DollarSign, FileText, Building2,
  Loader2, Download
} from "lucide-react";
import { toast } from "sonner";
import SalesforceFieldMapper from "@/components/SalesforceFieldMapper";

type ImportStep = "verify" | "select" | "filters" | "mapping" | "progress" | "complete";

interface ObjectCount {
  type: string;
  count: number;
  icon: React.ReactNode;
  label: string;
  description: string;
}

export default function SalesforceImportWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const importType = searchParams.get("type");
  const isGrantsImport = importType === "grants";
  
  const [currentStep, setCurrentStep] = useState<ImportStep>("verify");
  const [selectedObjects, setSelectedObjects] = useState<string[]>([
    "opportunities_grants",
    "opportunities_donations",
    "contacts",
    "programs"
  ]);
  const [dateFilter, setDateFilter] = useState<string>("all_time");
  const [importJobId, setImportJobId] = useState<string | null>(null);

  // Auto-configure for grants import
  useEffect(() => {
    if (isGrantsImport) {
      setSelectedObjects(["opportunities_grants", "grant_deliverables", "accounts"]);
      setDateFilter("all_time");
    }
  }, [isGrantsImport]);

  // Fetch Salesforce configuration
  const { data: sfConfig } = useQuery({
    queryKey: ["salesforce-config"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("salesforce_configurations")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch object counts from Salesforce (mock for now)
  const objectCounts: ObjectCount[] = [
    {
      type: "programs",
      count: 12,
      icon: <FileText className="h-5 w-5" />,
      label: "Programs (pmdm__Program__c)",
      description: "Educational programs with capacity and dates"
    },
    {
      type: "contacts",
      count: 1247,
      icon: <Users className="h-5 w-5" />,
      label: "Contacts/Constituents",
      description: "With NPSP giving rollups and donor flags"
    },
    {
      type: "accounts",
      count: 156,
      icon: <Building2 className="h-5 w-5" />,
      label: "Organizations (Account)",
      description: "Foundation and corporate records"
    },
    {
      type: "opportunities_donations",
      count: 2341,
      icon: <DollarSign className="h-5 w-5" />,
      label: "Opportunities as Donations",
      description: "Gift records with acknowledgment tracking"
    },
    {
      type: "opportunities_grants",
      count: 45,
      icon: <Database className="h-5 w-5" />,
      label: "Opportunities as Grants",
      description: "Grant opportunities with program areas"
    },
    {
      type: "grant_deliverables",
      count: 89,
      icon: <FileText className="h-5 w-5" />,
      label: "Grant Deliverables (npsp__Grant_Deadline__c)",
      description: "Deadlines, reports, and deliverable requirements"
    }
  ];

  // Start import mutation
  const startImportMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("salesforce-import", {
        body: {
          objects: selectedObjects,
          dateFilter,
          import_type: "initial"
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setImportJobId(data.jobId);
      setCurrentStep("progress");
      toast.success("Import started successfully");
    },
    onError: (error) => {
      toast.error("Failed to start import: " + error.message);
    }
  });

  // Poll import progress
  const { data: importProgress } = useQuery({
    queryKey: ["import-progress", importJobId],
    queryFn: async () => {
      if (!importJobId) return null;

      const { data, error } = await supabase
        .from("salesforce_import_jobs")
        .select("*")
        .eq("id", importJobId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!importJobId && currentStep === "progress",
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" ? false : 2000;
    }
  });

  const totalSelected = objectCounts
    .filter(obj => selectedObjects.includes(obj.type))
    .reduce((sum, obj) => sum + obj.count, 0);

  const progressPercent = importProgress 
    ? (importProgress.processed_records / importProgress.total_records) * 100 
    : 0;

  const renderStep = () => {
    switch (currentStep) {
      case "verify":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold">Connected to Salesforce</h3>
                <p className="text-sm text-muted-foreground">
                  Instance: {sfConfig?.instance_url}
                </p>
              </div>
            </div>
            {isGrantsImport ? (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg space-y-2">
                <p className="font-medium text-blue-900 dark:text-blue-200">
                  🎯 Grant-Focused Import
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  This wizard will import grant opportunities, deliverables, and funder organizations. 
                  All grant-related objects are pre-selected for you.
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Ready to import your data! This wizard will guide you through selecting 
                and importing records from Salesforce into your CRM.
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => navigate("/settings/salesforce")}>
                Cancel
              </Button>
              <Button onClick={() => isGrantsImport ? setCurrentStep("mapping") : setCurrentStep("select")}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "select":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Choose Data to Import</h3>
              <p className="text-sm text-muted-foreground">
                Select which Salesforce objects you want to import
              </p>
            </div>

            <div className="space-y-3">
              {objectCounts
                .filter(obj => !isGrantsImport || ["opportunities_grants", "grant_deliverables", "accounts"].includes(obj.type))
                .map((obj) => (
                <div
                  key={obj.type}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <Checkbox
                    id={obj.type}
                    checked={selectedObjects.includes(obj.type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedObjects([...selectedObjects, obj.type]);
                      } else {
                        setSelectedObjects(selectedObjects.filter(t => t !== obj.type));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {obj.icon}
                      <Label htmlFor={obj.type} className="font-medium cursor-pointer">
                        {obj.label}
                      </Label>
                      <Badge variant="secondary">{obj.count} found</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{obj.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Total records:</strong> ~{totalSelected.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Estimated time: 5-10 minutes
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep("verify")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedObjects(objectCounts.map(o => o.type))}
                >
                  Select All
                </Button>
                <Button 
                  onClick={() => setCurrentStep("filters")}
                  disabled={selectedObjects.length === 0}
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case "filters":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Import Filters</h3>
              <p className="text-sm text-muted-foreground">
                Choose the date range for records to import
              </p>
            </div>

            <RadioGroup value={dateFilter} onValueChange={setDateFilter}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="all_time" id="all_time" />
                  <Label htmlFor="all_time" className="flex-1 cursor-pointer">
                    <div className="font-medium">All time (complete history)</div>
                    <div className="text-sm text-muted-foreground">
                      Import all historical data
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="last_12_months" id="last_12_months" />
                  <Label htmlFor="last_12_months" className="flex-1 cursor-pointer">
                    <div className="font-medium">Last 12 months</div>
                    <div className="text-sm text-muted-foreground">
                      Recent data only
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value="last_2_years" id="last_2_years" />
                  <Label htmlFor="last_2_years" className="flex-1 cursor-pointer">
                    <div className="font-medium">Last 2 years</div>
                    <div className="text-sm text-muted-foreground">
                      Balance between history and volume
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            {dateFilter === "all_time" && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-900 dark:text-amber-200">
                  <strong>Warning:</strong> Importing "All time" includes historical data 
                  which may take longer and use more storage.
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep("select")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setCurrentStep("mapping")}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "mapping":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Configure Field Mappings</h3>
              <p className="text-sm text-muted-foreground">
                Map Salesforce fields to your CRM for each object type
              </p>
            </div>

            {selectedObjects.includes("contacts") && (
              <SalesforceFieldMapper 
                objectType="Contact" 
                onComplete={() => {}} 
              />
            )}

            {selectedObjects.includes("accounts") && (
              <SalesforceFieldMapper 
                objectType="Account" 
                onComplete={() => {}} 
              />
            )}

            {selectedObjects.includes("opportunities_grants") && (
              <SalesforceFieldMapper 
                objectType="Opportunity" 
                onComplete={() => {}} 
              />
            )}

            {selectedObjects.includes("grant_deliverables") && (
              <SalesforceFieldMapper 
                objectType="npsp__Grant_Deadline__c" 
                onComplete={() => {}} 
              />
            )}

            {selectedObjects.includes("programs") && (
              <SalesforceFieldMapper 
                objectType="pmdm__Program__c" 
                onComplete={() => {}} 
              />
            )}

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                ℹ️ These mappings will be used for all future imports. You can customize them later in Settings.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep("filters")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={() => startImportMutation.mutate()}
                disabled={startImportMutation.isPending}
              >
                {startImportMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Start Import <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case "progress":
        const isComplete = importProgress?.status === "completed";
        const hasFailed = importProgress?.status === "failed";

        if (isComplete) {
          setCurrentStep("complete");
          return null;
        }

        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Importing Salesforce Data...</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we import your records
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} />
              </div>

              <div className="space-y-2 text-sm">
                {selectedObjects.includes("programs") && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Programs (12/12)</span>
                  </div>
                )}
                {selectedObjects.includes("contacts") && (
                  <div className="flex items-center gap-2">
                    {importProgress?.processed_records > 0 ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span>Contacts ({importProgress.processed_records}/{importProgress.total_records})</span>
                      </>
                    ) : (
                      <>
                        <div className="h-4 w-4" />
                        <span className="text-muted-foreground">Contacts (pending...)</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-1 text-sm">
                <p>
                  <strong>Processed:</strong> {importProgress?.processed_records || 0} 
                  of ~{importProgress?.total_records || totalSelected} records
                </p>
                <p className="text-muted-foreground">
                  You can close this and we'll continue in the background.
                </p>
              </div>
            </div>

            {hasFailed && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-900 dark:text-red-200">
                  <strong>Import Failed:</strong> {
                    typeof importProgress?.error_summary === 'object' && importProgress.error_summary !== null
                      ? (importProgress.error_summary as Record<string, unknown>).message as string || "Unknown error"
                      : "Unknown error"
                  }
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => navigate("/integrations")}
              >
                Close
              </Button>
            </div>
          </div>
        );

      case "complete":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold">Import Complete!</h3>
              <p className="text-muted-foreground">
                Successfully imported {importProgress?.created_records + importProgress?.updated_records} records
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{importProgress?.created_records || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Updated</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{importProgress?.updated_records || 0}</p>
                </CardContent>
              </Card>
            </div>

            {importProgress?.failed_records > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <strong>{importProgress.failed_records} records skipped</strong>
                  <Button variant="link" className="h-auto p-0 ml-2">
                    View Error Log
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-semibold">Next Steps:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Set up ongoing sync schedule</li>
                <li>• Review field mappings</li>
                <li>• Explore your imported data</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => navigate("/integrations")}>
                View Error Log
              </Button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => navigate("/settings/salesforce")}>
                  Configure Sync
                </Button>
                <Button onClick={() => navigate("/")}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/integrations")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Integrations
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Salesforce Data Import</CardTitle>
          <CardDescription>
            Import your Salesforce data into TailoredU CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-8">
            {["verify", "select", "filters", "mapping", "progress", "complete"].map((step, idx) => {
              const stepIndex = ["verify", "select", "filters", "mapping", "progress", "complete"].indexOf(currentStep);
              const isActive = step === currentStep;
              const isComplete = idx < stepIndex;

              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isComplete
                        ? "bg-green-600 text-white"
                        : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                  </div>
                  {idx < 5 && (
                    <div
                      className={`w-12 h-0.5 mx-2 ${
                        isComplete ? "bg-green-600" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
}