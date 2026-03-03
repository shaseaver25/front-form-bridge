import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Zap, CheckCircle2, AlertCircle, Users, FileText, Code, Search, X, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";

const HelpDocs = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Define searchable sections
  const sections = {
    intro: "digital assistant automation background CRM fundraising workflows system relationship",
    grantLifecycle: "grant lifecycle automation compliance awarded reporting deadline task status funder submission",
    movesManagement: "moves management major gift qualification donor profile evaluation task dependent sequential coordination",
    resources: "dashboard resources tips constituent quick actions content repository LYBUNT retention pipeline compliance"
  };

  // Filter sections based on search
  const showIntro = !searchQuery || sections.intro.toLowerCase().includes(searchQuery.toLowerCase());
  const showGrantLifecycle = !searchQuery || sections.grantLifecycle.toLowerCase().includes(searchQuery.toLowerCase());
  const showMovesManagement = !searchQuery || sections.movesManagement.toLowerCase().includes(searchQuery.toLowerCase());
  const showResources = !searchQuery || sections.resources.toLowerCase().includes(searchQuery.toLowerCase());
  const hasResults = showIntro || showGrantLifecycle || showMovesManagement || showResources;

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Help & Documentation</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate("/help/training")} variant="default">
                <Users className="w-4 h-4 mr-2" />
                Training Center
              </Button>
              <Button onClick={() => navigate("/technical-docs")} variant="outline">
                <Code className="w-4 h-4 mr-2" />
                Technical Docs
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-lg">
            Your complete guide to leveraging automated workflows and maximizing fundraising efficiency
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search documentation... (e.g., 'grant automation', 'compliance', 'moves management')"
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
              Showing results for: <strong className="text-foreground">{searchQuery}</strong>
            </p>
          </div>
        )}

        {/* Introduction */}
        {showIntro && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <CardTitle>Your Digital Assistant</CardTitle>
            </div>
            <CardDescription>
              Understanding automation in your fundraising CRM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              This CRM includes powerful automation workflows designed to act as your <strong>digital assistant</strong>. 
              Rather than manually tracking deadlines, creating follow-up tasks, or remembering next steps, the system 
              automatically generates tasks and reminders at critical moments in your fundraising process.
            </p>
            <p>
              These automations work silently in the background, ensuring nothing falls through the cracks while you 
              focus on building relationships and securing funding.
            </p>
          </CardContent>
        </Card>
        )}

        {/* Grant Lifecycle Automation */}
        {showGrantLifecycle && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle>Grant Lifecycle Automation</CardTitle>
            </div>
            <CardDescription>
              Automated compliance tracking for awarded grants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                What Happens Automatically
              </h3>
              <p className="mb-4">
                When a Grant Opportunity's status changes to <Badge variant="outline">Awarded</Badge>, 
                the system automatically creates a compliance task for you.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3">The Automated Workflow</h3>
              <ol className="space-y-4 ml-4">
                <li className="flex gap-3">
                  <span className="font-bold text-primary">1.</span>
                  <div>
                    <strong>Trigger Event:</strong> Staff member updates a Grant Opportunity's status to "Awarded"
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">2.</span>
                  <div>
                    <strong>Automatic Action:</strong> System creates a task titled 
                    <Badge variant="secondary" className="ml-2">Set Compliance/Reporting Deadlines</Badge>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">3.</span>
                  <div>
                    <strong>Task Assignment:</strong> The task is automatically assigned to the record owner 
                    (the staff member responsible for that grant)
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">4.</span>
                  <div>
                    <strong>Your Action:</strong> Complete the task by setting compliance and reporting deadlines 
                    in the Grant Opportunity record
                  </div>
                </li>
              </ol>
            </div>

            <Separator />

            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Why This Matters
              </h3>
              <ul className="space-y-2 ml-4 list-disc">
                <li>
                  <strong>Never miss compliance deadlines:</strong> The system prompts you to set reporting requirements 
                  immediately after a grant is awarded
                </li>
                <li>
                  <strong>Consistent process:</strong> Every awarded grant follows the same workflow, ensuring nothing 
                  is overlooked
                </li>
                <li>
                  <strong>Audit trail:</strong> All tasks are tracked and timestamped, providing documentation for 
                  compliance purposes
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Best Practices</h3>
              <ul className="space-y-2 ml-4 list-disc">
                <li>Review and complete compliance tasks within 48 hours of grant award notification</li>
                <li>Set specific dates in the Grant Opportunity's Compliance/Reporting Deadline field</li>
                <li>Use the Notes field to document any special reporting requirements from the funder</li>
                <li>Check the Compliance Dashboard regularly to monitor upcoming deadlines across all grants</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Moves Management Automation */}
      {showMovesManagement && (
      <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle>Moves Management Automation</CardTitle>
            </div>
            <CardDescription>
              Structured qualification process for major gift prospects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                What Happens Automatically
              </h3>
              <p className="mb-4">
                When a Major Gift Opportunity moves to the <Badge variant="outline">Qualification</Badge> stage, 
                the system automatically creates a two-task sequence with built-in dependencies.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-lg mb-3">The Automated Workflow</h3>
              <ol className="space-y-4 ml-4">
                <li className="flex gap-3">
                  <span className="font-bold text-primary">1.</span>
                  <div>
                    <strong>Trigger Event:</strong> Staff member advances a Major Gift Opportunity to "Qualification" stage
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">2.</span>
                  <div>
                    <strong>First Task Created:</strong> 
                    <Badge variant="secondary" className="ml-2">Manager completes donor profile document</Badge>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This task is assigned to the manager and must be completed before the next task becomes active
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">3.</span>
                  <div>
                    <strong>Second Task Created (Dependent):</strong> 
                    <Badge variant="secondary" className="ml-2">Development Team evaluates prospects</Badge>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This task becomes actionable only after Task 1 is marked complete
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-primary">4.</span>
                  <div>
                    <strong>Sequential Execution:</strong> The task dependency ensures proper workflow sequence 
                    and prevents premature evaluation
                  </div>
                </li>
              </ol>
            </div>

            <Separator />

            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Why This Matters
              </h3>
              <ul className="space-y-2 ml-4 list-disc">
                <li>
                  <strong>Structured qualification:</strong> Every prospect goes through the same rigorous evaluation 
                  process, ensuring consistency
                </li>
                <li>
                  <strong>Team coordination:</strong> Tasks are automatically assigned to the right people at the right time
                </li>
                <li>
                  <strong>Dependency management:</strong> The system prevents the team evaluation from happening before 
                  the donor profile is complete
                </li>
                <li>
                  <strong>Pipeline integrity:</strong> Automated workflows ensure prospects are properly vetted before 
                  advancing to cultivation
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Best Practices</h3>
              <ul className="space-y-2 ml-4 list-disc">
                <li>
                  <strong>Manager's Role:</strong> Complete the donor profile document within 5 business days, 
                  including capacity assessment, giving history analysis, and relationship mapping
                </li>
                <li>
                  <strong>Team Evaluation:</strong> Once the profile is complete, the development team should convene 
                  within 7 days to review and determine cultivation strategy
                </li>
                <li>
                  <strong>Documentation:</strong> Use the Major Gift Opportunity's Strategy Notes field to record 
                  team evaluation outcomes
                </li>
                <li>
                  <strong>Next Steps:</strong> Update the Next Steps field with specific cultivation actions before 
                  marking the evaluation task complete
                </li>
                <li>
                  Check the Pipeline Dashboard regularly to monitor major gift velocity and stage progression
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Understanding Task Dependencies</h3>
              <div className="bg-card border rounded-lg p-4">
                <p className="mb-3">
                  Task dependencies ensure workflows execute in the correct order. When a task has a dependency:
                </p>
                <ul className="space-y-2 ml-4 list-disc">
                  <li>The dependent task appears in your task list but is marked as "Waiting on prerequisite"</li>
                  <li>You cannot mark a dependent task complete until its predecessor is finished</li>
                  <li>This prevents team members from skipping critical steps in the qualification process</li>
                  <li>The system maintains workflow integrity even when multiple people are collaborating</li>
                </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Getting Help */}
      {showResources && (
      <Card>
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
            <CardDescription>Where to find more help and support</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Dashboard Guides</h3>
              <ul className="space-y-2 ml-4 list-disc text-sm">
                <li>
                  <strong>Compliance Dashboard:</strong> Monitor upcoming grant submission and reporting deadlines, 
                  review pledge aging for major gifts
                </li>
                <li>
                  <strong>Pipeline Dashboard:</strong> Track major gift opportunities by stage, analyze conversion 
                  rates, forecast expected revenue
                </li>
                <li>
                  <strong>Retention Dashboard:</strong> Measure donor retention rates, analyze lifetime value 
                  distribution, identify lapsed donors
                </li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Quick Tips</h3>
              <ul className="space-y-2 ml-4 list-disc text-sm">
                <li>Use the 360° Constituent View to see all interactions, gifts, and grant relationships in one place</li>
                <li>Quick Actions let you log calls, emails, and meetings without leaving the constituent record</li>
                <li>Content Repository Assets can be linked to multiple Grant Opportunities for easy proposal reuse</li>
                <li>Filter constituents by LYBUNT status to identify lapsed donors for reactivation campaigns</li>
              </ul>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Legal
              </h3>
              <ul className="space-y-2 ml-4 list-disc text-sm">
                <li>
                  <Link to="/legal/terms" className="text-primary hover:underline">Terms of Service</Link>
                  {" "}- Usage terms and conditions for TailoredU CRM
                </li>
                <li>
                  <Link to="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                  {" "}- How we collect, use, and protect your data
                </li>
              </ul>
            </div>
        </CardContent>
      </Card>
      )}

      {searchQuery && !hasResults && (
        <Card className="mb-8 border-muted-foreground/20">
          <CardContent className="py-8 text-center">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try searching for terms like "grant automation", "compliance", "major gifts", or "tasks"
            </p>
            <Button onClick={() => setSearchQuery("")} variant="outline" size="sm">
              Clear search
            </Button>
          </CardContent>
        </Card>
      )}

      {searchQuery && hasResults && (
        <div className="mb-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-center">
            <strong>{[showIntro, showGrantLifecycle, showMovesManagement, showResources].filter(Boolean).length}</strong> section(s) found matching your search
          </p>
        </div>
      )}
    </div>
  </Layout>
);
};

export default HelpDocs;
