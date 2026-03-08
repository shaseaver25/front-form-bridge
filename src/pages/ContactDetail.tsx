import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ContactNotes from "@/components/ContactNotes";
import ContactDocuments from "@/components/ContactDocuments";

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  useEffect(() => {
    if (!id) return;

    const fetchContact = async () => {
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

      // Fetch related data in parallel
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

      // Get company
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
            }
          });
      }

      // Get source
      if (data.source_id) {
        supabase
          .from("crm_contact_sources")
          .select("name")
          .eq("id", data.source_id)
          .single()
          .then(({ data: s }) => setSource(s?.name || null));
      }

      setLoading(false);
    };

    fetchContact();
  }, [id]);

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
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate("/constituents")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contacts
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
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
            </div>
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
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag: any) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company */}
            {company && (
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
                    <p className="text-sm text-muted-foreground">
                      {company.domain}
                    </p>
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
                  <p className="text-sm text-muted-foreground">
                    No email addresses
                  </p>
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
                            href={
                              url.value.startsWith("http")
                                ? url.value
                                : `https://${url.value}`
                            }
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
              </CardContent>
            </Card>

            {/* Addresses */}
            {addresses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Addresses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                </CardContent>
              </Card>
            )}

            {/* Career History */}
            {careerHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Career History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {careerHistory.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="border-l-2 border-border pl-4 space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        {entry.entry_type === "education" ? (
                          <GraduationCap className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                        )}
                        <p className="text-sm font-medium">
                          {entry.job_title || entry.degree || "Position"}
                        </p>
                        {entry.is_current && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {entry.company_name || entry.institution || ""}
                      </p>
                      {(entry.started_at || entry.ended_at) && (
                        <p className="text-xs text-muted-foreground">
                          {entry.started_at
                            ? new Date(entry.started_at).toLocaleDateString()
                            : "?"}{" "}
                          —{" "}
                          {entry.is_current
                            ? "Present"
                            : entry.ended_at
                              ? new Date(entry.ended_at).toLocaleDateString()
                              : "?"}
                        </p>
                      )}
                      {entry.description && (
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {entry.description}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {contact.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {contact.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column — notes, documents, record info */}
          <div className="space-y-6">
            <ContactNotes contactId={contact.id} />
            <ContactDocuments contactId={contact.id} />

            {/* Record Information */}
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
                    <p className="text-sm text-muted-foreground">
                      {formatDate(contact.created_at)}
                    </p>
                  </div>
                )}
                {contact.updated_at && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(contact.updated_at)}
                      </p>
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
