import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Send,
  Loader2,
  Ticket,
  ChevronDown,
  Bot,
  Mic,
  ArrowLeft,
  Home,
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
import { ChipVoiceNote } from "./ChipVoiceNote";

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

/* ── Ticket List (super admin only) ──────────────────────────────────── */

function TicketList({ onBack }: { onBack: () => void }) {
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

  const SEVERITY_COLORS: Record<string, string> = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium text-foreground">Support Tickets</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-1">
            <Ticket className="h-6 w-6" />
            <p>No tickets yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-3">
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
        )}
      </div>
    </div>
  );
}

/* ── Main ChipAssistant ──────────────────────────────────────────────── */

type View = "chat" | "voice_note" | "tickets";

export function ChipAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<View>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const location = useLocation();
  const { isSuperAdmin } = useSuperAdmin();
  const { tier } = useSubscription();

  const { data: userRole = "viewer" } = useQuery({
    queryKey: ["current-user-role"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").maybeSingle();
      return data?.role ?? "viewer";
    },
    staleTime: 10 * 60 * 1000,
  });

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speech-to-text for chat input
  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        setInput((prev) => (prev ? prev + " " + transcript : transcript).trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        toast.error("Could not understand. Try again.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  // Detect voice note intent from user message
  const isVoiceNoteIntent = (text: string) => {
    const lower = text.toLowerCase();
    return (
      lower.includes("voice note") ||
      lower.includes("record a note") ||
      lower.includes("meeting note") ||
      lower.includes("log a meeting") ||
      lower.includes("record a meeting")
    );
  };

  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    // Stop listening if active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMessage = input.trim();
    setInput("");

    // Check if user wants voice note mode
    if (isVoiceNoteIntent(userMessage)) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMessage },
        {
          role: "assistant",
          content:
            "Let's record a voice note! I'll switch to voice mode now so I can walk you through it.",
        },
      ]);
      setTimeout(() => setView("voice_note"), 800);
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("help-assistant", {
        body: {
          mode: "chat",
          message: userMessage,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
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

      // If AI created a support ticket
      if (data.ticketId) {
        toast.success(
          data.aiResolved
            ? "Issue logged — Chip provided a fix above."
            : "Issue logged — our team will follow up."
        );
      }
    } catch (err) {
      console.error("Chip assistant error:", err);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chip button */}
      <div className="fixed bottom-24 right-6 z-50">
       <button
          onClick={() => setIsOpen((v) => !v)}
          className="w-14 h-14 rounded-full shadow-lg overflow-hidden relative border-2 border-primary hover:scale-105 transition-transform"
        >
          {isOpen ? (
            <div className="w-full h-full bg-primary flex items-center justify-center">
              <X className="h-5 w-5 text-primary-foreground" />
            </div>
          ) : (
            <video
              src="/images/chip-avatar.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          )}

          {isSuperAdmin && unresolvedCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unresolvedCount > 9 ? "9+" : unresolvedCount}
            </span>
          )}
        </button>
      </div>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-40 right-6 z-50 w-96 max-h-[560px] rounded-xl shadow-2xl border border-border bg-card flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-primary">
                <video
                  src="/images/chip-avatar.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-sm font-semibold text-foreground">Chip</span>
                <span className="text-[10px] text-muted-foreground ml-1.5">AI Assistant</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Home / new chat button - only show when there are messages */}
              {messages.length > 0 && view === "chat" && (
                <button
                  onClick={() => { setMessages([]); setInput(""); }}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="New chat"
                >
                  <Home className="h-4 w-4" />
                </button>
              )}
              {/* Super admin ticket button */}
              {isSuperAdmin && (
                <button
                  onClick={() => setView(view === "tickets" ? "chat" : "tickets")}
                  className="relative text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="Support Tickets"
                >
                  <Ticket className="h-4 w-4" />
                  {unresolvedCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground">
                      {unresolvedCount > 9 ? "9+" : unresolvedCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {view === "tickets" ? (
              <TicketList onBack={() => setView("chat")} />
            ) : view === "voice_note" ? (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="px-3 py-2 border-b border-border flex items-center gap-2">
                  <button
                    onClick={() => setView("chat")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-medium text-foreground">Voice Note</span>
                </div>
                <ChipVoiceNote />
              </div>
            ) : (
              /* Chat view */
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center gap-3 mt-4 text-center px-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          Hi, I'm Chip! I'm here to chip in! 🎉
                        </p>
                        <p className="text-xs text-muted-foreground">
                          How can I help you?
                        </p>
                      </div>

                      {/* Quick action pills */}
                      <div className="flex flex-wrap gap-1.5 justify-center mt-2">
                        {[
                          { label: "🎤 Voice Note", action: () => setView("voice_note") },
                          { label: "👥 Donors", action: () => setInput("Tell me about my top donors") },
                          { label: "📅 Events", action: () => setInput("What upcoming events do I have?") },
                          { label: "📊 Data", action: () => setInput("Give me an overview of my CRM data") },
                          { label: "❓ Help", action: () => setInput("How do I use this CRM?") },
                          { label: "🐛 Report Issue", action: () => setInput("I need to report an issue") },
                        ].map((pill) => (
                          <button
                            key={pill.label}
                            onClick={pill.action}
                            className="text-[11px] px-2.5 py-1.5 rounded-full border border-border bg-card hover:bg-muted/50 text-foreground transition-colors"
                          >
                            {pill.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
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

                {/* Input bar */}
                <div className="border-t border-border p-3 flex gap-2 items-end">
                  {/* Speech-to-text mic */}
                  <Button
                    size="icon"
                    variant={isListening ? "default" : "ghost"}
                    className={`shrink-0 h-9 w-9 ${isListening ? "bg-destructive hover:bg-destructive/90 animate-pulse" : "text-muted-foreground hover:text-primary"}`}
                    onClick={toggleListening}
                    title={isListening ? "Stop listening" : "Speak to type"}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Chip anything…"
                    className="text-xs min-h-[40px] max-h-[120px] resize-none flex-1"
                    disabled={isSending}
                  />
                  <Button
                    size="icon"
                    className="shrink-0 h-9 w-9"
                    onClick={handleSend}
                    disabled={isSending || !input.trim()}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
