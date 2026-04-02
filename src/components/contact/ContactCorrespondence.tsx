import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, ChevronDown, ChevronRight, Inbox, Send, Loader2, Bookmark, BookmarkCheck } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ContactCorrespondenceProps {
  contactId: string;
  contactEmails: string[];
}

interface CorrespondenceItem {
  id: string;
  rawId: string; // original DB id without prefix
  subject: string;
  snippet: string;
  from: string;
  to: string;
  date: string;
  source: "gmail" | "outbound" | "saved";
  direction: "inbound" | "outbound";
  status?: string;
  isRead?: boolean;
  isSaved?: boolean;
}

export default function ContactCorrespondence({ contactId, contactEmails }: ContactCorrespondenceProps) {
  const [items, setItems] = useState<CorrespondenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { toast } = useToast();

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

      // Fetch Gmail messages (rolling 7-day buffer)
      const { data: gmailData } = await supabase
        .from("gmail_messages")
        .select("id, subject, snippet, from_email, from_name, to_emails, internal_date, is_read, matched_contact_id, is_saved")
        .or(`matched_contact_id.eq.${contactId},from_email.in.(${lowerEmails.join(",")})`)
        .order("internal_date", { ascending: false })
        .limit(50);

      // Fetch saved emails from crm_activities
      const { data: savedData } = await supabase
        .from("crm_activities")
        .select("id, subject, body, direction, created_at, activity_type")
        .eq("contact_id", contactId)
        .eq("activity_type", "email")
        .order("created_at", { ascending: false })
        .limit(50);

      // Fetch outbound email_log entries
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
          rawId: msg.id,
          subject: msg.subject || "(No subject)",
          snippet: msg.snippet || "",
          from: msg.from_name ? `${msg.from_name} <${msg.from_email}>` : msg.from_email || "Unknown",
          to: toList,
          date: msg.internal_date || "",
          source: "gmail" as const,
          direction: isFromContact ? "inbound" as const : "outbound" as const,
          isRead: msg.is_read ?? true,
          isSaved: (msg as any).is_saved ?? false,
        };
      });

      const savedItems: CorrespondenceItem[] = (savedData || []).map(act => ({
        id: `saved-${act.id}`,
        rawId: act.id,
        subject: act.subject || "(No subject)",
        snippet: act.body || "",
        from: act.direction === "inbound" ? contactEmails[0] || "Contact" : "You",
        to: act.direction === "inbound" ? "You" : contactEmails[0] || "",
        date: act.created_at || "",
        source: "saved" as const,
        direction: (act.direction as "inbound" | "outbound") || "outbound",
        isSaved: true,
      }));

      const outboundItems: CorrespondenceItem[] = (emailLogData || []).map(log => ({
        id: `log-${log.id}`,
        rawId: log.id,
        subject: log.subject || "(No subject)",
        snippet: "",
        from: "You",
        to: contactEmails[0] || "",
        date: log.sent_at || log.created_at,
        source: "outbound" as const,
        direction: "outbound" as const,
        status: log.status,
      }));

      // Deduplicate: if a gmail message is saved, don't show the saved activity duplicate
      const savedSubjects = new Set(savedItems.map(s => s.subject.toLowerCase()));
      const deduplicatedGmail = gmailItems.map(g => {
        if (savedSubjects.has(g.subject.toLowerCase()) || g.isSaved) {
          return { ...g, isSaved: true };
        }
        return g;
      });

      // Filter out saved activity items that have a matching gmail item still in buffer
      const gmailSubjects = new Set(deduplicatedGmail.map(g => g.subject.toLowerCase()));
      const uniqueSaved = savedItems.filter(s => !gmailSubjects.has(s.subject.toLowerCase()));

      const merged = [...deduplicatedGmail, ...uniqueSaved, ...outboundItems].sort(
        (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      );

      setItems(merged);
    } catch (err) {
      console.error("Error loading correspondence:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveToContact(item: CorrespondenceItem) {
    setSavingId(item.id);
    try {
      // Save to crm_activities
      const { error: actError } = await supabase.from("crm_activities").insert({
        contact_id: contactId,
        activity_type: "email",
        subject: item.subject,
        body: item.snippet,
        direction: item.direction,
        created_at: item.date || new Date().toISOString(),
      });

      if (actError) throw actError;

      // Mark gmail_messages as saved
      if (item.source === "gmail") {
        await supabase
          .from("gmail_messages")
          .update({ is_saved: true })
          .eq("id", item.rawId);
      }

      // Update local state
      setItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, isSaved: true } : i
      ));

      toast({ title: "Email saved", description: "Saved to contact's permanent record" });
    } catch (err) {
      console.error("Error saving email:", err);
      toast({ title: "Error", description: "Failed to save email", variant: "destructive" });
    } finally {
      setSavingId(null);
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
                        {item.source === "saved" && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-amber-300 text-amber-700">Saved</Badge>
                        )}
                        {item.isSaved && item.source === "gmail" && (
                          <BookmarkCheck className="h-3 w-3 text-amber-500" />
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
                      {/* Save to Contact button for unsaved gmail messages */}
                      {item.source === "gmail" && !item.isSaved && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={savingId === item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveToContact(item);
                          }}
                        >
                          {savingId === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Bookmark className="h-3 w-3" />
                          )}
                          Save to Contact
                        </Button>
                      )}
                      {item.isSaved && (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <BookmarkCheck className="h-3 w-3" />
                          Saved to permanent record
                        </p>
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
