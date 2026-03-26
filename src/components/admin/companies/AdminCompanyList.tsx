import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ShieldAlert } from "lucide-react";
import { format } from "date-fns";

const POSTURE_COLORS: Record<string, string> = {
  Builder: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Scaler: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Fixer: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

function calcCompleteness(p: Record<string, unknown> | null): number {
  if (!p) return 0;
  const fields = ["company_story", "strategic_posture", "culture_summary", "pe_firm_name", "comp_range_min"];
  const filled = fields.filter((f) => p[f] != null && p[f] !== "" && p[f] !== 0).length;
  return Math.round((filled / fields.length) * 100);
}

export function AdminCompanyList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [postureFilter, setPostureFilter] = useState("all");
  const [offLimitsFilter, setOffLimitsFilter] = useState("all");
  const [completenessFilter, setCompletenessFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-companies"],
    queryFn: async () => {
      const { data: companies, error } = await supabase
        .from("crm_companies")
        .select("id, name, company_type, status, domain")
        .order("name");
      if (error) throw error;

      const ids = companies.map((c) => c.id);
      const { data: profiles } = await supabase
        .from("company_profiles")
        .select("*")
        .in("company_id", ids);

      const profileMap = new Map((profiles ?? []).map((p) => [p.company_id, p]));
      return companies.map((c) => ({
        ...c,
        profile: profileMap.get(c.id) ?? null,
      }));
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      const posture = c.profile?.strategic_posture;
      if (postureFilter !== "all" && posture !== postureFilter) return false;
      if (offLimitsFilter === "yes" && !c.profile?.off_limits_source) return false;
      if (offLimitsFilter === "no" && c.profile?.off_limits_source) return false;
      const comp = calcCompleteness(c.profile);
      if (completenessFilter === "low" && comp >= 40) return false;
      if (completenessFilter === "mid" && (comp < 40 || comp >= 80)) return false;
      if (completenessFilter === "high" && comp < 80) return false;
      return true;
    });
  }, [data, search, postureFilter, offLimitsFilter, completenessFilter]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Company Profiles</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search companies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={postureFilter} onValueChange={setPostureFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Posture" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All postures</SelectItem>
            <SelectItem value="Builder">Builder</SelectItem>
            <SelectItem value="Scaler">Scaler</SelectItem>
            <SelectItem value="Fixer">Fixer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={offLimitsFilter} onValueChange={setOffLimitsFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Off-limits" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="yes">Off-limits</SelectItem>
            <SelectItem value="no">Not off-limits</SelectItem>
          </SelectContent>
        </Select>
        <Select value={completenessFilter} onValueChange={setCompletenessFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Completeness" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="low">&lt; 40%</SelectItem>
            <SelectItem value="mid">40–79%</SelectItem>
            <SelectItem value="high">80%+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Posture</TableHead>
              <TableHead className="w-8"></TableHead>
              <TableHead>Profile Completeness</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No companies found</TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => {
                const completeness = calcCompleteness(c.profile);
                const posture = c.profile?.strategic_posture;
                return (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/companies/${c.id}`)}
                  >
                    <TableCell className="font-medium text-primary">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.company_type}</TableCell>
                    <TableCell>
                      {posture && (
                        <Badge variant="secondary" className={POSTURE_COLORS[posture] ?? ""}>
                          {posture}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.profile?.off_limits_source && (
                        <ShieldAlert className="w-4 h-4 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={completeness} className="h-2 w-24" />
                        <span className="text-xs text-muted-foreground">{completeness}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {c.profile?.updated_at
                        ? format(new Date(c.profile.updated_at), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
