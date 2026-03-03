import { useState, useEffect } from "react";
import { useEmailSends } from "@/hooks/useEmailTemplates";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Mail, Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailComposeDialog } from "./email/EmailComposeDialog";

interface ConstituentEmailActivityProps {
  constituentId: string;
  constituentEmail?: string;
  constituentName?: string;
}

interface M365EmailLog {
  id: string;
  subject: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  category: string | null;
}

export function ConstituentEmailActivity({ constituentId, constituentEmail, constituentName }: ConstituentEmailActivityProps) {
  const { data: campaignEmails, isLoading: campaignLoading } = useEmailSends(undefined, constituentId);
  const [m365Emails, setM365Emails] = useState<M365EmailLog[]>([]);
  const [m365Loading, setM365Loading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    loadM365Emails();
  }, [constituentId]);

  async function loadM365Emails() {
    try {
      const { data, error } = await supabase
        .from("email_log")
        .select("id, subject, status, sent_at, created_at, category")
        .eq("constituent_id", constituentId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setM365Emails(data || []);
    } catch (error) {
      console.error("Error loading M365 emails:", error);
    } finally {
      setM365Loading(false);
    }
  }

  const isLoading = campaignLoading || m365Loading;

  // Combine and sort emails from both sources
  const allEmails = [
    ...(campaignEmails || []).map(e => ({
      id: e.id,
      subject: e.subject,
      status: e.status || "sent",
      sent_at: e.sent_at || e.created_at,
      source: "campaign" as const,
    })),
    ...m365Emails.map(e => ({
      id: e.id,
      subject: e.subject,
      status: e.status,
      sent_at: e.sent_at || e.created_at,
      source: "m365" as const,
    })),
  ].sort((a, b) => new Date(b.sent_at || 0).getTime() - new Date(a.sent_at || 0).getTime());

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="h-2 w-2 rounded-full bg-muted mt-2" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-sm text-muted-foreground">Email Activity</h4>
        <Button size="sm" variant="outline" onClick={() => setComposeOpen(true)} disabled={!constituentEmail}>
          <Send className="h-3 w-3 mr-1" />
          Send Email
        </Button>
      </div>

      {allEmails.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No email activity yet</p>
          <p className="text-xs mt-1">Emails sent to this constituent will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allEmails.slice(0, 15).map((email) => (
            <div key={email.id} className="flex items-start gap-3 text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div
                className={cn(
                  "mt-1.5 h-2 w-2 rounded-full shrink-0",
                  email.status === "clicked" ? "bg-green-500" :
                  email.status === "opened" ? "bg-blue-500" :
                  email.status === "delivered" ? "bg-emerald-400" :
                  email.status === "sent" ? "bg-yellow-500" :
                  email.status === "failed" ? "bg-red-500" :
                  email.status === "bounced" ? "bg-red-500" :
                  email.status === "queued" ? "bg-gray-400" :
                  "bg-muted-foreground"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{email.subject}</p>
                <p className="text-muted-foreground text-xs flex items-center gap-2">
                  <span className="capitalize">{email.status}</span>
                  {email.sent_at && (
                    <span>• {formatDistanceToNow(new Date(email.sent_at), { addSuffix: true })}</span>
                  )}
                  {email.source === "m365" && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">M365</span>
                  )}
                  {email.source === "campaign" && (
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">Campaign</span>
                  )}
                </p>
              </div>
            </div>
          ))}
          {allEmails.length > 15 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              Showing 15 of {allEmails.length} emails
            </p>
          )}
        </div>
      )}

      <EmailComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        constituentId={constituentId}
        constituentEmail={constituentEmail}
        constituentName={constituentName}
        onSuccess={loadM365Emails}
      />
    </div>
  );
}
