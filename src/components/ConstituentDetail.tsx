import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Mail,
  Phone,
  User,
  Building2,
  Briefcase,
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

  useEffect(() => {
    if (open && constituent?.id) {
      // Fetch emails
      supabase
        .from("crm_contact_emails")
        .select("*")
        .eq("contact_id", constituent.id)
        .then(({ data }) => setEmails(data || []));

      // Fetch phones
      supabase
        .from("crm_contact_phones")
        .select("*")
        .eq("contact_id", constituent.id)
        .then(({ data }) => setPhones(data || []));

      // Fetch company if linked
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
                  </div>
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
            </CardContent>
          </Card>

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
