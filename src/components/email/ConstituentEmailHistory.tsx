import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Send, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { EmailComposeDialog } from "./EmailComposeDialog";

interface EmailHistoryProps {
  constituentId: string;
  constituentEmail?: string;
  constituentName?: string;
}

interface EmailLogEntry {
  id: string;
  subject: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  category: string | null;
}

export function ConstituentEmailHistory({ constituentId, constituentEmail, constituentName }: EmailHistoryProps) {
  const [emails, setEmails] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    loadEmails();
  }, [constituentId]);

  async function loadEmails() {
    try {
      const { data, error } = await supabase
        .from("email_log")
        .select("id, subject, status, sent_at, created_at, category")
        .eq("constituent_id", constituentId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error("Error loading email history:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "sent":
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Sent</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "queued":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Queued</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History
          </CardTitle>
          <Button size="sm" onClick={() => setComposeOpen(true)} disabled={!constituentEmail}>
            <Send className="h-4 w-4 mr-2" />
            Send Email
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : emails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No emails sent yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(email.sent_at || email.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={email.subject}>
                      {email.subject}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{email.category || "—"}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(email.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {emails.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => window.open(`/communications/email-log?constituent=${constituentId}`, "_blank")}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View All Emails
            </Button>
          )}
        </CardContent>
      </Card>

      <EmailComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        constituentId={constituentId}
        constituentEmail={constituentEmail}
        constituentName={constituentName}
        onSuccess={loadEmails}
      />
    </>
  );
}
