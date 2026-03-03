import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type ImportStep = "welcome" | "scan" | "configure" | "matching" | "importing" | "complete";

interface MailchimpScanResult {
  lists: Array<{ id: string; name: string; member_count: number }>;
  total_subscribers: number;
  campaigns: { total: number; sent: number; draft: number; scheduled: number };
  activities: { opens: number; clicks: number; bounces: number; unsubscribes: number };
  tags: number;
  segments: number;
}

interface ImportProgress {
  phase: string;
  current: number;
  total: number;
  percentage: number;
  message: string;
}

const MailchimpImportWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<ImportStep>("welcome");
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<MailchimpScanResult | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  // Configuration options
  const [importAllTime, setImportAllTime] = useState(true);
  const [importOpens, setImportOpens] = useState(true);
  const [importClicks, setImportClicks] = useState(true);
  const [importUnsubscribes, setImportUnsubscribes] = useState(true);
  const [importBounces, setImportBounces] = useState(true);
  const [matchingStrategy, setMatchingStrategy] = useState("email");
  const [createNewConstituents, setCreateNewConstituents] = useState(true);

  const scanMailchimpAccount = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("mailchimp-import", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { action: "scan" },
      });

      if (response.error) throw response.error;
      setScanResult(response.data);
      setStep("scan");
    } catch (error: unknown) {
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to scan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startImport = async () => {
    setLoading(true);
    setStep("importing");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("mailchimp-import", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          action: "import",
          options: {
            importAllTime,
            importOpens,
            importClicks,
            importUnsubscribes,
            importBounces,
            matchingStrategy,
            createNewConstituents,
          },
        },
      });

      if (response.error) throw response.error;
      setImportResult(response.data);
      setStep("complete");
      
      toast({
        title: "Import Complete!",
        description: `Successfully imported ${response.data.total_imported} records.`,
      });
    } catch (error: unknown) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import",
        variant: "destructive",
      });
      setStep("configure");
    } finally {
      setLoading(false);
    }
  };

  // Poll for progress updates during import
  useEffect(() => {
    if (step !== "importing") return;

    const pollProgress = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await supabase.functions.invoke("mailchimp-import", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: { action: "progress" },
        });

        if (response.data) {
          setImportProgress(response.data);
        }
      } catch (error) {
        console.error("Progress poll error:", error);
      }
    }, 2000);

    return () => clearInterval(pollProgress);
  }, [step]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/integrations")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Mailchimp Data Migration</h1>
            <p className="text-muted-foreground">Import your complete email marketing history</p>
          </div>
        </div>
      </div>

      {step === "welcome" && (
        <Card>
          <CardHeader>
            <CardTitle>Import All Mailchimp Data</CardTitle>
            <CardDescription>
              Transfer your complete Mailchimp email marketing database into your CRM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">📧 Subscribers & Lists</h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• All subscriber lists and audiences</li>
                  <li>• Contact information and merge fields</li>
                  <li>• Subscription status and preferences</li>
                  <li>• Tags, segments, and member ratings</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">📊 Campaign History</h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• All email campaigns</li>
                  <li>• Performance metrics and statistics</li>
                  <li>• Subject lines and send dates</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">📈 Email Engagement</h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Opens and click activity</li>
                  <li>• Unsubscribe history</li>
                  <li>• Bounce and complaint records</li>
                  <li>• Individual engagement timelines</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">✓ We'll automatically:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>✓ Match subscribers to existing constituents</li>
                  <li>✓ Create new constituents for unmatched</li>
                  <li>✓ Calculate engagement scores</li>
                  <li>✓ Build email activity timelines</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => navigate("/integrations")} variant="outline">
                Cancel
              </Button>
              <Button onClick={scanMailchimpAccount} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Start Import →"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "scan" && scanResult && (
        <Card>
          <CardHeader>
            <CardTitle>Mailchimp Account Scan Complete</CardTitle>
            <CardDescription>Review what will be imported</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Lists/Audiences: {scanResult.lists.length}</h3>
                <div className="space-y-1 ml-4 text-sm">
                  {scanResult.lists.map((list) => (
                    <div key={list.id}>
                      ├─ {list.name} ({list.member_count.toLocaleString()} members)
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-sm">Total Unique Subscribers</p>
                  <p className="text-2xl font-bold">{scanResult.total_subscribers.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Total Campaigns</p>
                  <p className="text-2xl font-bold">{scanResult.campaigns.total}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Email Activities: ~{scanResult.activities.opens + scanResult.activities.clicks}</h3>
                <div className="grid grid-cols-2 gap-2 ml-4 text-sm">
                  <div>Opens: {scanResult.activities.opens.toLocaleString()}</div>
                  <div>Clicks: {scanResult.activities.clicks.toLocaleString()}</div>
                  <div>Bounces: {scanResult.activities.bounces}</div>
                  <div>Unsubscribes: {scanResult.activities.unsubscribes}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-semibold">
                  Total Records: ~{(scanResult.total_subscribers + scanResult.campaigns.total + 
                    scanResult.activities.opens + scanResult.activities.clicks).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Estimated Import Time: 8-12 minutes</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep("welcome")} variant="outline">
                ← Back
              </Button>
              <Button onClick={() => setStep("configure")}>
                Continue →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "configure" && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Import Options</CardTitle>
            <CardDescription>Choose what data to import and how to match subscribers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Campaign History</h3>
                <RadioGroup value={importAllTime ? "all" : "recent"} onValueChange={(v) => setImportAllTime(v === "all")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all">All time (complete history)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="recent" id="recent" />
                    <Label htmlFor="recent">Last 1 year (faster)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Email Activity</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="opens" checked={importOpens} onCheckedChange={(c) => setImportOpens(!!c)} />
                    <Label htmlFor="opens">Email Opens</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="clicks" checked={importClicks} onCheckedChange={(c) => setImportClicks(!!c)} />
                    <Label htmlFor="clicks">Link Clicks</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="unsubs" checked={importUnsubscribes} onCheckedChange={(c) => setImportUnsubscribes(!!c)} />
                    <Label htmlFor="unsubs">Unsubscribes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="bounces" checked={importBounces} onCheckedChange={(c) => setImportBounces(!!c)} />
                    <Label htmlFor="bounces">Bounces</Label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Subscriber Matching</h3>
                <RadioGroup value={matchingStrategy} onValueChange={setMatchingStrategy}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email">Email address (recommended)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email_name" id="email_name" />
                    <Label htmlFor="email_name">Email + Name (stricter)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Unmatched Subscribers</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="create_new" 
                    checked={createNewConstituents} 
                    onCheckedChange={(c) => setCreateNewConstituents(!!c)} 
                  />
                  <Label htmlFor="create_new">Create new constituent records automatically</Label>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setStep("scan")} variant="outline">
                ← Back
              </Button>
              <Button onClick={startImport} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Start Import →"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "importing" && (
        <Card>
          <CardHeader>
            <CardTitle>Importing Mailchimp Data...</CardTitle>
            <CardDescription>This may take several minutes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {importProgress && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{importProgress.phase}</span>
                    <span className="text-muted-foreground">
                      {importProgress.current.toLocaleString()} / {importProgress.total.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={importProgress.percentage} />
                  <p className="text-sm text-muted-foreground">{importProgress.message}</p>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Status: Processing...</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {step === "complete" && importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Mailchimp Import Complete!
            </CardTitle>
            <CardDescription>
              Successfully imported {importResult.total_imported?.toLocaleString()} records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">📧 Subscribers</h3>
                <div className="text-sm space-y-1">
                  <div>Total: {importResult.subscribers?.total}</div>
                  <div>Matched: {importResult.subscribers?.matched}</div>
                  <div>New: {importResult.subscribers?.created}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">📊 Campaigns</h3>
                <div className="text-sm space-y-1">
                  <div>Imported: {importResult.campaigns?.imported}</div>
                  <div>Avg Open Rate: {importResult.campaigns?.avg_open_rate}%</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">📈 Email Activity</h3>
                <div className="text-sm space-y-1">
                  <div>Opens: {importResult.activities?.opens?.toLocaleString()}</div>
                  <div>Clicks: {importResult.activities?.clicks?.toLocaleString()}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">⭐ Engagement</h3>
                <div className="text-sm space-y-1">
                  <div>Avg Score: {importResult.engagement?.average}/100</div>
                  <div>High: {importResult.engagement?.high_count}</div>
                </div>
              </div>
            </div>

            {importResult.errors > 0 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Attention Needed</p>
                  <p className="text-muted-foreground">
                    {importResult.errors} records skipped due to errors
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => navigate("/email-dashboard")}>
                View Email Dashboard
              </Button>
              <Button onClick={() => navigate("/integrations")} variant="outline">
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MailchimpImportWizard;
