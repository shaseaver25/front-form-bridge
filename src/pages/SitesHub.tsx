import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, LayoutGrid, List, Kanban, Upload, ChevronDown } from "lucide-react";
import Layout from "@/components/Layout";
import { SitesList } from "@/components/sites/SitesList";
import { SitesPipeline } from "@/components/sites/SitesPipeline";
import { SitesKanban } from "@/components/sites/SitesKanban";
import { AddSiteDialog } from "@/components/sites/AddSiteDialog";
import { SiteQuickStats } from "@/components/sites/SiteQuickStats";
import { BulkImportSites } from "@/components/sites/BulkImportSites";

const companyTypeOptions = [
  { value: "all", label: "All Types" },
  { value: "client", label: "Client" },
  { value: "prospect", label: "Prospect" },
  { value: "partner", label: "Partner" },
  { value: "vendor", label: "Vendor" },
];

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "prospect", label: "Prospect" },
  { value: "former", label: "Former" },
];


export default function SitesHub() {
  const [view, setView] = useState<string>("pipeline");
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const { data: sites, isLoading } = useQuery({
    queryKey: ["sites", search, filterStatus, filterType],
    queryFn: async () => {
      let query = supabase
        .from("crm_companies")
        .select("*")
        .order("name");

      if (search) {
        query = query.or(`name.ilike.%${search}%,domain.ilike.%${search}%`);
      }
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }
      if (filterType !== "all") {
        query = query.eq("company_type", filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Fetch contact counts per company
  const { data: careerData } = useQuery({
    queryKey: ["sites-contact-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_career_history")
        .select("company_id, contact_id")
        .eq("is_current", true)
        .not("company_id", "is", null);
      if (error) throw error;
      return data;
    },
  });

  // Fetch company URLs
  const { data: urlData } = useQuery({
    queryKey: ["sites-urls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_contact_urls")
        .select("company_id, value, category")
        .not("company_id", "is", null);
      if (error) throw error;
      return data;
    },
  });

  // Fetch company addresses
  const { data: addressData } = useQuery({
    queryKey: ["sites-addresses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_addresses")
        .select("company_id, city, state")
        .not("company_id", "is", null);
      if (error) throw error;
      return data;
    },
  });

  // Merge enriched data into sites
  const enrichedSites = useMemo(() => {
    if (!sites) return [];

    // Build contact count map
    const contactCountMap: Record<string, Set<string>> = {};
    (careerData || []).forEach((ch: any) => {
      if (!contactCountMap[ch.company_id]) {
        contactCountMap[ch.company_id] = new Set();
      }
      contactCountMap[ch.company_id].add(ch.contact_id);
    });

    // Build URL map (first URL per company)
    const urlMap: Record<string, string> = {};
    (urlData || []).forEach((u: any) => {
      if (!urlMap[u.company_id]) {
        urlMap[u.company_id] = u.value;
      }
    });

    // Build address map (first address per company)
    const addressMap: Record<string, string> = {};
    (addressData || []).forEach((a: any) => {
      if (!addressMap[a.company_id]) {
        const parts = [a.city, a.state].filter(Boolean);
        if (parts.length) addressMap[a.company_id] = parts.join(", ");
      }
    });

    return sites.map((site) => ({
      ...site,
      contactCount: contactCountMap[site.id]?.size || 0,
      websiteUrl: urlMap[site.id] || site.domain || null,
      location: addressMap[site.id] || null,
    }));
  }, [sites, careerData, urlData, addressData]);

  const handleAddSite = (status?: string) => {
    setDefaultStatus(status);
    setShowAddDialog(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
            <p className="text-muted-foreground">

            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Site
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleAddSite()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Single Site
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick Stats */}
        <SiteQuickStats />

        {/* Filters & View Toggle */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search sites..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-[250px]" />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {companyTypeOptions.map((opt) =>
                <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) =>
                <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v)}>
            <ToggleGroupItem value="pipeline" aria-label="Pipeline view">
              <Kanban className="h-4 w-4 mr-1" />
              Pipeline
            </ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Kanban view">
              <LayoutGrid className="h-4 w-4 mr-1" />
              Kanban
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4 mr-1" />
              List
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Views */}
        {view === "list" &&
        <SitesList
          sites={enrichedSites}
          isLoading={isLoading}
          onAddSite={() => handleAddSite()} />
        }
        {view === "pipeline" &&
        <SitesPipeline
          sites={enrichedSites}
          isLoading={isLoading}
          onAddSite={handleAddSite} />
        }
        {view === "kanban" &&
        <SitesKanban
          sites={enrichedSites}
          isLoading={isLoading}
          onAddSite={handleAddSite} />
        }

        <AddSiteDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          defaultStatus={defaultStatus} />

        <BulkImportSites
          open={showImportDialog}
          onOpenChange={setShowImportDialog} />
      </div>
    </Layout>);
}
