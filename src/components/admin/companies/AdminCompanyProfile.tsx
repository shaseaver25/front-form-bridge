import { useParams, useNavigate } from "react-router-dom";
import { useCompanyProfile } from "@/hooks/useCompanyProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { OverviewTab } from "./tabs/OverviewTab";
import { OwnershipCultureTab } from "./tabs/OwnershipCultureTab";
import { LocationsTechTab } from "./tabs/LocationsTechTab";
import { SearchConstraintsTab } from "./tabs/SearchConstraintsTab";
import { DiscoveryNotesTab } from "./tabs/DiscoveryNotesTab";

export function AdminCompanyProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, updateProfile } = useCompanyProfile(id);
  const [dirtyTabs, setDirtyTabs] = useState<Set<string>>(new Set());
  const [savedField, setSavedField] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const markDirty = useCallback((tab: string) => {
    setDirtyTabs((prev) => new Set(prev).add(tab));
  }, []);

  const handleSave = useCallback(
    async (field: string, value: unknown, tab: string) => {
      await updateProfile.mutateAsync({ [field]: value });
      setDirtyTabs((prev) => {
        const next = new Set(prev);
        next.delete(tab);
        return next;
      });
      setSavedField(field);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSavedField(null), 2000);
    },
    [updateProfile]
  );

  const handleSaveAll = useCallback(
    async (updates: Record<string, unknown>, tab: string) => {
      await updateProfile.mutateAsync(updates);
      setDirtyTabs((prev) => {
        const next = new Set(prev);
        next.delete(tab);
        return next;
      });
      setSavedField("all");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSavedField(null), 2000);
    },
    [updateProfile]
  );

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading…</div>;
  }

  if (!data) {
    return <div className="text-center py-20 text-muted-foreground">Company not found</div>;
  }

  const { company, profile } = data;
  const isOffLimits = profile?.off_limits_source === true;

  const tabLabel = (label: string, tabKey: string) => (
    <span className="flex items-center gap-1.5">
      {label}
      {dirtyTabs.has(tabKey) && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
    </span>
  );

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/companies")}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      {isOffLimits && (
        <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm font-medium">
          <ShieldAlert className="w-5 h-5" />
          This company is marked as Off-Limits — {profile?.off_limits_reason || "No reason provided"}
        </div>
      )}

      <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">{tabLabel("Overview", "overview")}</TabsTrigger>
          <TabsTrigger value="ownership">{tabLabel("Ownership & Culture", "ownership")}</TabsTrigger>
          <TabsTrigger value="locations">{tabLabel("Locations & Tech", "locations")}</TabsTrigger>
          <TabsTrigger value="constraints">{tabLabel("Search Constraints", "constraints")}</TabsTrigger>
          <TabsTrigger value="discovery">{tabLabel("Discovery Notes", "discovery")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            profile={profile}
            onSave={(f, v) => handleSave(f, v, "overview")}
            onSaveAll={(u) => handleSaveAll(u, "overview")}
            onDirty={() => markDirty("overview")}
            savedField={savedField}
          />
        </TabsContent>
        <TabsContent value="ownership">
          <OwnershipCultureTab
            profile={profile}
            onSave={(f, v) => handleSave(f, v, "ownership")}
            onSaveAll={(u) => handleSaveAll(u, "ownership")}
            onDirty={() => markDirty("ownership")}
            savedField={savedField}
          />
        </TabsContent>
        <TabsContent value="locations">
          <LocationsTechTab
            profile={profile}
            companyId={id!}
            onSave={(f, v) => handleSave(f, v, "locations")}
            onSaveAll={(u) => handleSaveAll(u, "locations")}
            onDirty={() => markDirty("locations")}
            savedField={savedField}
          />
        </TabsContent>
        <TabsContent value="constraints">
          <SearchConstraintsTab
            profile={profile}
            onSave={(f, v) => handleSave(f, v, "constraints")}
            onSaveAll={(u) => handleSaveAll(u, "constraints")}
            onDirty={() => markDirty("constraints")}
            savedField={savedField}
          />
        </TabsContent>
        <TabsContent value="discovery">
          <DiscoveryNotesTab companyId={id!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
