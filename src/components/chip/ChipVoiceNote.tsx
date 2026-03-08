import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, Check, Search, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Step = "idle" | "ask_who" | "listening_who" | "confirm_match" | "ask_notes" | "listening_notes" | "ask_next_steps" | "listening_next_steps" | "processing" | "done";

interface MatchedConstituent {
  id: string;
  full_legal_name: string;
  primary_email: string | null;
}

interface CreatedTask {
  id: string;
  title: string;
  due_date: string | null;
}

/* ── Speech helpers ──────────────────────────────────────────────── */

function useSpeechRecognition() {
  const recognitionRef = useRef<any>(null);
  const shouldRetryRef = useRef(false);
  const onResultRef = useRef<((text: string) => void) | null>(null);
  const onEndRef = useRef<(() => void) | null>(null);
  const accumulatedRef = useRef("");
  const continuousRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createRecognition = useCallback((continuous: boolean) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // We handle continuity ourselves
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;

      if (continuous) {
        // Accumulate text and reset silence timer
        accumulatedRef.current = (accumulatedRef.current + " " + transcript).trim();
        onResultRef.current?.(accumulatedRef.current);

        // Clear existing silence timer
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // Set a 4-second silence timer — if no new speech, finalize
        silenceTimerRef.current = setTimeout(() => {
          if (shouldRetryRef.current) {
            shouldRetryRef.current = false;
            // Just stop — the onend handler will call onEndRef
            recognitionRef.current?.stop();
          }
        }, 4000);
      } else {
        shouldRetryRef.current = false;
        onResultRef.current?.(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        if (shouldRetryRef.current) {
          setTimeout(() => {
            if (shouldRetryRef.current) {
              try { recognitionRef.current?.start(); } catch {}
            }
          }, 300);
        }
        return;
      }
      console.error("Speech recognition error:", event.error);
      toast.error("Could not understand. Try again.");
      shouldRetryRef.current = false;
      onEndRef.current?.();
    };

    recognition.onend = () => {
      if (shouldRetryRef.current) {
        setTimeout(() => {
          if (shouldRetryRef.current) {
            try { recognitionRef.current?.start(); } catch {}
          }
        }, 300);
        return;
      }
      onEndRef.current?.();
    };

    return recognition;
  }, []);

  const startListening = useCallback((
    onResult: (text: string) => void,
    onEnd?: () => void,
    options?: { continuous?: boolean }
  ) => {
    const continuous = options?.continuous ?? false;
    continuousRef.current = continuous;
    accumulatedRef.current = "";
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    const recognition = createRecognition(continuous);
    if (!recognition) return false;

    onResultRef.current = onResult;
    onEndRef.current = onEnd ?? null;
    shouldRetryRef.current = true;
    recognitionRef.current = recognition;
    recognition.start();
    return true;
  }, [createRecognition]);

  const stopListening = useCallback(() => {
    shouldRetryRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
  }, []);

  return { startListening, stopListening };
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://rzhcefyigmkavddjjxvg.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6aGNlZnlpZ21rYXZkZGpqeHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Mzg0NTYsImV4cCI6MjA4ODExNDQ1Nn0.Suwc7GAfTxv7pxVu90JEsRqI7rT5W9784RHZxmdpnFc";

// Persistent AudioContext to bypass autoplay restrictions after first user gesture
let audioContextInstance: AudioContext | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioContextInstance) {
    audioContextInstance = new AudioContext();
  }
  if (audioContextInstance.state === "suspended") {
    audioContextInstance.resume();
  }
  return audioContextInstance;
}

function stopCurrentAudio() {
  // Stop any playing ElevenLabs audio
  try { activeSourceNode?.stop(); } catch {}
  activeSourceNode = null;
  // Stop any browser speech synthesis
  window.speechSynthesis.cancel();
}

