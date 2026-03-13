import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor, { RichTextDisplay } from "@/components/ui/rich-text-editor";
import CareerHistoryEntry from "@/components/CareerHistoryEntry";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  User,
  Building2,
  Briefcase,
  Globe,
  MapPin,
  Tag,
  History,
  GraduationCap,
  Pencil,
  X,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ContactNotes from "@/components/ContactNotes";
import ContactDocuments from "@/components/ContactDocuments";
import ContactResumes from "@/components/ContactResumes";
import ContactAvatar from "@/components/ContactAvatar";
import ContactTagManager from "@/components/ContactTagManager";
import EditableMultiValueField from "@/components/contact-edit/EditableMultiValueField";
import EditableAddresses from "@/components/contact-edit/EditableAddresses";
import { useContactEdit } from "@/hooks/useContactEdit";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useToast } from "@/hooks/use-toast";

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isReady } = useAuthReady();

  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<any[]>([]);
  const [phones, setPhones] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [urls, setUrls] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [careerHistory, setCareerHistory] = useState<any[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [enriching, setEnriching] = useState(false);

  const fetchContact = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_contacts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    setContact(data);

    const [emailsRes, phonesRes, urlsRes, tagsRes, addressesRes, careerRes] =
      await Promise.all([
        supabase.from("crm_contact_emails").select("*").eq("contact_id", id),
        supabase.from("crm_contact_phones").select("*").eq("contact_id", id),
        supabase.from("crm_contact_urls").select("*").eq("contact_id", id),
        supabase
          .from("crm_contact_tags")
          .select("tag_id, crm_tags(id, name, category)")
          .eq("contact_id", id),
        supabase.from("crm_addresses").select("*").eq("contact_id", id),
        supabase
          .from("crm_career_history")
          .select("*")
          .eq("contact_id", id)
          .order("is_current", { ascending: false })
          .order("started_at", { ascending: false }),
      ]);

    setEmails(emailsRes.data || []);
    setPhones(phonesRes.data || []);
    setUrls(urlsRes.data || []);
    setTags(
      (tagsRes.data || []).map((row: any) => row.crm_tags).filter(Boolean)
    );
    setAddresses(addressesRes.data || []);
    setCareerHistory(careerRes.data || []);

    if (data.primary_company_id) {
      supabase
        .from("crm_companies")
        .select("id, name, domain")
        .eq("id", data.primary_company_id)
        .single()
        .then(({ data: co }) => setCompany(co));
    } else {
      supabase
        .from("crm_career_history")
        .select("company_name, company_id, crm_companies(id, name)")
        .eq("contact_id", id)
        .eq("is_current", true)
        .limit(1)
        .then(({ data: ch }) => {
          if (ch && ch.length > 0) {
            const name =
              ch[0].company_name || (ch[0] as any).crm_companies?.name;
            const companyId =
              ch[0].company_id || (ch[0] as any).crm_companies?.id;
            if (name) setCompany({ id: companyId, name, domain: null });
            else setCompany(null);
          } else {
            setCompany(null);
          }
        });
    }

    if (data.source_id) {
      supabase
        .from("crm_contact_sources")
        .select("name")
        .eq("id", data.source_id)
        .single()
        .then(({ data: s }) => setSource(s?.name || null));
    } else {
      setSource(null);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (isReady) {
      fetchContact();
    }
  }, [fetchContact, isReady]);

  const {
    editing,
    saving,
    editData,
    setEditData,
    editEmails,
    setEditEmails,
    editPhones,
    setEditPhones,
    editUrls,
    setEditUrls,
    editAddresses,
    setEditAddresses,
    startEditing,
    cancelEditing,
    save,
  } = useContactEdit(id || "", fetchContact);

  const handleStartEdit = () => {
    startEditing(contact, emails, phones, urls, addresses);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatAddress = (addr: any) =>
    [addr.line1, addr.line2, addr.city, addr.state, addr.zip_code, addr.country]
      .filter(Boolean)
      .join(", ");

  const updateField = (field: string, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </Layout>
    );
  }

  if (!contact) {
    return (
      <Layout>
        <div className="space-y-4 max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate("/constituents")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contacts
          </Button>
          <p className="text-muted-foreground">Contact not found.</p>
        </div>
      </Layout>
    );
  }

  const displayName =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
    "Unknown";

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/constituents")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contacts
          </Button>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="ghost" onClick={cancelEditing} disabled={saving}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={save} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleStartEdit}>
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <ContactAvatar
                contactId={contact.id}
                iconUrl={contact.icon_attachment_url}
                name={displayName}
                onUpdate={(newPath) => setContact((prev: any) => ({ ...prev, icon_attachment_url: newPath }))}
              />
              {editing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={editData.salutation}
                      onChange={(e) => updateField("salutation", e.target.value)}
                      placeholder="Salutation"
                      className="w-24"
                    />
                    <Input
                      value={editData.first_name}
                      onChange={(e) => updateField("first_name", e.target.value)}
                      placeholder="First Name"
                      className="w-40"
                    />
                    <Input
                      value={editData.middle_name}
                      onChange={(e) => updateField("middle_name", e.target.value)}
                      placeholder="Middle"
                      className="w-28"
                    />
                    <Input
                      value={editData.last_name}
                      onChange={(e) => updateField("last_name", e.target.value)}
                      placeholder="Last Name *"
                      className="w-40"
                    />
                    <Input
                      value={editData.suffix}
                      onChange={(e) => updateField("suffix", e.target.value)}
                      placeholder="Suffix"
                      className="w-20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={editData.job_title}
                      onChange={(e) => updateField("job_title", e.target.value)}
                      placeholder="Job Title"
                      className="w-64"
                    />
                    <Input
                      value={editData.nick_name}
                      onChange={(e) => updateField("nick_name", e.target.value)}
                      placeholder="Nickname"
                      className="w-40"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={editData.contact_type} onValueChange={(v) => updateField("contact_type", v)}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["candidate", "contact", "client", "lead"].map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={editData.status} onValueChange={(v) => updateField("status", v)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["active", "inactive", "archived", "do_not_contact"].map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {displayName}
                  </h1>
                  {contact.job_title && (
                    <p className="text-lg text-muted-foreground">
                      {contact.job_title}
                    </p>
                  )}
                </div>
              )}
            </div>
            {!editing && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {contact.contact_type}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {contact.status}
                  </Badge>
                  {source && (
                    <Badge variant="outline" className="text-xs">
                      Source: {source}
                    </Badge>
                  )}
                </div>
                <ContactTagManager
                  contactId={id!}
                  tags={tags}
                  onTagsChange={fetchContact}
                />
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company */}
            {company && !editing && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Company
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p
                    className="font-medium text-primary hover:underline cursor-pointer"
                    onClick={() => company.id && navigate(`/sites/${company.id}`)}
                  >
                    {company.name}
                  </p>
                  {company.domain && (
                    <p className="text-sm text-muted-foreground">{company.domain}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div>
                      <p className="text-sm font-medium mb-2">Emails</p>
                      <EditableMultiValueField
                        items={editEmails}
                        onChange={setEditEmails}
                        categories={["work", "personal", "other"]}
                        placeholder="Email address"
                      />
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Phones</p>
                      <EditableMultiValueField
                        items={editPhones}
                        onChange={setEditPhones}
                        categories={["work", "mobile", "home", "other"]}
                        placeholder="Phone number"
                        showExtension
                      />
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">URLs</p>
                      <EditableMultiValueField
                        items={editUrls}
                        onChange={setEditUrls}
                        categories={["business", "linkedin", "personal", "other"]}
                        placeholder="URL"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {emails.length > 0 ? (
                      emails.map((email: any) => (
                        <div key={email.id} className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">{email.value}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {email.category}
                              {email.is_primary ? " • Primary" : ""}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No email addresses</p>
                    )}

                    {phones.length > 0 && (
                      <>
                        <Separator />
                        {phones.map((phone: any) => (
                          <div key={phone.id} className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm">
                                {phone.value}
                                {phone.extension ? ` x${phone.extension}` : ""}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {phone.category}
                                {phone.is_primary ? " • Primary" : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {urls.length > 0 && (
                      <>
                        <Separator />
                        {urls.map((url: any) => (
                          <div key={url.id} className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <a
                                href={url.value.startsWith("http") ? url.value : `https://${url.value}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                {url.value}
                              </a>
                              <p className="text-xs text-muted-foreground capitalize">
                                {url.category}
                                {url.is_primary ? " • Primary" : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Addresses */}
            {(editing || addresses.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Addresses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <EditableAddresses addresses={editAddresses} onChange={setEditAddresses} />
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((addr: any) => (
                        <div key={addr.id} className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm">{formatAddress(addr)}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {addr.category}
                              {addr.is_primary ? " • Primary" : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Career History (view only for now) */}
            {careerHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Career History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {careerHistory.map((entry: any) => (
                    <CareerHistoryEntry key={entry.id} entry={entry} />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {(editing || contact.description) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <RichTextEditor
                      content={editData.description}
                      onChange={(html) => updateField("description", html)}
                      placeholder="Description / notes about this contact..."
                    />
                  ) : (
                    <RichTextDisplay content={contact.description} />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Salary info (editing only or if has data) */}
            {editing && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Compensation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Current Salary</label>
                      <Input
                        value={editData.salary}
                        onChange={(e) => updateField("salary", e.target.value)}
                        placeholder="$"
                        type="number"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Desired Min</label>
                      <Input
                        value={editData.desired_salary_min}
                        onChange={(e) => updateField("desired_salary_min", e.target.value)}
                        placeholder="$"
                        type="number"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Desired Max</label>
                      <Input
                        value={editData.desired_salary_max}
                        onChange={(e) => updateField("desired_salary_max", e.target.value)}
                        placeholder="$"
                        type="number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Salary Details</label>
                    <Input
                      value={editData.salary_details}
                      onChange={(e) => updateField("salary_details", e.target.value)}
                      placeholder="Compensation notes..."
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <ContactResumes contactId={contact.id} />
            <ContactNotes contactId={contact.id} />
            <ContactDocuments contactId={contact.id} />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Record Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contact.created_at && (
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">{formatDate(contact.created_at)}</p>
                  </div>
                )}
                {contact.updated_at && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">{formatDate(contact.updated_at)}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
