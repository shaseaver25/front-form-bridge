import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, ChevronDown, ChevronRight, Inbox, Send, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ContactCorrespondenceProps {
  contactId: string;
  contactEmails: string[];
}

interface CorrespondenceItem {
  id: string;
  subject: string;
  snippet: string;
  from: string;
  to: string;
  date: string;
  source: "gmail" | "outbound";
  direction: "inbound" | "outbound";
  status?: string;
  isRead?: boolean;
  body?: string;
}

export default function ContactCorrespondence({ contactId, contactEmails }: ContactCorrespondenceProps) {
  const [items, setItems] = useState<CorrespondenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (contactId && contactEmails.length > 0) {
      loadCorrespondence();
    } else {
      setLoading(false);
    }
  }, [contactId, contactEmails]);

  async function loadCorrespondence() {
    setLoading(true);
    try {
      const lowerEmails = contactEmails.map(e => e.toLowerCase());

      // Fetch Gmail messages matched to this contact OR where from/to matches contact emails
      const { data: gmailData } = await supabase
        .from("gmail_messages")
        .select("id, subject, snippet, from_email, from_name, to_emails, internal_date, is_read, matched_contact_id")
        .or(`matched_contact_id.eq.${contactId},from_email.in.(${lowerEmails.join(",")})`  )
        .order("internal_date", { ascending: false })
        .limit(50);

      // Fetch outbound email_log entries for this contact
      const { data: emailLogData } = await supabase
        .from("email_log")
        .select("id, subject, status, sent_at, created_at, category")
        .eq("constituent_id", contactId)
        .order("created_at", { ascending: false })
        .limit(50);

      const gmailItems: CorrespondenceItem[] = (gmailData || []).map(msg => {
        const fromEmail = (msg.from_email || "").toLowerCase();
        const isFromContact = lowerEmails.includes(fromEmail);
        const toList = Array.isArray(msg.to_emails) ? (msg.to_emails as string[]).join(", ") : "";

        return {
          id: `gmail-${msg.id}`,
          subject: msg.subject || "(No subject)",
          snippet: msg.snippet || "",
          from: msg.from_name ? `${msg.from_name} <${msg.from_email}>` : msg.from_email || "Unknown",
          to: toList,
          date: msg.internal_date || "",
          source: "gmail" as const,
          direction: isFromContact ? "inbound" as const : "outbound" as const,
          isRead: msg.is_read ?? true,
        };
      });

      const outboundItems: CorrespondenceItem[] = (emailLogData || []).map(log => ({
        id: `log-${log.id}`,
        subject: log.subject || "(No subject)",
        snippet: "",
        from: "You",
        to: contactEmails[0] || "",
        date: log.sent_at || log.created_at,
        source: "outbound" as const,
        direction: "outbound" as const,
        status: log.status,
      }));

      // Merge and sort by date descending
      const merged = [...gmailItems, ...outboundItems].sort(
        (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      );

      setItems(merged);
    } catch (err) {
      console.error("Error loading correspondence:", err);
    } finally {
      setLoading(false);
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Correspondence
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Correspondence
          {items.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs font-normal">
              {items.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No correspondence found</p>
            <p className="text-xs mt-1">Synced emails and sent messages will appear here</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {items.map(item => {
              const isExpanded = expandedId === item.id;
              return (
                <div key={item.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors",
                      !item.isRead && item.direction === "inbound" && "bg-primary/5"
                    )}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    )}

                    {item.direction === "inbound" ? (
                      <Inbox className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                    ) : (
                      <Send className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm truncate",
                          !item.isRead && item.direction === "inbound" ? "font-semibold" : "font-medium"
                        )}>
                          {item.subject}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {item.direction === "inbound" ? `From: ${item.from}` : `To: ${item.to}`}
                      </p>
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-1">
                      {item.date && (
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        {item.source === "gmail" && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">Gmail</Badge>
                        )}
                        {item.status && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1 py-0 capitalize",
                              item.status === "sent" && "border-emerald-300 text-emerald-700",
                              item.status === "failed" && "border-red-300 text-red-700",
                            )}
                          >
                            {item.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div><span className="font-medium text-foreground">From:</span> {item.from}</div>
                        <div><span className="font-medium text-foreground">To:</span> {item.to}</div>
                        {item.date && (
                          <div className="col-span-2">
                            <span className="font-medium text-foreground">Date:</span>{" "}
                            {format(new Date(item.date), "PPpp")}
                          </div>
                        )}
                      </div>
                      {item.snippet && (
                        <div className="text-sm text-foreground/80 bg-background rounded p-3 border">
                          {item.snippet}
                        </div>
                      )}
                      {!item.snippet && (
                        <p className="text-xs text-muted-foreground italic">No preview available</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
