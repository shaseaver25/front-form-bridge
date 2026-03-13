import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Building2 } from "lucide-react";
import { RecordAvatar } from "@/components/ui/record-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ESCompany = {
  id: string;
  name: string;
  company_type: string;
  status: string;
  domain: string | null;
  description: string | null;
};

export function ESCompaniesList() {
  const navigate = useNavigate();
  const { isReady } = useAuthReady();
  const [companies, setCompanies] = useState<ESCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isReady) return;
    fetchCompanies();
  }, [isReady]);

  const fetchCompanies = async () => {
    setLoading(true);

    const { data: tagData } = await supabase
      .from("crm_tags")
      .select("id")
      .eq("name", "Executive Search")
      .single();

    if (!tagData) {
      setCompanies([]);
      setLoading(false);
      return;
    }

    const { data: taggedCompanies } = await supabase
      .from("crm_company_tags" as any)
      .select("company_id")
      .eq("tag_id", tagData.id);

    const companyIds = (taggedCompanies || []).map((t: any) => t.company_id);

    if (companyIds.length === 0) {
      setCompanies([]);
      setLoading(false);
      return;
    }

    const { data: companiesData } = await supabase
      .from("crm_companies")
      .select("id, name, company_type, status, domain, description")
      .in("id", companyIds)
      .order("name");

    setCompanies((companiesData as ESCompany[]) || []);
    setLoading(false);
  };

  const filtered = companies.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.domain?.toLowerCase().includes(term) ?? false) ||
      (c.description?.toLowerCase().includes(term) ?? false)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search ES companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Executive Search companies"
          description={
            companies.length === 0
              ? 'Tag companies with "Executive Search" to see them here.'
              : "No companies match your search."
          }
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((company) => (
                <TableRow
                  key={company.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/sites/${company.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <RecordAvatar name={company.name} size="sm" />
                      <span className="font-medium">{company.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize">
                    {company.company_type}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {company.domain || "—"}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {company.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
