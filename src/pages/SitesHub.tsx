import { useState } from "react";
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

const siteTypeOptions = [
{ value: "all", label: "All Types" },
{ value: "school", label: "School" },
{ value: "district", label: "District" },
{ value: "organization", label: "Organization" },
{ value: "programming_site", label: "Programming Site" },
{ value: "partner", label: "Partner" }];


const statusOptions = [
{ value: "all", label: "All Status" },
{ value: "prospect", label: "Prospect" },
{ value: "contacted", label: "Contacted" },
{ value: "in_conversation", label: "In Conversation" },
{ value: "pilot", label: "Pilot" },
{ value: "active_partner", label: "Active Partner" },
{ value: "inactive", label: "Inactive" },
{ value: "declined", label: "Declined" }];


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
      let query = supabase.
      from("sites").
      select(`
          *,
          primary_contact:constituents!sites_primary_contact_id_fkey(id, first_name, last_name, primary_email),
          site_contacts(count),
          site_activities(count)
        `).
      order("name");

      if (search) {
        query = query.or(`name.ilike.%${search}%,address_city.ilike.%${search}%`);
      }
      if (filterStatus !== "all") {
        query = query.eq("relationship_status", filterStatus);
      }
      if (filterType !== "all") {
        query = query.eq("site_type", filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

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
            <h1 className="text-3xl font-bold tracking-tight">
</h1>
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
                {siteTypeOptions.map((opt) =>
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
          sites={sites || []}
          isLoading={isLoading}
          onAddSite={() => handleAddSite()} />

        }
        {view === "pipeline" &&
        <SitesPipeline
          sites={sites || []}
          isLoading={isLoading}
          onAddSite={handleAddSite} />

        }
        {view === "kanban" &&
        <SitesKanban
          sites={sites || []}
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