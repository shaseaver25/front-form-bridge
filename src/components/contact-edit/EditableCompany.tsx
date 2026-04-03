import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Building2 } from "lucide-react";
import { toast } from "sonner";

type CompanyOption = { id: string; name: string };

interface EditableCompanyProps {
  value: string;
  onChange: (companyId: string) => void;
  disabled?: boolean;
}

export default function EditableCompany({ value, onChange, disabled }: EditableCompanyProps) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase
      .from("crm_companies")
      .select("id, name")
      .order("name")
      .limit(500)
      .then(({ data }) => setCompanies(data || []));
  }, []);

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateCompany = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("crm_companies")
        .insert([{ name: newName.trim(), created_by: user?.id }])
        .select("id, name")
        .single();
      if (error) throw error;
      setCompanies((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(data.id);
      setShowNew(false);
      setNewName("");
      toast.success(`Company "${data.name}" created`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create company");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-1.5">
          <Building2 className="w-4 h-4" /> Company
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 text-xs gap-1"
          onClick={() => {
            setShowNew(!showNew);
            if (!showNew) onChange("");
            else setNewName("");
          }}
          disabled={disabled}
        >
          <Plus className="w-3 h-3" />
          {showNew ? "Select existing" : "New company"}
        </Button>
      </div>
      {showNew ? (
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={creating || disabled}
            placeholder="New company name"
            className="flex-1"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleCreateCompany}
            disabled={creating || !newName.trim() || disabled}
          >
            Add
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={disabled}
          />
          <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent className="max-h-48">
              <SelectItem value="none">None</SelectItem>
              {filtered.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
