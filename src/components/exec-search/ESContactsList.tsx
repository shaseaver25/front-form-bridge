import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { RecordAvatar } from "@/components/ui/record-avatar";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ESContact = {
  id: string;
  first_name: string | null;
  last_name: string;
  job_title: string | null;
  status: string;
  primary_email: string | null;
  primary_company_name: string | null;
};

export function ESContactsList() {
  const navigate = useNavigate();
  const { isReady } = useAuthReady();
  const [contacts, setContacts] = useState<ESContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isReady) return;
    fetchContacts();
  }, [isReady]);

  const fetchContacts = async () => {
    setLoading(true);

    // Find the "Executive Search" tag
    const { data: tagData } = await supabase
      .from("crm_tags")
      .select("id")
      .eq("name", "Executive Search")
      .single();

    if (!tagData) {
      setContacts([]);
      setLoading(false);
      return;
    }

    // Get contact IDs with this tag
    const { data: taggedContacts } = await supabase
      .from("crm_contact_tags")
      .select("contact_id")
      .eq("tag_id", tagData.id);

    const contactIds = (taggedContacts || []).map((t) => t.contact_id);

    if (contactIds.length === 0) {
      setContacts([]);
      setLoading(false);
      return;
    }

    // Fetch contact details
    const { data: contactsData } = await supabase
      .from("crm_contacts")
      .select(`
        id, first_name, last_name, job_title, status,
        crm_contact_emails(value, is_primary)
      `)
      .in("id", contactIds)
      .order("last_name");

    // Fetch current career for company names
    const { data: careerData } = await supabase
      .from("crm_career_history")
      .select("contact_id, company_name, crm_companies(name)")
      .eq("is_current", true)
      .in("contact_id", contactIds);

    const companyMap: Record<string, string> = {};
    (careerData || []).forEach((ch: any) => {
      const name = ch.company_name || ch.crm_companies?.name;
      if (name && !companyMap[ch.contact_id]) {
        companyMap[ch.contact_id] = name;
      }
    });

    const mapped: ESContact[] = (contactsData || []).map((c: any) => {
      const primaryEmail =
        c.crm_contact_emails?.find((e: any) => e.is_primary)?.value ||
        c.crm_contact_emails?.[0]?.value ||
        null;
      return {
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        job_title: c.job_title,
        status: c.status,
        primary_email: primaryEmail,
        primary_company_name: companyMap[c.id] || null,
      };
    });

    setContacts(mapped);
    setLoading(false);
  };

  const filtered = contacts.filter((c) => {
    const term = searchTerm.toLowerCase();
    const name = `${c.first_name || ""} ${c.last_name}`.toLowerCase();
    return (
      name.includes(term) ||
      (c.job_title?.toLowerCase().includes(term) ?? false) ||
      (c.primary_email?.toLowerCase().includes(term) ?? false) ||
      (c.primary_company_name?.toLowerCase().includes(term) ?? false)
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
          placeholder="Search ES contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-foreground mb-1">No Executive Search contacts</p>
          <p className="text-sm text-muted-foreground">
            {contacts.length === 0
              ? 'Tag contacts with "Executive Search" to see them here.'
              : "No contacts match your search."}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <RecordAvatar
                        name={`${contact.first_name || ""} ${contact.last_name}`}
                        size="sm"
                      />
                      <span className="font-medium">
                        {contact.first_name} {contact.last_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.job_title || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.primary_company_name || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {contact.primary_email || "—"}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {contact.status}
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
