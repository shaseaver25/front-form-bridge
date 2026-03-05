import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Loader2, Phone, MapPin, Building2, Clock } from "lucide-react";
import ConstituentForm from "./ConstituentForm";
import ConstituentDetail from "./ConstituentDetail";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { RecordAvatar } from "@/components/ui/record-avatar";
import { ListCard } from "@/components/ui/list-card";
import { FloatingActions } from "@/components/ui/floating-actions";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { SearchFilterBar } from "@/components/ui/search-filter-bar";
import { DensityToggle } from "@/components/ui/density-toggle";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDistanceToNow } from "date-fns";

type Contact = {
  id: string;
  first_name: string | null;
  last_name: string;
  job_title: string | null;
  status: string;
  contact_type: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  primary_email?: string | null;
  primary_phone?: string | null;
  primary_company_name?: string | null;
  primary_company_id?: string | null;
  source_id?: string | null;
  city?: string | null;
  state?: string | null;
  last_activity_date?: string | null;
  average_rating?: number | null;
};

const ConstituentList = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [allTags, setAllTags] = useState<{ id: string; name: string }[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [contactTagMap, setContactTagMap] = useState<Record<string, string[]>>({});

  const fetchContacts = async () => {
    setLoading(true);

    // Fetch contacts with emails
    const { data: contactsData, error } = await supabase
      .from("crm_contacts")
      .select(`
        id, first_name, last_name, job_title, status, contact_type, 
        description, created_at, updated_at, primary_company_id, source_id,
        last_activity_date, average_rating,
        crm_contact_emails(value, is_primary)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load contacts:", error);
      toast.error("Failed to load contacts");
      setLoading(false);
      return;
    }

    const contactIds = (contactsData || []).map((c: any) => c.id);

    // Fetch phones, addresses, and career history (for company) in parallel
    const [phonesRes, addressesRes, careerRes] = await Promise.all([
      supabase
        .from("crm_contact_phones")
        .select("contact_id, value, is_primary")
        .in("contact_id", contactIds),
      supabase
        .from("crm_addresses")
        .select("contact_id, city, state, is_primary")
        .in("contact_id", contactIds),
      supabase
        .from("crm_career_history")
        .select("contact_id, company_name, company_id, crm_companies(name)")
        .eq("is_current", true)
        .in("contact_id", contactIds),
    ]);

    // Build lookup maps
    const phoneMap: Record<string, string> = {};
    (phonesRes.data || []).forEach((p: any) => {
      if (!phoneMap[p.contact_id] || p.is_primary) {
        phoneMap[p.contact_id] = p.value;
      }
    });

    const addressMap: Record<string, { city: string | null; state: string | null }> = {};
    (addressesRes.data || []).forEach((a: any) => {
      if (!addressMap[a.contact_id] || a.is_primary) {
        addressMap[a.contact_id] = { city: a.city, state: a.state };
      }
    });

    const companyMap: Record<string, string> = {};
    (careerRes.data || []).forEach((ch: any) => {
      const name = ch.company_name || ch.crm_companies?.name;
      if (name && !companyMap[ch.contact_id]) {
        companyMap[ch.contact_id] = name;
      }
    });

    const mapped: Contact[] = (contactsData || []).map((c: any) => {
      const primaryEmail = c.crm_contact_emails?.find((e: any) => e.is_primary)?.value 
        || c.crm_contact_emails?.[0]?.value 
        || null;
      return {
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        job_title: c.job_title,
        status: c.status,
        contact_type: c.contact_type,
        description: c.description,
        created_at: c.created_at,
        updated_at: c.updated_at,
        primary_email: primaryEmail,
        primary_phone: phoneMap[c.id] || null,
        primary_company_name: companyMap[c.id] || null,
        primary_company_id: c.primary_company_id,
        source_id: c.source_id,
        city: addressMap[c.id]?.city || null,
        state: addressMap[c.id]?.state || null,
        last_activity_date: c.last_activity_date,
        average_rating: c.average_rating,
      };
    });

    setContacts(mapped);
    setLoading(false);
  };

  const fetchTags = async () => {
    const { data: tagsData } = await supabase.from("crm_tags").select("id, name").order("name");
    setAllTags(tagsData || []);

    const { data: contactTags } = await supabase.from("crm_contact_tags").select("contact_id, tag_id");
    const map: Record<string, string[]> = {};
    (contactTags || []).forEach((ct: any) => {
      if (!map[ct.contact_id]) map[ct.contact_id] = [];
      map[ct.contact_id].push(ct.tag_id);
    });
    setContactTagMap(map);
  };

  useEffect(() => {
    fetchContacts();
    fetchTags();
  }, []);

  const getDisplayName = (c: Contact) => {
    return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown";
  };

  const getLocation = (c: Contact) => {
    return [c.city, c.state].filter(Boolean).join(", ");
  };

  const filteredContacts = contacts.filter((c) => {
    const name = getDisplayName(c).toLowerCase();
    const email = (c.primary_email || "").toLowerCase();
    const company = (c.primary_company_name || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = name.includes(search) || email.includes(search) || company.includes(search);
    const matchesTags = selectedTagIds.length === 0 || selectedTagIds.every((tagId) => (contactTagMap[c.id] || []).includes(tagId));
    return matchesSearch && matchesTags;
  });

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setFormOpen(true);
  };

  const handleView = (contact: Contact) => {
    setSelectedContact(contact);
    setDetailOpen(true);
  };

  const handleDeleteClick = (contact: Contact) => {
    setSelectedContact(contact);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedContact) return;

    setDeleteLoading(true);
    const { error } = await supabase.from("crm_contacts").delete().eq("id", selectedContact.id);

    setDeleteLoading(false);
    setDeleteDialogOpen(false);

    if (error) {
      toast.error("Failed to delete contact");
    } else {
      toast.success("Contact deleted successfully");
      fetchContacts();
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedTagIds([]);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const tagFilterChips = selectedTagIds.map((tagId) => ({
    id: `tag:${tagId}`,
    label: allTags.find((t) => t.id === tagId)?.name || tagId,
  }));

  const handleFilterRemove = (filterId: string) => {
    if (filterId.startsWith("tag:")) {
      const tagId = filterId.replace("tag:", "");
      setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">Contacts</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your contacts and client database
              </p>
            </div>
            <div className="flex items-center gap-2">
              <DensityToggle value={density} onChange={setDensity} />
              <Button
                onClick={() => {
                  setSelectedContact(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <SearchFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filters={tagFilterChips}
              onFilterRemove={handleFilterRemove}
              onClearAll={handleClearFilters}
              totalCount={contacts.length}
              filteredCount={filteredContacts.length}
              placeholder="Search by name, email, or company..."
            />
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selectedTagIds.includes(tag.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <SkeletonCard type="constituent" count={6} />
          ) : filteredContacts.length === 0 ? (
            <EmptyState
              type={searchTerm ? "no-results" : "no-data"}
              searchTerm={searchTerm}
              entityName="Contact"
              onAction={
                !searchTerm
                  ? () => {
                      setSelectedContact(null);
                      setFormOpen(true);
                    }
                  : undefined
              }
              actionLabel="Add Contact"
            />
          ) : (
            <div
              className={
                density === "comfortable"
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in"
                  : "space-y-3 animate-fade-in"
              }
            >
              {filteredContacts.map((contact) => (
                <ListCard
                  key={contact.id}
                  onClick={() => handleView(contact)}
                  className={density === "compact" ? "p-4" : ""}
                >
                  <FloatingActions
                    onView={() => handleView(contact)}
                    onEdit={() => handleEdit(contact)}
                    onDelete={() => handleDeleteClick(contact)}
                  />

                  <div className="flex items-start gap-4">
                    <RecordAvatar
                      type="constituent"
                      name={getDisplayName(contact)}
                      size={density === "compact" ? "sm" : "md"}
                    />

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold text-foreground truncate ${density === "compact" ? "text-base" : "text-lg"}`}
                      >
                        {getDisplayName(contact)}
                      </h3>
                      {contact.primary_company_name && (
                        <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                          <Building2 className="w-3 h-3 shrink-0" />
                          {contact.primary_company_name}
                        </p>
                      )}
                      {contact.job_title && (
                        <p className="text-sm text-muted-foreground truncate">
                          {contact.job_title}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground truncate">
                        {contact.primary_email || "No email"}
                      </p>
                      {contact.primary_phone && (
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <Phone className="w-3 h-3 shrink-0" />
                          {contact.primary_phone}
                        </p>
                      )}
                      {getLocation(contact) && (
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {getLocation(contact)}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                          {contact.status}
                        </span>
                        {contact.last_activity_date && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(contact.last_activity_date), { addSuffix: true })}
                          </span>
                        )}
                        {(contactTagMap[contact.id] || []).slice(0, density === "compact" ? 2 : 3).map((tagId) => {
                          const tag = allTags.find((t) => t.id === tagId);
                          return tag ? (
                            <span key={tagId} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                              {tag.name}
                            </span>
                          ) : null;
                        })}
                        {(contactTagMap[contact.id] || []).length > (density === "compact" ? 2 : 3) && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            +{(contactTagMap[contact.id] || []).length - (density === "compact" ? 2 : 3)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </ListCard>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConstituentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={fetchContacts}
        constituent={selectedContact}
      />

      <ConstituentDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        constituent={selectedContact}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedContact ? getDisplayName(selectedContact) : ""} from your
              database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConstituentList;
