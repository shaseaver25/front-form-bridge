import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Code, Database, Zap, GitBranch, Lock, Unlock, Download, Printer, Search, X, Play, Copy, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// API Tester Component
const ApiTester = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<"salesforce" | "mailchimp">("salesforce");
  const [requestBody, setRequestBody] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const sampleRequests = {
    salesforce: JSON.stringify({
      import_constituents: true,
      import_activities: true,
      since_date: "2025-01-01"
    }, null, 2),
    mailchimp: JSON.stringify({
      list_id: "your_list_id",
      status_filter: "subscribed",
      count: 100
    }, null, 2)
  };

  const handleTest = async () => {
    setIsLoading(true);
    setResponse("");
    
    try {
      const body = JSON.parse(requestBody);
      
      const { data, error } = await supabase.functions.invoke(
        selectedEndpoint === "salesforce" ? "salesforce-import" : "mailchimp-import",
        { body }
      );

      if (error) throw error;

      setResponse(JSON.stringify(data, null, 2));
      toast.success("Request completed successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setResponse(JSON.stringify({ error: errorMessage }, null, 2));
      toast.error("Request failed: " + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSample = () => {
    setRequestBody(sampleRequests[selectedEndpoint]);
    toast.info("Sample request loaded");
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    toast.success("Response copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Play className="w-5 h-5 text-primary" />
          <CardTitle>Interactive API Testing Tool</CardTitle>
        </div>
        <CardDescription>
          Test the Salesforce and Mailchimp import endpoints with sample or custom requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Endpoint Selection */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Select Endpoint</label>
          <Select value={selectedEndpoint} onValueChange={(value: "salesforce" | "mailchimp") => setSelectedEndpoint(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="salesforce">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Salesforce Import
                </div>
              </SelectItem>
              <SelectItem value="mailchimp">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Mailchimp Import
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Endpoint Info */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">POST</Badge>
            <code className="text-sm">/functions/v1/{selectedEndpoint}-import</code>
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedEndpoint === "salesforce" 
              ? "Import constituents and activities from Salesforce CRM"
              : "Import contacts and subscription data from Mailchimp"}
          </p>
        </div>

        <Separator />

        {/* Request Body */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">Request Body (JSON)</label>
            <Button onClick={loadSample} variant="outline" size="sm">
              Load Sample
            </Button>
          </div>
          <Textarea
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
            placeholder={sampleRequests[selectedEndpoint]}
            className="font-mono text-sm min-h-[200px]"
          />
        </div>

        {/* Test Button */}
        <Button onClick={handleTest} disabled={isLoading || !requestBody} className="w-full gap-2">
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              Testing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Test Endpoint
            </>
          )}
        </Button>

        {/* Response */}
        {response && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Response</label>
                <Button onClick={copyResponse} variant="outline" size="sm" className="gap-2">
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <div className="bg-card border rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">{response}</pre>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Documentation Links */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Request Parameters</h4>
          
          {selectedEndpoint === "salesforce" ? (
            <div className="space-y-2 text-sm">
              <div className="bg-muted/30 p-3 rounded">
                <code className="font-semibold">import_constituents</code>
                <p className="text-muted-foreground mt-1">Boolean - Import contacts from Salesforce</p>
              </div>
              <div className="bg-muted/30 p-3 rounded">
                <code className="font-semibold">import_activities</code>
                <p className="text-muted-foreground mt-1">Boolean - Import tasks and events as activities</p>
              </div>
              <div className="bg-muted/30 p-3 rounded">
                <code className="font-semibold">since_date</code>
                <p className="text-muted-foreground mt-1">String (optional) - ISO date to filter records modified after this date</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="bg-muted/30 p-3 rounded">
                <code className="font-semibold">list_id</code>
                <p className="text-muted-foreground mt-1">String - Your Mailchimp audience/list ID</p>
              </div>
              <div className="bg-muted/30 p-3 rounded">
                <code className="font-semibold">status_filter</code>
                <p className="text-muted-foreground mt-1">String - Filter by subscription status: subscribed, unsubscribed, cleaned, pending, or all</p>
              </div>
              <div className="bg-muted/30 p-3 rounded">
                <code className="font-semibold">count</code>
                <p className="text-muted-foreground mt-1">Number (optional) - Max number of members to fetch (default: 100)</p>
              </div>
            </div>
          )}
        </div>

        {/* Important Notes */}
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Authentication Required
          </h4>
          <p className="text-sm text-muted-foreground">
            These endpoints require authentication. You must be logged in to test them. The requests use scaffolding mode with placeholder data for demonstration purposes.
          </p>
        </div>

      </CardContent>
    </Card>
  );
};

const TechnicalDocs = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleDownloadPDF = () => {
    toast.info("Opening print dialog...");
    window.print();
  };

  // Define searchable content for each tab
  const tabContent = {
    dataModel: "constituents grants gifts opportunities organizations tables schema database ERD entity relationship fields columns UUID foreign key RLS policies",
    apiEndpoints: "api endpoint salesforce mailchimp import export authentication JSON CSV request response headers body field mapping",
    automation: "automation workflow trigger task qualification awarded compliance dependencies stage status grant major gift moves management",
    changelog: "version changelog updates changes migration breaking deprecation v1.0 v1.1 v1.2 features upcoming"
  };

  // Check if search matches any tab content
  const matchesDataModel = !searchQuery || tabContent.dataModel.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesAPI = !searchQuery || tabContent.apiEndpoints.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesAutomation = !searchQuery || tabContent.automation.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesChangelog = !searchQuery || tabContent.changelog.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Code className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Technical Documentation</h1>
            </div>
            <Button onClick={handleDownloadPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Save as PDF
            </Button>
          </div>
          <p className="text-muted-foreground text-lg">
            Comprehensive technical reference for TailoredU CRM integration and development
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search technical docs... (e.g., 'constituents', 'API', 'grant status', 'automation')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {searchQuery && (
          <div className="mb-6 p-3 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              Searching for: <strong className="text-foreground">{searchQuery}</strong>
            </p>
          </div>
        )}

        <Tabs defaultValue="data-model" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="data-model">
              Data Model
              {searchQuery && matchesDataModel && (
                <Badge variant="secondary" className="ml-2 text-xs">✓</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="api-endpoints">
              API Endpoints
              {searchQuery && matchesAPI && (
                <Badge variant="secondary" className="ml-2 text-xs">✓</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="automation">
              Automation Logic
              {searchQuery && matchesAutomation && (
                <Badge variant="secondary" className="ml-2 text-xs">✓</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="api-tester">
              API Tester
            </TabsTrigger>
            <TabsTrigger value="changelog">
              Change Log
              {searchQuery && matchesChangelog && (
                <Badge variant="secondary" className="ml-2 text-xs">✓</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* DATA MODEL TAB */}
          <TabsContent value="data-model" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  <CardTitle>Data Model Overview</CardTitle>
                </div>
                <CardDescription>
                  Core entities and relationships in TailoredU CRM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ERD Description */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Entity Relationship Diagram</h3>
                  <div className="bg-muted p-6 rounded-lg font-mono text-sm">
                    <pre className="whitespace-pre-wrap">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│                              CONSTITUENTS (50+ fields)                       │
│─────────────────────────────────────────────────────────────────────────────│
│ • id, first_name, last_name, full_legal_name, primary_email                 │
│ • mailing_street, mailing_city, mailing_state, mailing_postal_code          │
│ • total_lifetime_giving, first_gift_date, last_gift_date, last_gift_amount  │
│ • total_pledge_amount, active_pledge_count, outstanding_pledge_balance      │
│ • total_soft_credit_amount, soft_credit_count, last_soft_credit_date        │
│ • email_engagement_score, mailchimp_status, mailchimp_member_rating         │
│ • household_id (FK to households), organization_id (FK to organizations)    │
└─────────────────────────────────────────────────────────────────────────────┘
         │              │              │              │              │
         │ 1:N          │ 1:N          │ N:M          │ N:1          │ 1:N
         ▼              ▼              ▼              ▼              ▼
┌──────────────┐ ┌────────────┐ ┌───────────┐ ┌──────────┐ ┌────────────────┐
│    GIFTS     │ │   MAJOR    │ │  GRANTS   │ │HOUSEHOLDS│ │  RELATIONSHIPS │
│──────────────│ │   GIFTS    │ │ (via M:M) │ │──────────│ │────────────────│
│ • amount     │ │────────────│ │           │ │ • name   │ │ • from/to_id   │
│ • is_pledge  │ │ • stage    │ │           │ │ • primary│ │ • type_id      │
│ • pledge_*   │ │ • expected │ │           │ │   contact│ │ • is_primary   │
└──────────────┘ └────────────┘ └───────────┘ └──────────┘ └────────────────┘
         │                             │
         │ 1:N                         │ 1:N
         ▼                             ▼
┌─────────────────┐            ┌─────────────────────┐
│  SOFT_CREDITS   │            │   GRANT_DOCUMENTS   │
│─────────────────│            │─────────────────────│
│ • gift_id (FK)  │            │ • grant_id (FK)     │
│ • constituent_id│            │ • category_id       │
│ • credit_type   │            │ • extracted_text    │
│ • amount        │            │ • storage_path      │
└─────────────────┘            └─────────────────────┘
         │                             │
         │                             │ 1:N
         │                             ▼
┌─────────────────┐            ┌─────────────────────┐
│ PLEDGE_PAYMENTS │            │   DOCUMENT_CHUNKS   │
│─────────────────│            │─────────────────────│
│ • pledge_id (FK)│            │ • embedding (1536)  │
│ • expected_date │            │ • chunk_index       │
│ • status        │            │ • word_count        │
└─────────────────┘            └─────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONTENT_REPOSITORY                                   │
│─────────────────────────────────────────────────────────────────────────────│
│ • title, content, content_type, tags, category                              │
│ • is_template, is_approved, use_count, last_used_at                         │
│ • embedding vector(1536) ← Phase 2 Semantic Search                          │
│ • last_embedded_at, token_count                                             │
└─────────────────────────────────────────────────────────────────────────────┘

INTEGRATION TABLES (per integration):
├── Salesforce: configurations, field_mappings, import_jobs, import_errors, record_mappings
├── Mailchimp: sync_config, oauth_state, campaigns, list_memberships, audiences, field_mappings, sync_log
├── QuickBooks: connections, oauth_state
└── LMS: configurations, courses, students, enrollments, sync_log

COLLABORATION TABLES:
├── user_roles (admin/staff/viewer)
├── record_locks (field-level soft locking)
├── record_versions (change history)
├── record_activities (activity stream)
└── comments (threaded with @mentions, reactions)`}
                    </pre>
                  </div>
                </div>

                <Separator />

                {/* Constituents Table */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Badge>TABLE</Badge> constituents
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Core entity representing individual donors, prospects, and organizational contacts
                  </p>
                  <div className="space-y-4">
                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Key Fields</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Field</th>
                            <th className="text-left py-2">Type</th>
                            <th className="text-left py-2">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">id</td>
                            <td className="py-2">UUID</td>
                            <td className="py-2">Primary key, auto-generated</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">full_legal_name</td>
                            <td className="py-2">TEXT</td>
                            <td className="py-2">Required. Full legal name of constituent</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">primary_email</td>
                            <td className="py-2">TEXT</td>
                            <td className="py-2">Primary contact email address</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">primary_address</td>
                            <td className="py-2">TEXT</td>
                            <td className="py-2">Mailing address</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">communication_preference</td>
                            <td className="py-2">ENUM</td>
                            <td className="py-2">email | phone | mail | sms | no_contact</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">total_ltv</td>
                            <td className="py-2">NUMERIC</td>
                            <td className="py-2">Calculated field: SUM of all related gifts</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Relationships</h4>
                      <ul className="space-y-1 text-sm ml-4 list-disc">
                        <li>One-to-Many: Constituents → Gifts</li>
                        <li>One-to-Many: Constituents → Major Gift Opportunities</li>
                        <li>Many-to-Many: Constituents ↔ Grant Opportunities (via constituent_grants)</li>
                        <li>One-to-Many: Constituents → Activities</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Grant Opportunities Table */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Badge>TABLE</Badge> grant_opportunities
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Institutional funding opportunities tracked through the grant lifecycle
                  </p>
                  <div className="space-y-4">
                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Key Fields</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Field</th>
                            <th className="text-left py-2">Type</th>
                            <th className="text-left py-2">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">id</td>
                            <td className="py-2">UUID</td>
                            <td className="py-2">Primary key, auto-generated</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">funder_profile_id</td>
                            <td className="py-2">UUID (FK)</td>
                            <td className="py-2">Required. References organizations table</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">title</td>
                            <td className="py-2">TEXT</td>
                            <td className="py-2">Required. Grant opportunity name</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">status_stage</td>
                            <td className="py-2">ENUM</td>
                            <td className="py-2">prospecting | research | letter_of_inquiry | invited_to_apply | application_in_progress | submitted | under_review | awarded | declined | withdrawn | reporting</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">submission_deadline</td>
                            <td className="py-2">DATE</td>
                            <td className="py-2">Application submission due date</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">compliance_reporting_deadline</td>
                            <td className="py-2">DATE</td>
                            <td className="py-2">Reporting deadline for awarded grants</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">requested_amount</td>
                            <td className="py-2">NUMERIC</td>
                            <td className="py-2">Amount requested in application</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">awarded_amount</td>
                            <td className="py-2">NUMERIC</td>
                            <td className="py-2">Actual amount awarded by funder</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Automation Triggers</h4>
                      <ul className="space-y-1 text-sm ml-4 list-disc">
                        <li><strong>Status Change to "awarded"</strong>: Automatically creates compliance task</li>
                        <li>Task assigned to record owner (created_by)</li>
                        <li>See Automation Logic tab for detailed workflow</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Major Gift Opportunities Table */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Badge>TABLE</Badge> major_gift_opportunities
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Individual major donor prospects tracked through the moves management pipeline
                  </p>
                  <div className="space-y-4">
                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Key Fields</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Field</th>
                            <th className="text-left py-2">Type</th>
                            <th className="text-left py-2">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">id</td>
                            <td className="py-2">UUID</td>
                            <td className="py-2">Primary key, auto-generated</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">constituent_id</td>
                            <td className="py-2">UUID (FK)</td>
                            <td className="py-2">Required. References constituents table</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">stage</td>
                            <td className="py-2">ENUM</td>
                            <td className="py-2">identification | qualification | cultivation | solicitation | stewardship | closed_won | closed_lost</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">expected_amount</td>
                            <td className="py-2">NUMERIC</td>
                            <td className="py-2">Projected gift amount</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">expected_date</td>
                            <td className="py-2">DATE</td>
                            <td className="py-2">Projected closing date</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">probability_percent</td>
                            <td className="py-2">INTEGER</td>
                            <td className="py-2">Likelihood of closing (0-100)</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">primary_solicitor</td>
                            <td className="py-2">TEXT</td>
                            <td className="py-2">Lead staff member managing relationship</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">donor_interest</td>
                            <td className="py-2">TEXT</td>
                            <td className="py-2">Constituent's philanthropic interests</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">strategy_notes</td>
                            <td className="py-2">TEXT</td>
                            <td className="py-2">Cultivation and solicitation strategy</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">next_steps</td>
                            <td className="py-2">TEXT</td>
                            <td className="py-2">Planned next actions</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">contact_history</td>
                            <td className="py-2">TEXT</td>
                            <td className="py-2">Summary of donor interactions</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Automation Triggers</h4>
                      <ul className="space-y-1 text-sm ml-4 list-disc">
                        <li><strong>Stage Change to "qualification"</strong>: Creates two dependent tasks</li>
                        <li>Task 1: Manager completes donor profile (must be completed first)</li>
                        <li>Task 2: Development team evaluates prospect (depends on Task 1)</li>
                        <li>See Automation Logic tab for detailed workflow</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API ENDPOINTS TAB */}
          <TabsContent value="api-endpoints" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-primary" />
                  <CardTitle>Integration API Endpoints</CardTitle>
                </div>
                <CardDescription>
                  Scaffolded endpoints for external system integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    ⚠️ Scaffolding Notice
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    These endpoints are currently scaffolded for post-launch implementation. They provide 
                    the structure and authentication patterns but require additional configuration and testing 
                    before production use.
                  </p>
                </div>

                {/* Salesforce Import Endpoint */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    Salesforce Unidirectional Import
                    <Badge variant="outline">POST</Badge>
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        Endpoint Details
                      </h4>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2 font-semibold w-32">URL</td>
                            <td className="py-2 font-mono text-xs">
                              https://oylujswuanavoziyxsye.supabase.co/functions/v1/salesforce-import
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-semibold">Method</td>
                            <td className="py-2">POST</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-semibold">Authentication</td>
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-red-600" />
                                <span>Required - Bearer Token (Supabase JWT)</span>
                              </div>
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-semibold">Content-Type</td>
                            <td className="py-2">application/json</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Request Headers</h4>
                      <div className="bg-muted p-3 rounded font-mono text-xs">
                        <pre>{`Authorization: Bearer <SUPABASE_JWT_TOKEN>
Content-Type: application/json
apikey: <SUPABASE_ANON_KEY>`}</pre>
                      </div>
                    </div>

                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Request Body Schema</h4>
                      <div className="bg-muted p-3 rounded font-mono text-xs">
                        <pre>{`{
  "salesforceInstanceUrl": "https://your-instance.salesforce.com",
  "salesforceAccessToken": "00D...",
  "constituents": [
    {
      "salesforceId": "003...",
      "full_legal_name": "John Doe",
      "primary_email": "john.doe@example.com",
      "primary_address": "123 Main St, City, State 12345",
      "communication_preference": "email"
    }
  ]
}`}</pre>
                      </div>
                    </div>

                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Field Mapping</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Salesforce Field</th>
                            <th className="text-left py-2">TailoredU Field</th>
                            <th className="text-left py-2">Required</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">Contact.Name</td>
                            <td className="py-2 font-mono text-xs">full_legal_name</td>
                            <td className="py-2">✅ Yes</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">Contact.Email</td>
                            <td className="py-2 font-mono text-xs">primary_email</td>
                            <td className="py-2">No</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">Contact.MailingAddress</td>
                            <td className="py-2 font-mono text-xs">primary_address</td>
                            <td className="py-2">No</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Response Format</h4>
                      <div className="bg-muted p-3 rounded font-mono text-xs">
                        <pre>{`{
  "success": true,
  "imported": 15,
  "updated": 3,
  "failed": 0,
  "errors": []
}`}</pre>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Implementation Notes</h4>
                      <ul className="space-y-1 text-sm ml-4 list-disc">
                        <li>Requires Salesforce OAuth 2.0 setup (not included in scaffold)</li>
                        <li>Deduplication based on primary_email field</li>
                        <li>Existing records are updated, new records are created</li>
                        <li>See <code className="text-xs bg-muted px-1 py-0.5 rounded">supabase/functions/salesforce-import/README.md</code> for detailed implementation guide</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Mailchimp Import Endpoint */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    Mailchimp Unidirectional Import
                    <Badge variant="outline">POST</Badge>
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        Endpoint Details
                      </h4>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2 font-semibold w-32">URL</td>
                            <td className="py-2 font-mono text-xs">
                              https://oylujswuanavoziyxsye.supabase.co/functions/v1/mailchimp-import
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-semibold">Method</td>
                            <td className="py-2">POST</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-semibold">Authentication</td>
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-red-600" />
                                <span>Required - Bearer Token (Supabase JWT)</span>
                              </div>
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-semibold">Content-Type</td>
                            <td className="py-2">application/json</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Request Headers</h4>
                      <div className="bg-muted p-3 rounded font-mono text-xs">
                        <pre>{`Authorization: Bearer <SUPABASE_JWT_TOKEN>
Content-Type: application/json
apikey: <SUPABASE_ANON_KEY>`}</pre>
                      </div>
                    </div>

                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Request Body Schema</h4>
                      <div className="bg-muted p-3 rounded font-mono text-xs">
                        <pre>{`{
  "mailchimpApiKey": "your-api-key-us1",
  "listId": "abc123def4",
  "subscribers": [
    {
      "email": "subscriber@example.com",
      "full_name": "Jane Smith",
      "status": "subscribed",
      "tags": ["donor", "newsletter"]
    }
  ]
}`}</pre>
                      </div>
                    </div>

                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Field Mapping</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Mailchimp Field</th>
                            <th className="text-left py-2">TailoredU Field</th>
                            <th className="text-left py-2">Required</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">FNAME + LNAME</td>
                            <td className="py-2 font-mono text-xs">full_legal_name</td>
                            <td className="py-2">✅ Yes</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">email_address</td>
                            <td className="py-2 font-mono text-xs">primary_email</td>
                            <td className="py-2">✅ Yes</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">status</td>
                            <td className="py-2 font-mono text-xs">communication_preference</td>
                            <td className="py-2">No</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Subscription Status Mapping</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Mailchimp Status</th>
                            <th className="text-left py-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">subscribed</td>
                            <td className="py-2">Import as communication_preference: 'email'</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">unsubscribed</td>
                            <td className="py-2">Import as communication_preference: 'no_contact'</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono text-xs">cleaned</td>
                            <td className="py-2">Skip import (invalid email)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Response Format</h4>
                      <div className="bg-muted p-3 rounded font-mono text-xs">
                        <pre>{`{
  "success": true,
  "imported": 42,
  "skipped": 3,
  "errors": [
    {
      "email": "invalid@domain",
      "reason": "Invalid email format"
    }
  ]
}`}</pre>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Implementation Notes</h4>
                      <ul className="space-y-1 text-sm ml-4 list-disc">
                        <li>Supports multiple Mailchimp audience lists</li>
                        <li>Deduplication based on primary_email field</li>
                        <li>Tags imported as metadata for segmentation</li>
                        <li>GDPR compliance: respects unsubscribe status</li>
                        <li>See <code className="text-xs bg-muted px-1 py-0.5 rounded">supabase/functions/mailchimp-import/README.md</code> for detailed implementation guide</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AUTOMATION LOGIC TAB */}
          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <CardTitle>Automation Logic Summary</CardTitle>
                </div>
                <CardDescription>
                  Database triggers and workflow automation patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Grant Compliance Automation */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Badge>P2.1</Badge> Grant Awarded Compliance Task
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Trigger Condition</h4>
                      <div className="bg-muted p-3 rounded">
                        <code className="text-sm">
                          WHEN grant_opportunities.status_stage = 'awarded' AND OLD.status_stage != 'awarded'
                        </code>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Fires when a Grant Opportunity record's status changes TO "awarded" from any other status
                      </p>
                    </div>

                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Automated Actions</h4>
                      <ol className="space-y-3 ml-4 list-decimal text-sm">
                        <li>
                          <strong>Create Task Record</strong>
                          <ul className="ml-4 mt-1 space-y-1 list-disc">
                            <li>Title: "Set Compliance/Reporting Deadlines"</li>
                            <li>Description: Includes grant title for context</li>
                            <li>Status: "pending"</li>
                            <li>Related Grant: Links to triggering grant_opportunity.id</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Assign Task</strong>
                          <ul className="ml-4 mt-1 space-y-1 list-disc">
                            <li>Assigned To: grant_opportunity.created_by (record owner)</li>
                            <li>Created By: Same as record owner</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Set Due Date</strong>
                          <ul className="ml-4 mt-1 space-y-1 list-disc">
                            <li>Uses existing compliance_reporting_deadline if set</li>
                            <li>Otherwise null (requires manual setting)</li>
                          </ul>
                        </li>
                      </ol>
                    </div>

                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Database Implementation</h4>
                      <div className="bg-muted p-3 rounded font-mono text-xs">
                        <pre>{`-- Trigger Function
CREATE FUNCTION public.create_compliance_task()
RETURNS trigger AS $$
BEGIN
  IF NEW.status_stage = 'awarded' AND 
     (OLD.status_stage IS NULL OR OLD.status_stage != 'awarded') THEN
    INSERT INTO public.tasks (
      title, description, assigned_to,
      related_grant_opportunity_id, status,
      due_date, created_by
    ) VALUES (
      'Set Compliance/Reporting Deadlines',
      'Review and set up compliance for: ' || NEW.title,
      NEW.created_by, NEW.id, 'pending',
      NEW.compliance_reporting_deadline, NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_grant_awarded
  AFTER UPDATE ON grant_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION create_compliance_task();`}</pre>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Business Logic Notes</h4>
                      <ul className="space-y-1 text-sm ml-4 list-disc">
                        <li>Prevents duplicate task creation on subsequent updates</li>
                        <li>Task appears immediately in staff member's task list</li>
                        <li>Creates accountability: record owner must set deadlines</li>
                        <li>Supports compliance dashboard by ensuring deadline tracking</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Moves Management Automation */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Badge>P2.3</Badge> Moves Management Dependent Task Flow
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Trigger Condition</h4>
                      <div className="bg-muted p-3 rounded">
                        <code className="text-sm">
                          WHEN major_gift_opportunities.stage = 'qualification' AND OLD.stage != 'qualification'
                        </code>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Fires when a Major Gift Opportunity advances to the "qualification" stage
                      </p>
                    </div>

                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Automated Actions (Sequential)</h4>
                      <ol className="space-y-4 ml-4 list-decimal text-sm">
                        <li>
                          <strong>Create Task 1: Manager Profile Documentation</strong>
                          <ul className="ml-4 mt-1 space-y-1 list-disc">
                            <li>Title: "Manager completes donor profile document"</li>
                            <li>Description: Includes major gift opportunity ID</li>
                            <li>Status: "pending"</li>
                            <li>Assigned To: Record owner (created_by)</li>
                            <li><strong>No dependencies</strong> - Can be worked immediately</li>
                          </ul>
                        </li>
                        <li>
                          <strong>Create Task 2: Team Evaluation (Dependent)</strong>
                          <ul className="ml-4 mt-1 space-y-1 list-disc">
                            <li>Title: "Development Team evaluates prospects"</li>
                            <li>Description: Notes dependency on Task 1</li>
                            <li>Status: "pending"</li>
                            <li>Assigned To: Record owner (created_by)</li>
                            <li><strong>depends_on_task_id: Task 1 ID</strong></li>
                            <li>Cannot be completed until Task 1 is marked complete</li>
                          </ul>
                        </li>
                      </ol>
                    </div>

                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Task Dependency Logic</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Purpose:</strong> Ensures proper workflow sequence</p>
                        <p><strong>Enforcement:</strong></p>
                        <ul className="ml-4 space-y-1 list-disc">
                          <li>Task 2 references Task 1 via <code className="text-xs bg-muted px-1 py-0.5 rounded">depends_on_task_id</code> foreign key</li>
                          <li>UI prevents marking Task 2 complete until Task 1 status = 'complete'</li>
                          <li>Dashboard displays "Waiting on prerequisite" indicator for dependent tasks</li>
                          <li>Task completion order is enforced at application layer</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Database Implementation</h4>
                      <div className="bg-muted p-3 rounded font-mono text-xs">
                        <pre>{`-- Trigger Function
CREATE FUNCTION public.create_qualification_tasks()
RETURNS trigger AS $$
DECLARE
  task1_id UUID;
BEGIN
  IF NEW.stage = 'qualification' AND 
     (OLD.stage IS NULL OR OLD.stage != 'qualification') THEN
    
    -- Task 1: Manager profile
    INSERT INTO public.tasks (
      title, description, assigned_to, status, created_by
    ) VALUES (
      'Manager completes donor profile document',
      'Complete profile for prospect: ' || NEW.id::text,
      NEW.created_by, 'pending', NEW.created_by
    ) RETURNING id INTO task1_id;
    
    -- Task 2: Team evaluation (depends on Task 1)
    INSERT INTO public.tasks (
      title, description, assigned_to, status,
      depends_on_task_id, created_by
    ) VALUES (
      'Development Team evaluates prospects',
      'Evaluate prospect: ' || NEW.id::text,
      NEW.created_by, 'pending',
      task1_id, NEW.created_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER on_qualification_stage
  AFTER UPDATE ON major_gift_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION create_qualification_tasks();`}</pre>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Business Logic Notes</h4>
                      <ul className="space-y-1 text-sm ml-4 list-disc">
                        <li>Implements moves management best practice: qualify before cultivating</li>
                        <li>Dependency pattern prevents premature evaluation</li>
                        <li>Both tasks assigned to same person but typically delegated</li>
                        <li>Task 1 typically takes 5-7 days; Task 2 evaluation within 7 days of completion</li>
                        <li>Supports pipeline velocity tracking by enforcing structured progression</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* General Automation Patterns */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">General Automation Patterns</h3>
                  <div className="space-y-4">
                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Common Characteristics</h4>
                      <ul className="space-y-2 text-sm ml-4 list-disc">
                        <li><strong>Trigger Type:</strong> AFTER UPDATE triggers on status/stage changes</li>
                        <li><strong>Security:</strong> All triggers use SECURITY DEFINER to bypass RLS</li>
                        <li><strong>Assignment:</strong> Tasks assigned to record owner (created_by field)</li>
                        <li><strong>Idempotency:</strong> Prevents duplicate task creation on subsequent updates</li>
                        <li><strong>Audit Trail:</strong> All automated tasks track created_by and timestamps</li>
                      </ul>
                    </div>

                    <div className="bg-card border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">Extensibility Considerations</h4>
                      <ul className="space-y-2 text-sm ml-4 list-disc">
                        <li>Additional stage-based triggers can follow same pattern</li>
                        <li>Task template system could replace hardcoded titles/descriptions</li>
                        <li>Email notifications can be added via additional edge functions</li>
                        <li>Workflow configuration UI could replace trigger-based logic</li>
                        <li>Task dependency supports complex multi-step workflows</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API TESTER TAB */}
          <TabsContent value="api-tester" className="space-y-6">
            <ApiTester />
          </TabsContent>

          {/* CHANGE LOG TAB */}
          <TabsContent value="changelog" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-primary" />
                  <CardTitle>Change Log</CardTitle>
                </div>
                <CardDescription>
                  Version history and updates to the TailoredU CRM platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                
                {/* Version 2.0.0 */}
                <div className="border-l-4 border-primary pl-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="default" className="text-sm">v2.0.0</Badge>
                    <span className="text-sm text-muted-foreground">December 2025</span>
                    <Badge variant="secondary" className="text-xs">Current</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Data Model Changes (35+ tables total)
                      </h4>
                      <ul className="space-y-1 text-sm ml-6 list-disc text-muted-foreground">
                        <li>Added <code className="text-xs bg-muted px-1 py-0.5 rounded">households</code> table for family unit grouping</li>
                        <li>Added <code className="text-xs bg-muted px-1 py-0.5 rounded">constituent_relationships</code> + <code className="text-xs bg-muted px-1 py-0.5 rounded">relationship_types</code> for interpersonal connections</li>
                        <li>Added <code className="text-xs bg-muted px-1 py-0.5 rounded">gift_soft_credits</code> for gift attribution to influencers</li>
                        <li>Added <code className="text-xs bg-muted px-1 py-0.5 rounded">pledge_payments</code> for multi-year gift tracking</li>
                        <li>Added <code className="text-xs bg-muted px-1 py-0.5 rounded">content_repository</code> with <code className="text-xs bg-muted px-1 py-0.5 rounded">embedding vector(1536)</code> for semantic search</li>
                        <li>Added <code className="text-xs bg-muted px-1 py-0.5 rounded">grant_documents</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">document_chunks</code> for RAG-ready document management</li>
                        <li>Added <code className="text-xs bg-muted px-1 py-0.5 rounded">quickbooks_connections</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">quickbooks_oauth_state</code> for QuickBooks integration</li>
                        <li>Expanded <code className="text-xs bg-muted px-1 py-0.5 rounded">constituents</code> to 50+ fields (engagement scores, pledge totals, soft credit rollups)</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        API Endpoints (12+ edge functions)
                      </h4>
                      <ul className="space-y-1 text-sm ml-6 list-disc text-muted-foreground">
                        <li>New: <code className="text-xs bg-muted px-1 py-0.5 rounded">generate-embeddings</code> - OpenAI embeddings for semantic search</li>
                        <li>New: <code className="text-xs bg-muted px-1 py-0.5 rounded">quickbooks-oauth</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">quickbooks-callback</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">quickbooks-refresh-token</code></li>
                        <li>Fixed: <code className="text-xs bg-muted px-1 py-0.5 rounded">mailchimp-oauth</code> stateful flow with state token preservation</li>
                        <li>New: <code className="text-xs bg-muted px-1 py-0.5 rounded">mailchimp-fetch-data</code> utility endpoint</li>
                        <li>New: <code className="text-xs bg-muted px-1 py-0.5 rounded">send-user-invitation</code> for admin user management</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Automation Logic (6 triggers)
                      </h4>
                      <ul className="space-y-1 text-sm ml-6 list-disc text-muted-foreground">
                        <li>New: <code className="text-xs bg-muted px-1 py-0.5 rounded">update_constituent_giving_totals</code> - auto-recalculate on gift changes</li>
                        <li>New: <code className="text-xs bg-muted px-1 py-0.5 rounded">update_pledge_status</code> - auto-update balance and status</li>
                        <li>New: <code className="text-xs bg-muted px-1 py-0.5 rounded">create_reciprocal_relationship</code> - auto-create inverse relationships</li>
                        <li>New: <code className="text-xs bg-muted px-1 py-0.5 rounded">update_soft_credit_rollups</code> - auto-update constituent totals</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Phase 2 AI Features
                      </h4>
                      <ul className="space-y-1 text-sm ml-6 list-disc text-muted-foreground">
                        <li>Activated: Semantic search in Content Repository using OpenAI embeddings</li>
                        <li>Deployed: RAG-ready infrastructure for document semantic search</li>
                        <li>Feature flags for phased rollout of AI capabilities</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Version 1.2.0 */}
                <div className="border-l-4 border-muted pl-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="secondary" className="text-sm">v1.2.0</Badge>
                    <span className="text-sm text-muted-foreground">December 2024</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Data Model Changes
                      </h4>
                      <ul className="space-y-1 text-sm ml-6 list-disc text-muted-foreground">
                        <li>Added <code className="text-xs bg-muted px-1 py-0.5 rounded">content_repository_assets</code> table for document management</li>
                        <li>Added <code className="text-xs bg-muted px-1 py-0.5 rounded">grant_content_links</code> junction table for linking assets to grants</li>
                        <li>Extended <code className="text-xs bg-muted px-1 py-0.5 rounded">content_tags</code> enum with equity and sustainability values</li>
                        <li>Added <code className="text-xs bg-muted px-1 py-0.5 rounded">file_url</code> and <code className="text-xs bg-muted px-1 py-0.5 rounded">file_size</code> fields to content assets</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        API Endpoints
                      </h4>
                      <ul className="space-y-1 text-sm ml-6 list-disc text-muted-foreground">
                        <li>New: Content asset upload and management endpoints</li>
                        <li>Enhanced: Mailchimp import now supports tag import and multi-list processing</li>
                        <li>Improved: Gift export API now includes constituent details in response</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Automation Logic
                      </h4>
                      <ul className="space-y-1 text-sm ml-6 list-disc text-muted-foreground">
                        <li>No changes in this version</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Version 1.1.0 */}
                <div className="border-l-4 border-muted pl-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="secondary" className="text-sm">v1.1.0</Badge>
                    <span className="text-sm text-muted-foreground">November 2024</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Data Model Changes
                      </h4>
                      <ul className="space-y-1 text-sm ml-6 list-disc text-muted-foreground">
                        <li>Added <code className="text-xs bg-muted px-1 py-0.5 rounded">tasks</code> table with dependency tracking (<code className="text-xs bg-muted px-1 py-0.5 rounded">depends_on_task_id</code>)</li>
                        <li>Added <code className="text-xs bg-muted px-1 py-0.5 rounded">contact_history</code> field to major_gift_opportunities</li>
                        <li>Added <code className="text-xs bg-muted px-1 py-0.5 rounded">related_grant_opportunity_id</code> to tasks table</li>
                        <li>Enhanced RLS policies for task management</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        API Endpoints
                      </h4>
                      <ul className="space-y-1 text-sm ml-6 list-disc text-muted-foreground">
                        <li>New: Salesforce unidirectional import endpoint</li>
                        <li>New: Mailchimp unidirectional import endpoint</li>
                        <li>New: Gift export API with JSON/CSV format support</li>
                        <li>Added authentication headers for all integration endpoints</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Automation Logic
                      </h4>
                      <ul className="space-y-1 text-sm ml-6 list-disc text-muted-foreground">
                        <li>Implemented: Moves Management dependent task automation</li>
                        <li>Task 1: "Manager completes donor profile document" (auto-created on Qualification stage)</li>
                        <li>Task 2: "Development Team evaluates prospects" (dependent on Task 1 completion)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Version 1.0.0 */}
                <div className="border-l-4 border-muted pl-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="outline" className="text-sm">v1.0.0</Badge>
                    <span className="text-sm text-muted-foreground">October 2024</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Data Model Changes
                      </h4>
                      <ul className="space-y-1 text-sm ml-6 list-disc text-muted-foreground">
                        <li>Initial schema: <code className="text-xs bg-muted px-1 py-0.5 rounded">constituents</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">gifts</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">grant_opportunities</code></li>
                        <li>Added <code className="text-xs bg-muted px-1 py-0.5 rounded">major_gift_opportunities</code> table</li>
                        <li>Added <code className="text-xs bg-muted px-1 py-0.5 rounded">organizations</code> table for funder profiles</li>
                        <li>Created <code className="text-xs bg-muted px-1 py-0.5 rounded">constituent_grants</code> many-to-many relationship</li>
                        <li>Created <code className="text-xs bg-muted px-1 py-0.5 rounded">constituents_with_ltv</code> view for lifetime value calculations</li>
                        <li>Added <code className="text-xs bg-muted px-1 py-0.5 rounded">activities</code> table for interaction logging</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        API Endpoints
                      </h4>
                      <ul className="space-y-1 text-sm ml-6 list-disc text-muted-foreground">
                        <li>Core CRUD operations for all main entities</li>
                        <li>Authentication system with RLS policies</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Automation Logic
                      </h4>
                      <ul className="space-y-1 text-sm ml-6 list-disc text-muted-foreground">
                        <li>Implemented: Grant Awarded Compliance Task automation</li>
                        <li>Trigger: Grant status_stage changes to "awarded"</li>
                        <li>Action: Creates task "Set Compliance/Reporting Deadlines" assigned to record owner</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Migration Notes */}
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-base">Migration Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <h4 className="font-semibold mb-1">Breaking Changes</h4>
                      <ul className="ml-6 list-disc text-muted-foreground space-y-1">
                        <li><strong>v1.1.0:</strong> Task status field changed from enum to text for flexibility</li>
                        <li><strong>v1.2.0:</strong> Content asset file uploads now require authentication token</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Deprecation Warnings</h4>
                      <ul className="ml-6 list-disc text-muted-foreground space-y-1">
                        <li>None at this time</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Upcoming Features (v2.1.0)</h4>
                      <ul className="ml-6 list-disc text-muted-foreground space-y-1">
                        <li>QuickBooks Stage 2: Gift data sync and financial reporting</li>
                        <li>Notion bidirectional task sync implementation</li>
                        <li>LMS platform integration (Canvas, Blackboard, Moodle)</li>
                        <li>AI content suggestions for grant writing</li>
                        <li>Funder matching using semantic similarity</li>
                        <li>Smart Next Best Action recommendations</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {searchQuery && (
          <Card className="mt-6 border-muted-foreground/20">
            <CardContent className="py-8 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {[matchesDataModel, matchesAPI, matchesAutomation, matchesChangelog].filter(Boolean).length > 0
                  ? `${[matchesDataModel, matchesAPI, matchesAutomation, matchesChangelog].filter(Boolean).length} tab(s) match your search`
                  : "No matching results"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {[matchesDataModel, matchesAPI, matchesAutomation, matchesChangelog].filter(Boolean).length > 0
                  ? "Click on tabs with checkmarks (✓) to view matching content"
                  : "Try different search terms or browse all tabs"}
              </p>
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                <Badge variant="outline">constituents</Badge>
                <Badge variant="outline">API</Badge>
                <Badge variant="outline">automation</Badge>
                <Badge variant="outline">grant</Badge>
                <Badge variant="outline">tasks</Badge>
                <Badge variant="outline">version</Badge>
              </div>
              <Button onClick={() => setSearchQuery("")} variant="outline" size="sm">
                Clear search
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default TechnicalDocs;
