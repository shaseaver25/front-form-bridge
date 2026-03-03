import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  HelpCircle,
  X,
  Send,
  Loader2,
  Bug,
  MessageCircle,
  Ticket,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

type Mode = "how_to" | "report_issue";
type Tab = Mode | "tickets";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SupportTicket {
  id: string;
  page_url: string | null;
  description: string | null;
  ai_response: string | null;
  ai_resolved: boolean;
  severity: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

// ── Ticket List (super admin view) ──────────────────────────────────────────

function TicketList() {
  const qc = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["support-tickets-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select(
          "id, page_url, description, ai_response, ai_resolved, severity, status, admin_notes, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as SupportTicket[];
    },
  });

  const updateTicket = async (
    id: string,
    patch: Partial<Pick<SupportTicket, "status" | "admin_notes">>
  ) => {
    await supabase.from("support_tickets").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["support-tickets-list"] });
    qc.invalidateQueries({ queryKey: ["unresolved-ticket-count"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-1">
        <Ticket className="h-6 w-6" />
        <p>No tickets yet</p>
      </div>
    );
  }

  const SEVERITY_COLORS: Record<string, string> = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto">
      {tickets.map((t) => (
        <div
          key={t.id}
          className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-xs"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-foreground line-clamp-2">
              {t.description ?? "No description"}
            </p>
            <Badge
              className={`shrink-0 text-[10px] px-1.5 ${SEVERITY_COLORS[t.severity] ?? SEVERITY_COLORS.low}`}
            >
              {t.severity}
            </Badge>
          </div>

          <p className="text-muted-foreground truncate">{t.page_url ?? "—"}</p>

          {t.ai_response && (
            <p className="text-muted-foreground line-clamp-2 italic">AI: {t.ai_response}</p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Select value={t.status} onValueChange={(v) => updateTicket(t.id, { status: v })}>
              <SelectTrigger className="h-7 text-xs w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-muted-foreground">
              {new Date(t.created_at).toLocaleDateString()}
            </span>
          </div>

          <Textarea
            className="text-xs min-h-[48px] resize-none"
            placeholder="Admin notes…"
            defaultValue={t.admin_notes ?? ""}
            onBlur={(e) => {
              if (e.target.value !== (t.admin_notes ?? "")) {
                updateTicket(t.id, { admin_notes: e.target.value });
              }
            }}
          />
        </div>
      ))}
    </div>
  );
}

// ── Chat interface ───────────────────────────────────────────────────────────

interface ChatProps {
  mode: Mode;
  messages: Message[];
  input: string;
  isSending: boolean;
  onInputChange: (v: string) => void;
  onSend: () => void;
}

function Chat({ mode, messages, input, isSending, onInputChange, onSend }: ChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const placeholder =
    mode === "how_to" ? "Ask how to do something…" : "Describe what's not working…";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            {mode === "how_to"
              ? "Ask anything about using the CRM."
              : "Describe your issue and we'll help diagnose it."}
          </p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`rounded-xl px-3 py-2 text-xs max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-xl px-3 py-2 bg-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="text-xs min-h-[60px] max-h-[120px] resize-none flex-1"
          disabled={isSending}
        />
        <Button
          size="icon"
          className="shrink-0 h-9 w-9"
          onClick={onSend}
          disabled={isSending || !input.trim()}
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// ── Main HelpBubble ──────────────────────────────────────────────────────────

export function HelpBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("how_to");
  const [howToMessages, setHowToMessages] = useState<Message[]>([]);
  const [reportMessages, setReportMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const location = useLocation();
  const { isSuperAdmin } = useSuperAdmin();
  const { tier } = useSubscription();

  // Current user's role (for system prompt context)
  const { data: userRole = "viewer" } = useQuery({
    queryKey: ["current-user-role"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").maybeSingle();
      return data?.role ?? "viewer";
    },
    staleTime: 10 * 60 * 1000,
  });

  // Unresolved ticket count for super admin badge
  const { data: unresolvedCount = 0 } = useQuery<number>({
    queryKey: ["unresolved-ticket-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "open")
        .eq("ai_resolved", false);
      return count ?? 0;
    },
    enabled: isSuperAdmin,
    refetchInterval: 30_000,
  });

  const messages = activeTab === "how_to" ? howToMessages : reportMessages;
  const setMessages = activeTab === "how_to" ? setHowToMessages : setReportMessages;

  const handleSend = async () => {
    if (!input.trim() || isSending || activeTab === "tickets") return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("help-assistant", {
        body: {
          mode: activeTab,
          message: userMessage,
          context: {
            page: location.pathname,
            tier,
            role: userRole,
            browserInfo: {
              userAgent: navigator.userAgent,
              url: window.location.href,
              viewport: { width: window.innerWidth, height: window.innerHeight },
            },
          },
        },
      });

      if (error) throw error;

      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);

      if (activeTab === "report_issue" && data.ticketId) {
        toast.success(
          data.aiResolved
            ? "Issue logged — AI provided a fix above."
            : "Issue logged — our team will follow up."
        );
      }
    } catch (err) {
      console.error("Help assistant error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process that right now. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "how_to", label: "How do I…", icon: MessageCircle },
    { id: "report_issue", label: "Report issue", icon: Bug },
    ...(isSuperAdmin ? [{ id: "tickets" as Tab, label: "Tickets", icon: Ticket }] : []),
  ];

  return (
    <>
      {/* Floating button — stacked above VoiceFAB (bottom-6) */}
      <div className="fixed bottom-24 right-6 z-50">
        <Button
          size="icon"
          onClick={() => setIsOpen((v) => !v)}
          className="w-12 h-12 rounded-full shadow-lg bg-card border border-border hover:bg-muted text-foreground relative"
        >
          {isOpen ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}

          {/* Unresolved ticket badge */}
          {isSuperAdmin && unresolvedCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unresolvedCount > 9 ? "9+" : unresolvedCount}
            </span>
          )}
        </Button>
      </div>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-40 right-6 z-50 w-96 max-h-[560px] rounded-xl shadow-2xl border border-border bg-card flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <span className="text-sm font-semibold text-foreground">Help & Support</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex border-b border-border shrink-0">
            {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 flex-1 justify-center py-2 text-xs font-medium transition-colors ${
                  activeTab === id
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {id === "tickets" && unresolvedCount > 0 && (
                  <span className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                    {unresolvedCount > 9 ? "9+" : unresolvedCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {activeTab === "tickets" ? (
              <div className="flex-1 overflow-y-auto">
                <TicketList />
              </div>
            ) : (
              <Chat
                mode={activeTab as Mode}
                messages={messages}
                input={input}
                isSending={isSending}
                onInputChange={setInput}
                onSend={handleSend}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
