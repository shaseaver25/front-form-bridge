import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Minimize2, Maximize2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendDonorAgentMessage, type AgentMessage } from "@/services/donorAgentService";
import { cn } from "@/lib/utils";

const STARTER_PROMPTS = [
  "Who are our top 10 donors for the capital campaign?",
  "Which donors haven't given in over a year?",
  "Find donors near Chicago for an upcoming event",
  "Who should we invite to our next gala?",
];

export function AgentChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [rawHistory, setRawHistory] = useState<Array<{ role: string; content: unknown }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      textareaRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isLoading) return;

    const userMessage: AgentMessage = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const result = await sendDonorAgentMessage(messageText, rawHistory);

      const assistantMessage: AgentMessage = {
        role: "assistant",
        content: result.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setRawHistory(result.conversation_history);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setRawHistory([]);
    setError(null);
    setInput("");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-20 h-20 rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-105 bg-transparent border-0 p-0"
        aria-label="Open donor agent"
      >
        <video
          src="/agent-character.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col bg-background border rounded-xl shadow-2xl transition-all duration-200",
        isMinimized ? "w-72 h-14" : "w-[420px] h-[580px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 bg-primary rounded-full">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Donor Agent</p>
            {!isMinimized && (
              <p className="text-xs text-muted-foreground mt-0.5">Powered by Claude</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isMinimized && messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={handleReset}
            >
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <Minimize2 className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea
            className="flex-1 px-4 py-3"
            ref={scrollRef as React.RefObject<HTMLDivElement>}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col gap-3 pt-2">
                <p className="text-sm text-muted-foreground text-center">
                  Ask me anything about your donors, events, or giving data.
                </p>
                <div className="flex flex-col gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="text-left text-xs px-3 py-2 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full shrink-0 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      <p
                        className={cn(
                          "text-[10px] mt-1",
                          msg.role === "user"
                            ? "text-primary-foreground/60"
                            : "text-muted-foreground"
                        )}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary rounded-full shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Looking up your data...
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about donors, events, giving..."
                className="min-h-[40px] max-h-[120px] resize-none text-sm py-2"
                rows={1}
                disabled={isLoading}
              />
              <Button
                size="icon"
                className="shrink-0 h-10 w-10"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
}
