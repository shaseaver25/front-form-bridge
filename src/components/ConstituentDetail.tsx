import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
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

interface ConstituentDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  constituent: any;
}

const ConstituentDetail = ({ open, onOpenChange, constituent }: ConstituentDetailProps) => {
  const [emails, setEmails] = useState<any[]>([]);
  const [phones, setPhones] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [urls, setUrls] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [careerHistory, setCareerHistory] = useState<any[]>([]);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    if (open && constituent?.id) {
      supabase
        .from("crm_contact_emails")
        .select("*")
        .eq("contact_id", constituent.id)
        .then(({ data }) => setEmails(data || []));

      supabase
        .from("crm_contact_phones")
        .select("*")
        .eq("contact_id", constituent.id)
        .then(({ data }) => setPhones(data || []));

      supabase
        .from("crm_contact_urls")
        .select("*")
        .eq("contact_id", constituent.id)
        .then(({ data }) => setUrls(data || []));

      supabase
        .from("crm_contact_tags")
        .select("tag_id, crm_tags(id, name, category)")
        .eq("contact_id", constituent.id)
        .then(({ data }) => {
          const mapped = (data || []).map((row: any) => row.crm_tags).filter(Boolean);
          setTags(mapped);
        });

      supabase
        .from("crm_addresses")
        .select("*")
        .eq("contact_id", constituent.id)
        .then(({ data }) => setAddresses(data || []));

      supabase
        .from("crm_career_history")
        .select("*")
        .eq("contact_id", constituent.id)
        .order("is_current", { ascending: false })
        .order("started_at", { ascending: false })
        .then(({ data }) => setCareerHistory(data || []));

      if (constituent.primary_company_id) {
        supabase
          .from("crm_companies")
          .select("name, domain")
          .eq("id", constituent.primary_company_id)
          .single()
          .then(({ data }) => setCompany(data));
      } else {
        setCompany(null);
      }

      if (constituent.source_id) {
        supabase
          .from("crm_contact_sources")
          .select("name")
          .eq("id", constituent.source_id)
          .single()
          .then(({ data }) => setSource(data?.name || null));
      } else {
        setSource(null);
      }
    }
  }, [open, constituent]);

  if (!constituent) return null;

  const displayName = [constituent.first_name, constituent.last_name].filter(Boolean).join(" ") || "Unknown";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAddress = (addr: any) => {
    const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.zip_code, addr.country].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Contact Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{displayName}</CardTitle>
                  {constituent.job_title && (
                    <p className="text-sm text-muted-foreground">{constituent.job_title}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="secondary" className="capitalize">
                      {constituent.contact_type}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {constituent.status}
                    </Badge>
                    {source && (
                      <Badge variant="outline" className="text-xs">
                        Source: {source}
                      </Badge>
                    )}
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
              </div>
            </CardHeader>
          </Card>

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
                <p className="font-medium">{company.name}</p>
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
              {emails.length > 0 ? (
                emails.map((email) => (
                  <div key={email.id} className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{email.value}</p>
                      <p className="text-xs text-muted-foreground capitalize">{email.category}{email.is_primary ? " • Primary" : ""}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No email addresses</p>
              )}

              {phones.length > 0 && (
                <>
                  <Separator />
                  {phones.map((phone) => (
                    <div key={phone.id} className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm">{phone.value}{phone.extension ? ` x${phone.extension}` : ""}</p>
                        <p className="text-xs text-muted-foreground capitalize">{phone.category}{phone.is_primary ? " • Primary" : ""}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {urls.length > 0 && (
                <>
                  <Separator />
                  {urls.map((url) => (
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
                        <p className="text-xs text-muted-foreground capitalize">{url.category}{url.is_primary ? " • Primary" : ""}</p>
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
                {addresses.map((addr) => (
                  <div key={addr.id} className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm">{formatAddress(addr)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{addr.category}{addr.is_primary ? " • Primary" : ""}</p>
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
                {careerHistory.map((entry) => (
                  <div key={entry.id} className="border-l-2 border-border pl-4 space-y-1">
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
                        <Badge variant="secondary" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {entry.company_name || entry.institution || ""}
                    </p>
                    {(entry.started_at || entry.ended_at) && (
                      <p className="text-xs text-muted-foreground">
                        {entry.started_at ? new Date(entry.started_at).toLocaleDateString() : "?"} — {entry.is_current ? "Present" : entry.ended_at ? new Date(entry.ended_at).toLocaleDateString() : "?"}
                      </p>
                    )}
                    {entry.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3">{entry.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {constituent.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{constituent.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Record Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Record Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {constituent.created_at && (
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">{formatDate(constituent.created_at)}</p>
                </div>
              )}
              {constituent.updated_at && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">{formatDate(constituent.updated_at)}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConstituentDetail;
