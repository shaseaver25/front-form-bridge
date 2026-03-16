import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClientLayout } from "@/components/client/ClientLayout";
import { BookOpen, FileText, CalendarDays, ArrowRight, Mail } from "lucide-react";

export default function ClientDashboard() {
  const [firstName, setFirstName] = useState("");
  const [chaptersComplete, setChaptersComplete] = useState(0);
  const [totalChapters] = useState(8);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile name
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();
      if (profile?.first_name) setFirstName(profile.first_name);

      // Load progress
      const { data: progress } = await supabase
        .from("rebrand_progress")
        .select("status")
        .eq("user_id", user.id);
      if (progress) {
        setChaptersComplete(progress.filter((p) => p.status === "complete").length);
      }
    }
    load();
  }, []);

  const progressPct = totalChapters > 0 ? Math.round((chaptersComplete / totalChapters) * 100) : 0;
  const hasStarted = chaptersComplete > 0;

  return (
    <ClientLayout>
      {/* Welcome */}
      <div className="mb-10">
        <h1
          className="text-3xl lg:text-4xl mb-2"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "#1B2A4A",
            fontWeight: 700,
          }}
        >
          Welcome back, {firstName || "there"}
        </h1>
        <p
          className="text-sm"
          style={{ fontFamily: "'Lato', sans-serif", color: "#6B7280" }}
        >
          Your client portal — coaching, resources, and support in one place.
        </p>
      </div>

      {/* Module Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
        {/* Re:Brand Coaching Card */}
        <div
          className="rounded-xl bg-white shadow-sm overflow-hidden flex flex-col"
          style={{ borderLeft: "4px solid #C8A96E" }}
        >
          <div className="p-6 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(200,169,110,0.12)" }}
              >
                <BookOpen className="h-4 w-4" style={{ color: "#C8A96E" }} />
              </div>
              <div>
                <h3
                  className="text-base font-semibold"
                  style={{ fontFamily: "'Lato', sans-serif", color: "#1B2A4A" }}
                >
                  Re:Brand Coaching
                </h3>
              </div>
            </div>
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ fontFamily: "'Lato', sans-serif", color: "#C8A96E", fontWeight: 600 }}
            >
              Professional Brand Transformation
            </p>
            <p
              className="text-sm leading-relaxed mb-5"
              style={{ fontFamily: "'Lato', sans-serif", color: "#6B7280" }}
            >
              Master the Harvesting methodology to align your professional brand with enterprise targets.
            </p>

            {/* Progress */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className="text-xs font-medium"
                  style={{ fontFamily: "'Lato', sans-serif", color: "#374151" }}
                >
                  Progress
                </span>
                <span
                  className="text-xs"
                  style={{ fontFamily: "'Lato', sans-serif", color: "#9CA3AF" }}
                >
                  {chaptersComplete} of {totalChapters} chapters
                </span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: "#E5E7EB" }}>
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: "#C8A96E",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <Link
              to="/client/coaching/rebrand"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:opacity-90"
              style={{
                backgroundColor: "#1B2A4A",
                color: "#FFFFFF",
                fontFamily: "'Lato', sans-serif",
              }}
            >
              {hasStarted ? "Continue" : "Start"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Documents Card (Coming Soon) */}
        <div className="rounded-xl bg-white shadow-sm overflow-hidden flex flex-col opacity-60">
          <div className="p-6 flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#F3F4F6" }}
                >
                  <FileText className="h-4 w-4" style={{ color: "#9CA3AF" }} />
                </div>
                <h3
                  className="text-base font-semibold"
                  style={{ fontFamily: "'Lato', sans-serif", color: "#1B2A4A" }}
                >
                  Documents
                </h3>
              </div>
              <span
                className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-semibold"
                style={{
                  backgroundColor: "#F3F4F6",
                  color: "#9CA3AF",
                  fontFamily: "'Lato', sans-serif",
                }}
              >
                Coming Soon
              </span>
            </div>
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ fontFamily: "'Lato', sans-serif", color: "#D1D5DB", fontWeight: 600 }}
            >
              Your Files &amp; Resources
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ fontFamily: "'Lato', sans-serif", color: "#9CA3AF" }}
            >
              Access your coaching materials, templates, and shared resources in one place.
            </p>
          </div>
        </div>

        {/* Schedule Card (Coming Soon) */}
        <div className="rounded-xl bg-white shadow-sm overflow-hidden flex flex-col opacity-60">
          <div className="p-6 flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "#F3F4F6" }}
                >
                  <CalendarDays className="h-4 w-4" style={{ color: "#9CA3AF" }} />
                </div>
                <h3
                  className="text-base font-semibold"
                  style={{ fontFamily: "'Lato', sans-serif", color: "#1B2A4A" }}
                >
                  Schedule
                </h3>
              </div>
              <span
                className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-semibold"
                style={{
                  backgroundColor: "#F3F4F6",
                  color: "#9CA3AF",
                  fontFamily: "'Lato', sans-serif",
                }}
              >
                Coming Soon
              </span>
            </div>
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ fontFamily: "'Lato', sans-serif", color: "#D1D5DB", fontWeight: 600 }}
            >
              Upcoming Sessions
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ fontFamily: "'Lato', sans-serif", color: "#9CA3AF" }}
            >
              View and manage your upcoming coaching sessions and milestones.
            </p>
          </div>
        </div>
      </div>

      {/* Your Coach Section */}
      <div className="rounded-xl bg-white shadow-sm p-6">
        <h2
          className="text-lg mb-4"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "#1B2A4A",
            fontWeight: 700,
          }}
        >
          Your Coach
        </h2>
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
            style={{
              backgroundColor: "#1B2A4A",
              color: "#C8A96E",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            JF
          </div>
          <div>
            <p
              className="text-base font-semibold"
              style={{ fontFamily: "'Lato', sans-serif", color: "#1B2A4A" }}
            >
              Juliet Fox
            </p>
            <p
              className="text-sm mb-1"
              style={{ fontFamily: "'Lato', sans-serif", color: "#6B7280" }}
            >
              Executive Career Coach &amp; Founder, AvidEdge
            </p>
            <a
              href="mailto:inquire@avidedgesearch.com"
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "#C8A96E", fontFamily: "'Lato', sans-serif" }}
            >
              <Mail className="h-3.5 w-3.5" />
              inquire@avidedgesearch.com
            </a>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}
