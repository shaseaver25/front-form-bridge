import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Check, ChevronLeft, Menu, X, LogOut } from "lucide-react";
import { toast } from "sonner";

export interface Chapter {
  id: string;
  label: string;
  title: string;
  locked: boolean;
  status: "not_started" | "in_progress" | "complete";
}

const DEFAULT_CHAPTERS: Chapter[] = [
  { id: "intro", label: "Introduction", title: "Introduction", locked: false, status: "not_started" },
  { id: "ch1", label: "Chapter 1", title: "The Harvesting Framework", locked: false, status: "not_started" },
  { id: "ch2", label: "Chapter 2", title: "The Three Strict Criteria", locked: true, status: "not_started" },
  { id: "ch3", label: "Chapter 3", title: "The Brand Audit", locked: true, status: "not_started" },
  { id: "ch4", label: "Chapter 4", title: "The Nomenclature Gap", locked: true, status: "not_started" },
  { id: "ch5", label: "Chapter 5", title: "The Rewrite", locked: true, status: "not_started" },
  { id: "ch6", label: "Chapter 6", title: "The Action Plan", locked: true, status: "not_started" },
];

interface Props {
  activeChapterId: string;
  onSelectChapter: (id: string) => void;
  children: React.ReactNode;
}

export function RebrandLayout({ activeChapterId, onSelectChapter, children }: Props) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>(DEFAULT_CHAPTERS);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();
      if (profile) {
        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
      }

      // Load progress to determine locked/unlocked status
      const { data: progress } = await supabase
        .from("rebrand_progress")
        .select("chapter_id, status")
        .eq("user_id", user.id);

      if (progress && progress.length > 0) {
        const progressMap = new Map(progress.map((p) => [p.chapter_id, p.status]));
        setChapters((prev) => {
          const updated = prev.map((ch) => ({
            ...ch,
            status: (progressMap.get(ch.id) as Chapter["status"]) || ch.status,
          }));
          // Unlock logic: a chapter is unlocked if the previous one is complete, or it's intro/ch1
          return updated.map((ch, i) => {
            if (i <= 1) return { ...ch, locked: false };
            const prevComplete = updated[i - 1].status === "complete";
            return { ...ch, locked: !prevComplete && !progressMap.has(ch.id) };
          });
        });
      }
    }
    load();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  };

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <h2
            className="text-xl tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: "#FFFFFF", fontWeight: 700 }}
          >
            <span style={{ color: "#C8A96E" }}>/</span>AvidEdge
          </h2>
          <button className="lg:hidden text-white/60 hover:text-white" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <p
          className="text-[10px] uppercase tracking-[0.2em] mt-1"
          style={{ color: "#C8A96E", fontFamily: "'Lato', sans-serif" }}
        >
          Re:Brand Coaching
        </p>
      </div>

      {/* User badge */}
      <div className="px-6 py-3 mx-4 rounded-lg my-3" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ backgroundColor: "#C8A96E", color: "#1B2A4A", fontFamily: "'Lato', sans-serif" }}
          >
            {initials}
          </div>
          <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF", fontFamily: "'Lato', sans-serif" }}>
            {firstName} {lastName}
          </p>
        </div>
      </div>

      {/* Chapter list */}
      <nav className="flex-1 px-4 py-2 space-y-0.5 overflow-y-auto">
        {chapters.map((ch) => {
          const isActive = ch.id === activeChapterId;
          const isComplete = ch.status === "complete";

          return (
            <button
              key={ch.id}
              disabled={ch.locked}
              onClick={() => {
                if (!ch.locked) {
                  onSelectChapter(ch.id);
                  setMobileOpen(false);
                }
              }}
              className={`
                w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                flex items-start gap-2.5
                ${ch.locked ? "cursor-not-allowed" : "cursor-pointer"}
                ${!isActive && !ch.locked ? "hover:bg-white/5" : ""}
              `}
              style={{
                fontFamily: "'Lato', sans-serif",
                color: ch.locked ? "rgba(255,255,255,0.2)" : isActive ? "#FFFFFF" : "rgba(255,255,255,0.55)",
                fontWeight: isActive ? 600 : 400,
                backgroundColor: isActive ? "rgba(200,169,110,0.15)" : undefined,
                borderLeft: isActive ? "3px solid #C8A96E" : "3px solid transparent",
              }}
            >
              {/* Status icon */}
              <span className="mt-0.5 shrink-0">
                {ch.locked ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : isComplete ? (
                  <Check className="h-3.5 w-3.5" style={{ color: "#C8A96E" }} />
                ) : (
                  <span
                    className="block w-3.5 h-3.5 rounded-full border-2"
                    style={{
                      borderColor: isActive ? "#C8A96E" : "rgba(255,255,255,0.25)",
                      backgroundColor: ch.status === "in_progress" ? "rgba(200,169,110,0.3)" : "transparent",
                    }}
                  />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider mb-0.5" style={{ opacity: 0.5 }}>
                  {ch.label}
                </span>
                <span className="block leading-snug">{ch.title}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 pb-4 space-y-1">
        <Link
          to="/client/dashboard"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm w-full transition-all hover:bg-white/5"
          style={{ fontFamily: "'Lato', sans-serif", color: "rgba(255,255,255,0.4)" }}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm w-full transition-all hover:bg-white/5"
          style={{ fontFamily: "'Lato', sans-serif", color: "rgba(255,255,255,0.4)" }}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F5F2ED" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-72 flex flex-col
          transition-transform duration-300 lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ backgroundColor: "#1B2A4A" }}
      >
        {sidebarContent}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="lg:hidden flex items-center h-14 px-4 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-lg" style={{ color: "#1B2A4A" }}>
            <Menu className="h-5 w-5" />
          </button>
          <h2
            className="ml-3 text-lg"
            style={{ fontFamily: "'Playfair Display', serif", color: "#1B2A4A", fontWeight: 700 }}
          >
            <span style={{ color: "#C8A96E" }}>/</span>AvidEdge
          </h2>
        </header>

        <main className="flex-1 p-6 lg:p-10 max-w-4xl">{children}</main>
      </div>
    </div>
  );
}
