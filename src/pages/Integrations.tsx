import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Settings, Search, Database, Mail, DollarSign, 
  FileText, GraduationCap, CheckCircle2, AlertCircle,
  Calendar, Zap, ArrowRight, ArrowLeft, Heart
} from "lucide-react";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { useGivebutterConfig } from "@/hooks/useGivebutter";

export default function Integrations() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "connected" | "available">("all");

  // Fetch LMS configurations
  const { data: lmsConfigs } = useQuery({
    queryKey: ["lms-configurations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lms_configurations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch Notion configurations
  const { data: notionConfigs } = useQuery({
    queryKey: ["notion-sync-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notion_sync_config")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch Salesforce configurations
  const { data: salesforceConfigs } = useQuery({
    queryKey: ["salesforce-configurations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salesforce_configurations")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch Mailchimp configuration
  const { data: mailchimpConfig } = useQuery({
    queryKey: ["mailchimp-config"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("mailchimp_sync_config")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Fetch QuickBooks configuration
  const { data: quickbooksConfig } = useQuery({
    queryKey: ["quickbooks-config"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("quickbooks_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Fetch Microsoft Calendar connection
  const { data: calendarConnection } = useQuery({
    queryKey: ["microsoft-calendar-connection"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_microsoft_connections")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Fetch calendar sync settings
  const { data: calendarSettings } = useQuery({
    queryKey: ["calendar-sync-settings-integrations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("calendar_sync_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  // Fetch Microsoft Email connection (uses same connection table but different purpose)
  // Email connection uses the same table as calendar
  const emailConnection = calendarConnection;

  // Fetch Givebutter configuration
  const { data: givebutterConfig } = useGivebutterConfig();

  const integrations = [
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      description: 'Email marketing and subscriber engagement tracking',
      category: 'Marketing',
      icon: Mail,
      status: (mailchimpConfig ? 'connected' : 'available') as 'connected' | 'available',
      lastSync: mailchimpConfig?.last_sync_at ? new Date(mailchimpConfig.last_sync_at).toLocaleDateString() : undefined,
      href: '/mailchimp-settings',
      secondaryHref: '/mailchimp-import',
      secondaryLabel: 'Import All Data',
      color: 'bg-yellow-500',
    },
    {
      id: "salesforce",
      name: "Salesforce",
      description: "Your data foundation - Programs, Constituents, Grants, and more",
      category: "Data",
      icon: Database,
      status: salesforceConfigs && salesforceConfigs.length > 0 ? "connected" as const : "available" as const,
      lastSync: salesforceConfigs?.[0]?.last_sync_at 
        ? new Date(salesforceConfigs[0].last_sync_at).toLocaleDateString() 
        : undefined,
      stats: salesforceConfigs && salesforceConfigs.length > 0 
        ? "Configuration active" 
        : undefined,
      href: "/settings/salesforce",
      color: "blue",
    },
    {
      id: "mailchimp",
      name: "Mailchimp",
      description: "Sync email campaigns and subscriber engagement data",
      category: "Marketing",
      icon: Mail,
      status: "connected" as const,
      lastSync: "15 minutes ago",
      stats: "1,156 subscribers synced",
      color: "yellow",
    },
    {
      id: "notion",
      name: "Notion",
      description: "Sync tasks and notes with your Notion workspace",
      category: "Productivity",
      icon: FileText,
      status: notionConfigs && notionConfigs.length > 0 ? "connected" as const : "available" as const,
      lastSync: notionConfigs && notionConfigs.length > 0 ? "5 minutes ago" : undefined,
      stats: notionConfigs && notionConfigs.length > 0 ? "Task sync active" : undefined,
      href: "/settings/notion",
      color: "gray",
    },
    {
      id: "quickbooks",
      name: "QuickBooks",
      description: "Sync donations and financial data",
      category: "Finance",
      icon: DollarSign,
      status: (quickbooksConfig ? 'connected' : 'available') as 'connected' | 'available',
      lastSync: quickbooksConfig?.updated_at ? new Date(quickbooksConfig.updated_at).toLocaleDateString() : undefined,
      stats: quickbooksConfig?.company_name,
      href: "/quickbooks-settings",
      color: "green",
    },
    {
      id: "givebutter",
      name: "Givebutter",
      description: "Donation campaigns, peer-to-peer fundraising & recurring plans",
      category: "Finance",
      icon: Heart,
      status: (givebutterConfig?.api_key ? 'connected' : 'available') as 'connected' | 'available',
      lastSync: givebutterConfig?.last_sync_at 
        ? new Date(givebutterConfig.last_sync_at).toLocaleDateString() 
        : undefined,
      href: "/settings/givebutter",
      color: "pink",
    },
    {
      id: "give-lively",
      name: "Give Lively",
      description: "Online donation platform integration",
      category: "Finance",
      icon: DollarSign,
      status: "available" as const,
      color: "teal",
    },
    {
      id: "google-analytics",
      name: "Google Analytics",
      description: "Track website visitor data and campaign performance",
      category: "Marketing",
      icon: Zap,
      status: "coming-soon" as const,
      comingSoon: "Q1 2025",
      color: "orange",
    },
    {
      id: "microsoft-calendar",
      name: "Microsoft 365 Calendar",
      description: "Sync calendar events and auto-create meeting prep tasks",
      category: "Productivity",
      icon: Calendar,
      status: (calendarConnection ? 'connected' : 'available') as 'connected' | 'available',
      lastSync: calendarSettings?.last_sync_at 
        ? new Date(calendarSettings.last_sync_at).toLocaleDateString() 
        : undefined,
      stats: calendarConnection ? "Calendar sync active" : undefined,
      href: "/calendar",
      color: "blue",
    },
    {
      id: "microsoft-email",
      name: "Microsoft 365 Email",
      description: "AI-powered task extraction from your inbox",
      category: "Productivity",
      icon: Mail,
      status: (emailConnection ? 'connected' : 'available') as 'connected' | 'available',
      lastSync: emailConnection?.last_sync_at 
        ? new Date(emailConnection.last_sync_at).toLocaleDateString() 
        : undefined,
      stats: emailConnection ? "Email sync active" : undefined,
      href: "/settings/email",
      color: "blue",
    },
    {
      id: "gmail",
      name: "Gmail",
      description: "Connect Gmail for email sending and task extraction",
      category: "Productivity",
      icon: Mail,
      status: "available" as const,
      href: "/settings/gmail",
      color: "red",
    },
    {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Sync calendar events and auto-create meeting prep tasks",
      category: "Productivity",
      icon: Calendar,
      status: "available" as const,
      href: "/settings/google-calendar",
      color: "blue",
    },
  ];

  const connectedCount = integrations.filter(i => i.status === "connected").length;
  const totalCount = integrations.filter(i => i.status !== "coming-soon").length;
  const connectionPercentage = (connectedCount / totalCount) * 100;

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filterStatus === "all" ||
      (filterStatus === "connected" && integration.status === "connected") ||
      (filterStatus === "available" && integration.status === "available");
    
    return matchesSearch && matchesFilter;
  });

  return (
    <Layout>
      <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
            <p className="text-muted-foreground mt-2">
              Connect your tools to supercharge your workflow
            </p>
          </div>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Connection Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Connection Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {connectedCount} of {totalCount} integrations connected
                </span>
                <span className="font-medium">{Math.round(connectionPercentage)}%</span>
              </div>
              <Progress value={connectionPercentage} className="h-2" />
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">All systems operational</span>
            </div>
          </CardContent>
        </Card>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              All
            </Button>
            <Button
              variant={filterStatus === "connected" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("connected")}
            >
              Connected
            </Button>
            <Button
              variant={filterStatus === "available" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("available")}
            >
              Available
            </Button>
          </div>
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredIntegrations.map((integration) => (
          <IntegrationCard key={integration.id} {...integration} />
        ))}
      </div>

      {/* Empty State */}
      {filteredIntegrations.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No integrations found</h3>
              <p className="text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </div>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setFilterStatus("all");
            }}>
              Clear Filters
            </Button>
          </div>
        </Card>
      )}
      </div>
    </Layout>
  );
}
