import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Download, Database, Loader2, CheckCircle, Copy, FileCode, AlertCircle, ShieldCheck, FileText } from "lucide-react";
import { toast } from "sonner";

// Static overlay files imported at build time
import overlay001 from "@/../supabase/provisioning/001_super_admin_backdoor.sql?raw";
import overlay002 from "@/../supabase/provisioning/002_tier_rls_policies.sql?raw";
import overlay003 from "@/../supabase/provisioning/003_support_tickets.sql?raw";

interface SchemaStats {
  tables: number;
  enums: number;
  functions: number;
  policies: number;
  triggers: number;
  foreignKeys: number;
  excludedTables: number;
  excludedFunctions: number;
}

const overlayFiles = [
  { name: "001_super_admin_backdoor.sql", label: "Super Admin Backdoor", description: "adds is_super_admin flag, access log, read policies for TailoredU team", content: overlay001 },
  { name: "002_tier_rls_policies.sql", label: "Tier-Based RLS Policies", description: "enforces subscription tier gating (starter/professional/enterprise)", content: overlay002 },
  { name: "003_support_tickets.sql", label: "Support Tickets", description: "creates support_tickets table for in-app help bubble", content: overlay003 },
];

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/sql" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export default function SchemaExportPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [schemaSQL, setSchemaSQL] = useState<string | null>(null);
  const [stats, setStats] = useState<SchemaStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke("export-schema");
      
      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error || "Export failed");
      
      setSchemaSQL(data.sql);
      setStats(data.stats);
      toast.success("Base schema exported successfully!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to export schema";
      setError(message);
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadBase = () => {
    if (!schemaSQL) return;
    downloadFile(schemaSQL, `000_base_schema_${new Date().toISOString().split("T")[0]}.sql`);
    toast.success("Base schema downloaded!");
  };

  const handleDownloadAll = () => {
    if (!schemaSQL) return;
    const combined = [
      `-- === 000: BASE SCHEMA ===\n\n${schemaSQL}`,
      ...overlayFiles.map((f, i) => `\n\n-- === ${String(i + 1).padStart(3, "0")}: ${f.label.toUpperCase()} ===\n\n${f.content}`)
    ].join("");
    downloadFile(combined, `cm-crm-full-provisioning_${new Date().toISOString().split("T")[0]}.sql`);
    toast.success("Full provisioning bundle downloaded!");
  };

  const handleCopy = async (content: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schema Export</h1>
          <p className="text-muted-foreground">
            Generate curated SQL schema for provisioning new customer databases
          </p>
        </div>

        {/* Provisioning Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Customer Database Provisioning
            </CardTitle>
            <CardDescription>
              Export the customer-only database schema — admin tables and introspection functions are automatically excluded
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Steps to provision a new customer:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Create a new Supabase project for the customer</li>
                <li>Generate &amp; download the base schema below</li>
                <li>Open the customer's Supabase SQL Editor</li>
                <li>Run the base schema SQL (000)</li>
                <li>Run the overlay files in order: 001 → 002 → 003</li>
                <li>Register the customer in Admin → Customers</li>
                <li>Deploy the codebase to Vercel with customer's Supabase credentials</li>
              </ol>
            </div>

            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                Admin-only tables (saas_organizations, config sync logs, etc.) and schema introspection functions are automatically filtered out.
                Vector extension references (<code>extensions.vector</code>) are rewritten to <code>vector</code> for compatibility with fresh databases.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Base Schema Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              000 — Base Schema
            </CardTitle>
            <CardDescription>
              Dynamically generated from the current database, excluding admin tables and fixing vector references
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileCode className="h-4 w-4 mr-2" />
                    Generate Base Schema
                  </>
                )}
              </Button>

              {schemaSQL && (
                <>
                  <Button variant="outline" onClick={() => handleCopy(schemaSQL, "Base schema")}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" onClick={handleDownloadBase}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={handleDownloadAll}>
                    <Download className="h-4 w-4 mr-2" />
                    Download All (000–003)
                  </Button>
                </>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {schemaSQL && stats && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Generated successfully</span>
                  <span className="text-xs text-muted-foreground">({formatBytes(new Blob([schemaSQL]).size)}, {schemaSQL.split("\n").length} lines)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{stats.tables} Tables</Badge>
                  <Badge variant="secondary">{stats.enums} Enums</Badge>
                  <Badge variant="secondary">{stats.functions} Functions</Badge>
                  <Badge variant="secondary">{stats.policies} Policies</Badge>
                  <Badge variant="secondary">{stats.triggers} Triggers</Badge>
                  <Badge variant="secondary">{stats.foreignKeys} Foreign Keys</Badge>
                  <Badge variant="outline" className="text-muted-foreground">
                    {stats.excludedTables} admin tables excluded
                  </Badge>
                  <Badge variant="outline" className="text-muted-foreground">
                    {stats.excludedFunctions} helper functions excluded
                  </Badge>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[300px] text-xs font-mono">
                  {schemaSQL.substring(0, 3000)}
                  {schemaSQL.length > 3000 && "\n\n... (truncated preview — download for full SQL)"}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overlay Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Provisioning Overlay Files
            </CardTitle>
            <CardDescription>
              After running the base schema, apply these overlays in order in the customer's SQL Editor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {overlayFiles.map((f, i) => (
                  <TabsTrigger key={i} value={`file-${i}`}>
                    {String(i + 1).padStart(3, "0")}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="space-y-3 pt-4">
                {overlayFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge>{String(i + 1).padStart(3, "0")}</Badge>
                      <span className="font-medium">{f.label}</span>
                      <span className="text-muted-foreground text-sm">— {f.description}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleCopy(f.content, f.label)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => downloadFile(f.content, f.name)}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground pt-2">
                  These files are bundled from <code>supabase/provisioning/</code> in the repository.
                </p>
              </TabsContent>

              {overlayFiles.map((f, i) => (
                <TabsContent key={i} value={`file-${i}`} className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{f.name}</span>
                      <span className="text-xs text-muted-foreground">({formatBytes(new Blob([f.content]).size)}, {f.content.split("\n").length} lines)</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleCopy(f.content, f.label)}>
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadFile(f.content, f.name)}>
                        <Download className="h-3 w-3 mr-1" /> Download
                      </Button>
                    </div>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-[400px] text-xs font-mono">
                    {f.content}
                  </pre>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Vercel Deployment Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Vercel Multi-Project Deployment</CardTitle>
            <CardDescription>
              Deploy the same codebase to multiple Vercel projects with different backends
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Environment Variables for Each Vercel Project:</h4>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
                <p>VITE_SUPABASE_URL=https://[project-ref].supabase.co</p>
                <p>VITE_SUPABASE_PUBLISHABLE_KEY=[anon-key]</p>
                <p>VITE_SUPABASE_PROJECT_ID=[project-ref]</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Quick Setup:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to vercel.com → Add New Project</li>
                <li>Import your GitHub repository</li>
                <li>Set Framework Preset to "Vite"</li>
                <li>Add environment variables above</li>
                <li>Deploy</li>
              </ol>
            </div>
            <Alert>
              <AlertDescription>
                When you push code changes to GitHub, all connected Vercel projects will automatically rebuild and deploy.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