async function chipSpeak(text: string): Promise<void> {
  // Always stop any previous audio first
  stopCurrentAudio();

  try {
    const audioCtx = getAudioContext();

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || SUPABASE_ANON_KEY;

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/chip-tts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, voiceId: "PoHUWWWMHFrA8z7Q88pu" }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`TTS failed: ${response.status} - ${errBody}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    return new Promise((resolve) => {
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0.45;
      source.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      activeSourceNode = source;
      source.onended = () => {
        activeSourceNode = null;
        resolve();
      };
      source.start(0);
    });
  } catch (err) {
    console.warn("⚠️ ElevenLabs TTS failed, falling back to browser voice:", err);
    // Fallback to browser speech synthesis — but cancel any existing first
    window.speechSynthesis.cancel();
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.volume = 0.5;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }
}

/* ── Main component ──────────────────────────────────────────────── */

export function ChipVoiceNote() {
  const [step, setStep] = useState<Step>("idle");
  const [whoText, setWhoText] = useState("");
  const [notesText, _setNotesText] = useState("");
  const [nextStepsText, _setNextStepsText] = useState("");
  const notesTextRef = useRef("");
  const nextStepsTextRef = useRef("");
  const setNotesText = (t: string) => { notesTextRef.current = t; _setNotesText(t); };
  const setNextStepsText = (t: string) => { nextStepsTextRef.current = t; _setNextStepsText(t); };
  const [matches, setMatches] = useState<MatchedConstituent[]>([]);
  const [selectedConstituent, setSelectedConstituent] = useState<MatchedConstituent | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [createdTasks, setCreatedTasks] = useState<CreatedTask[]>([]);
  const [chipMessage, setChipMessage] = useState("Tap the mic to start a voice note.");

  const { startListening, stopListening } = useSpeechRecognition();

  const reset = () => {
    setStep("idle");
    setWhoText("");
    setNotesText("");
    setNextStepsText("");
    setMatches([]);
    setSelectedConstituent(null);
    setCreatedTasks([]);
    setChipMessage("Tap the mic to start a voice note.");
  };

  // Step 1: Ask who they met with
  const startFlow = async () => {
    setStep("ask_who");
    setChipMessage("Who did you meet with today?");
    await chipSpeak("Who did you meet with today?");
    setStep("listening_who");
    startListening(
      (text) => {
        setWhoText(text);
        searchConstituent(text);
      },
      () => {
        // If no speech detected, stay ready for text input
      }
    );
  };

  // Search constituent
  const searchConstituent = async (name: string) => {
    setIsSearching(true);
    setStep("confirm_match");
    try {
      const { data, error } = await supabase
        .from("constituents")
        .select("id, full_legal_name, primary_email")
        .ilike("full_legal_name", `%${name}%`)
        .limit(5);

      if (error) throw error;
      setMatches(data ?? []);

      if (data && data.length === 1) {
        const msg = `I found ${data[0].full_legal_name}. Is that correct?`;
        setChipMessage(msg);
        await chipSpeak(msg);
        // Listen for voice confirmation
        startListening(
          (text) => {
            const lower = text.toLowerCase();
            if (lower.includes("yes") || lower.includes("yeah") || lower.includes("correct") || lower.includes("that's right") || lower.includes("yep")) {
              confirmConstituent(data[0]);
            } else if (lower.includes("no") || lower.includes("nope") || lower.includes("wrong")) {
              setChipMessage("Okay, who did you meet with?");
              setStep("listening_who");
              startListening(
                (retryText) => {
                  setWhoText(retryText);
                  searchConstituent(retryText);
                },
                () => {}
              );
            } else {
              // Treat as a new name search
              setWhoText(text);
              searchConstituent(text);
            }
          },
          () => {}
        );
      } else if (data && data.length > 1) {
        const msg = `I found ${data.length} matches. Which one?`;
        setChipMessage(msg);
        await chipSpeak(msg);
        // Listen for voice selection
        startListening(
          (text) => {
            const lower = text.toLowerCase();
            const match = data.find((m) => m.full_legal_name.toLowerCase().includes(lower));
            if (match) {
              confirmConstituent(match);
            } else {
              // Try number selection: "first", "second", "1", "2"
              const numWords: Record<string, number> = { first: 0, second: 1, third: 2, fourth: 3, fifth: 4, "1": 0, "2": 1, "3": 2, "4": 3, "5": 4 };
              const idx = numWords[lower.trim()];
              if (idx !== undefined && data[idx]) {
                confirmConstituent(data[idx]);
              } else {
                setWhoText(text);
                searchConstituent(text);
              }
            }
          },
          () => {}
        );
      } else {
        const msg = `I couldn't find anyone matching "${name}". Try again or type the name.`;
        setChipMessage(msg);
        await chipSpeak(msg);
        startListening(
          (text) => {
            setWhoText(text);
            searchConstituent(text);
          },
          () => {}
        );
      }
    } catch {
      setChipMessage("Error searching. Please type the name.");
    } finally {
      setIsSearching(false);
    }
  };

  const confirmConstituent = async (constituent: MatchedConstituent) => {
    setSelectedConstituent(constituent);
    setStep("ask_notes");
    const msg = `Great, tell me about your meeting with ${constituent.full_legal_name}.`;
    setChipMessage(msg);
    await chipSpeak(msg);
    setStep("listening_notes");
    startListening(
      (text) => {
        setNotesText(text);
      },
      () => {
        // Silence detected — move to next steps
        askNextSteps();
      },
      { continuous: true }
    );
  };

  // Step 3: Ask next steps
  const askNextSteps = async () => {
    stopListening();
    stopCurrentAudio();
    setStep("ask_next_steps");
    const msg = "What are the next steps? Include a due date and who is responsible for each.";
    setChipMessage(msg);
    await chipSpeak(msg);
    setStep("listening_next_steps");
    startListening(
      (text) => {
        setNextStepsText(text);
      },
      () => {
        // Silence detected — process the voice note
        processVoiceNote();
      },
      { continuous: true }
    );
  };

  // Process everything
  const processVoiceNote = async () => {
    if (!selectedConstituent) return;
    stopListening();
    stopCurrentAudio();
    setStep("processing");
    setChipMessage("Processing your voice note...");

    try {
      console.log("Invoking chip-voice-note with:", {
        constituentId: selectedConstituent.id,
        constituentName: selectedConstituent.full_legal_name,
        meetingNotes: notesTextRef.current?.substring(0, 50),
        nextStepsRaw: nextStepsTextRef.current?.substring(0, 50),
      });

      const { data, error } = await supabase.functions.invoke("chip-voice-note", {
        body: {
          constituentId: selectedConstituent.id,
          constituentName: selectedConstituent.full_legal_name,
          meetingNotes: notesTextRef.current,
          nextStepsRaw: nextStepsTextRef.current,
        },
      });

      console.log("chip-voice-note response:", { data, error });

      if (error) throw error;
      if (!data) throw new Error("No response data");

      setCreatedTasks(data.tasks ?? []);
      setStep("done");

      const taskCount = data.tasks?.length ?? 0;
      const doneMsg = `Done! I saved your meeting notes and created ${taskCount} task${taskCount !== 1 ? "s" : ""} for ${selectedConstituent.full_legal_name}.`;
      setChipMessage(doneMsg);
      await chipSpeak(`Done! I saved your meeting notes and created ${taskCount} task${taskCount !== 1 ? "s" : ""}.`);
    } catch (err) {
      console.error("Voice note processing error:", err);
      setChipMessage("Something went wrong saving the note. Please try again.");
      toast.error("Failed to save voice note");
    }
  };

  const isListening = step === "listening_who" || step === "listening_notes" || step === "listening_next_steps" || step === "confirm_match";

  return (
    <div className="flex flex-col flex-1 min-h-0 p-3 gap-3">
      {/* Chip message */}
      <div className="flex items-start gap-2">
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 mt-0.5 border border-border">
          <video
            src="/images/chip-avatar.mp4"
            muted
            playsInline
            autoPlay
            loop
            className="w-full h-full object-cover"
          />
        </div>
        <div className="rounded-xl px-3 py-2 text-xs bg-muted text-foreground leading-relaxed max-w-[85%]">
          {chipMessage}
        </div>
      </div>

      {/* Content area based on step */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {/* Step: Confirm match */}
        {step === "confirm_match" && (
          <div className="space-y-2">
            {isSearching ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Searching...
              </div>
            ) : matches.length > 0 ? (
              <div className="space-y-1">
                {matches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => confirmConstituent(m)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors text-xs"
                  >
                    <p className="font-medium text-foreground">{m.full_legal_name}</p>
                    {m.primary_email && (
                      <p className="text-muted-foreground">{m.primary_email}</p>
                    )}
                  </button>
                ))}
              </div>
            ) : null}

            {/* Manual search */}
            <div className="flex gap-2">
              <Input
                value={whoText}
                onChange={(e) => setWhoText(e.target.value)}
                placeholder="Type name to search..."
                className="text-xs h-8"
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchConstituent(whoText);
                }}
              />
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 shrink-0"
                onClick={() => searchConstituent(whoText)}
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Listening for notes — show text input fallback */}
        {(step === "listening_notes" || step === "ask_notes") && (
          <div className="space-y-2">
            <Textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Or type your meeting notes here..."
              className="text-xs min-h-[80px] resize-none"
            />
            {notesText && (
              <Button size="sm" className="text-xs" onClick={askNextSteps}>
                Continue →
              </Button>
            )}
          </div>
        )}

        {/* Step: Listening for next steps — show text input fallback */}
        {(step === "listening_next_steps" || step === "ask_next_steps") && (
          <div className="space-y-2">
            {notesText && (
              <div className="text-[10px] text-muted-foreground bg-muted/30 rounded px-2 py-1">
                <span className="font-medium">Notes:</span> {notesText.slice(0, 100)}...
              </div>
            )}
            <Textarea
              value={nextStepsText}
              onChange={(e) => setNextStepsText(e.target.value)}
              placeholder="Or type next steps here..."
              className="text-xs min-h-[80px] resize-none"
            />
            {nextStepsText && (
              <Button size="sm" className="text-xs" onClick={() => processVoiceNote()}>
                Save Note →
              </Button>
            )}
          </div>
        )}

        {/* Processing */}
        {step === "processing" && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="space-y-2">
            {createdTasks.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Tasks Created
                </p>
                {createdTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/30 text-xs"
                  >
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    <span className="flex-1">{t.title}</span>
                    {t.due_date && (
                      <span className="text-muted-foreground text-[10px]">
                        {new Date(t.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <Button size="sm" variant="outline" className="text-xs w-full" onClick={reset}>
              New Voice Note
            </Button>
          </div>
        )}
      </div>

      {/* Mic control */}
      <div className="flex items-center justify-center pt-2 border-t border-border">
        {step === "idle" ? (
          <Button
            onClick={startFlow}
            className="rounded-full w-14 h-14 bg-primary hover:bg-primary/90"
          >
            <Mic className="h-6 w-6" />
          </Button>
        ) : isListening ? (
          <div className="flex flex-col items-center gap-1">
            <Button
              onClick={stopListening}
              className="rounded-full w-14 h-14 bg-destructive hover:bg-destructive/90 animate-pulse"
            >
              <MicOff className="h-6 w-6" />
            </Button>
            <span className="text-[10px] text-muted-foreground">Listening...</span>
          </div>
        ) : step !== "done" && step !== "processing" ? (
          <div className="flex flex-col items-center gap-1">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground">Chip is speaking...</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
