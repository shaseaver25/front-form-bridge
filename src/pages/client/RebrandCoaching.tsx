import { useState, useCallback } from "react";
import { RebrandLayout } from "@/components/client/RebrandLayout";
import { HarvestExercise } from "@/components/client/HarvestExercise";
import { HarvestResults } from "@/components/client/HarvestResults";
import { ChapterReflection } from "@/components/client/ChapterReflection";

const TABS = ["Learn", "Exercise", "My Results"] as const;
type Tab = typeof TABS[number];

export default function RebrandCoaching() {
  const [activeChapter, setActiveChapter] = useState("intro");
  const [activeTab, setActiveTab] = useState<Tab>("Learn");
  const [resultsRefreshKey, setResultsRefreshKey] = useState(0);

  const handleSelectChapter = (id: string) => {
    setActiveChapter(id);
    setActiveTab("Learn");
  };

  const handleHarvestSaved = useCallback(() => {
    setResultsRefreshKey((k) => k + 1);
  }, []);

  // Chapter content registry
  const getContent = (tab: Tab) => {
    const chapterContent: Record<string, Record<Tab, React.ReactNode>> = {
      intro: {
        Learn: <IntroLearn />,
        Exercise: <IntroExercise />,
        "My Results": <PlaceholderResults />,
      },
      ch1: {
        Learn: <Ch1Learn />,
        Exercise: <HarvestExercise onSaved={handleHarvestSaved} />,
        "My Results": <HarvestResults refreshKey={resultsRefreshKey} />,
      },
      ch2: {
        Learn: <LockedPlaceholder title="The Three Strict Criteria" />,
        Exercise: <LockedPlaceholder title="The Three Strict Criteria" />,
        "My Results": <PlaceholderResults />,
      },
      ch3: {
        Learn: <LockedPlaceholder title="The Brand Audit" />,
        Exercise: <LockedPlaceholder title="The Brand Audit" />,
        "My Results": <PlaceholderResults />,
      },
      ch4: {
        Learn: <LockedPlaceholder title="The Nomenclature Gap" />,
        Exercise: <LockedPlaceholder title="The Nomenclature Gap" />,
        "My Results": <PlaceholderResults />,
      },
      ch5: {
        Learn: <LockedPlaceholder title="The Rewrite" />,
        Exercise: <LockedPlaceholder title="The Rewrite" />,
        "My Results": <PlaceholderResults />,
      },
      ch6: {
        Learn: <LockedPlaceholder title="The Action Plan" />,
        Exercise: <LockedPlaceholder title="The Action Plan" />,
        "My Results": <PlaceholderResults />,
      },
    };
    return chapterContent[activeChapter]?.[tab] || <PlaceholderResults />;
  };

  const chapterMeta: Record<string, { label: string; title: string }> = {
    intro: { label: "Introduction", title: "Welcome to Re:Brand" },
    ch1: { label: "Chapter 1", title: "The Harvesting Framework" },
    ch2: { label: "Chapter 2", title: "The Three Strict Criteria" },
    ch3: { label: "Chapter 3", title: "The Brand Audit" },
    ch4: { label: "Chapter 4", title: "The Nomenclature Gap" },
    ch5: { label: "Chapter 5", title: "The Rewrite" },
    ch6: { label: "Chapter 6", title: "The Action Plan" },
  };

  const meta = chapterMeta[activeChapter];

  return (
    <RebrandLayout activeChapterId={activeChapter} onSelectChapter={handleSelectChapter}>
      {/* Chapter header */}
      <div className="mb-8">
        <p
          className="text-xs uppercase tracking-[0.2em] mb-1"
          style={{ fontFamily: "'Lato', sans-serif", color: "#C8A96E", fontWeight: 600 }}
        >
          {meta?.label}
        </p>
        <h1
          className="text-2xl lg:text-3xl"
          style={{ fontFamily: "'Playfair Display', serif", color: "#1B2A4A", fontWeight: 700 }}
        >
          {meta?.title}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b mb-8" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative px-5 py-3 text-sm transition-all duration-150"
            style={{
              fontFamily: "'Lato', sans-serif",
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "#1B2A4A" : "#9CA3AF",
            }}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ backgroundColor: "#C8A96E" }} />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">{getContent(activeTab)}</div>
    </RebrandLayout>
  );
}

/* ── Chapter Content Components ── */

function IntroLearn() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white shadow-sm p-8">
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#1B2A4A", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
          Why Re:Brand?
        </h2>
        <div className="space-y-4" style={{ fontFamily: "'Lato', sans-serif", color: "#374151", fontSize: "0.9375rem", lineHeight: 1.75 }}>
          <p>
            The executive job market operates on a fundamental truth: <strong>hiring managers buy alignment, not potential.</strong> Your resume, LinkedIn profile, and interview language must mirror the exact terminology used inside the organizations you're targeting.
          </p>
          <p>
            Re:Brand is a structured coaching program that teaches you <em>Harvesting</em> — the methodology of extracting language patterns from target job descriptions and systematically embedding them into your professional brand.
          </p>
          <p>Over the next six chapters, you'll learn to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Identify the three strict criteria for selecting harvesting targets</li>
            <li>Extract keywords, problem language, and nomenclature from job descriptions</li>
            <li>Audit your current brand against enterprise-grade expectations</li>
            <li>Map terminology gaps between your language and theirs</li>
            <li>Rewrite your materials with precision-targeted vocabulary</li>
            <li>Build an action plan for consistent brand deployment</li>
          </ul>
        </div>
      </div>
      <div className="rounded-xl p-6" style={{ backgroundColor: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)" }}>
        <p className="text-sm" style={{ fontFamily: "'Lato', sans-serif", color: "#92702E" }}>
          <strong>How this works:</strong> Read the Learn section, complete the Exercise, then review your results with your coach. Each chapter unlocks after you complete the previous one.
        </p>
      </div>
    </div>
  );
}

function IntroExercise() {
  return (
    <div className="rounded-xl bg-white shadow-sm p-8">
      <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#1B2A4A", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
        Getting Started
      </h2>
      <div className="space-y-6" style={{ fontFamily: "'Lato', sans-serif", color: "#374151", fontSize: "0.9375rem", lineHeight: 1.75 }}>
        <p>Before we dive into Harvesting, take a moment to reflect on your current professional brand:</p>

        <div className="space-y-6">
          <div>
            <p className="font-medium">1. What three words would a recruiter use to describe you after reading your LinkedIn?</p>
            <ChapterReflection chapterId="intro" questionKey="q1_three_words" label="Your answer" />
          </div>
          <div>
            <p className="font-medium">2. What industry or function do your current materials position you for?</p>
            <ChapterReflection chapterId="intro" questionKey="q2_industry_function" label="Your answer" />
          </div>
          <div>
            <p className="font-medium">3. What is the gap between where your brand is now and where you want it to be?</p>
            <ChapterReflection chapterId="intro" questionKey="q3_brand_gap" label="Your answer" />
          </div>
        </div>

        <p className="text-sm" style={{ color: "#9CA3AF" }}>
          Your answers are saved privately — only you and your coach can see them. We'll revisit these in Chapter 3 during the Brand Audit.
        </p>
      </div>
    </div>
  );
}

function Ch1Learn() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white shadow-sm p-8">
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#1B2A4A", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>
          What Is Harvesting?
        </h2>
        <div className="space-y-4" style={{ fontFamily: "'Lato', sans-serif", color: "#374151", fontSize: "0.9375rem", lineHeight: 1.75 }}>
          <p>
            Harvesting is the systematic process of <strong>extracting language patterns</strong> from real job descriptions at your target companies and embedding that vocabulary into every element of your professional brand.
          </p>
          <p>
            Think of it as competitive intelligence for your career. Just as a company studies its market before launching a product, you need to study the language your target employers use before positioning yourself.
          </p>
          <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#1B2A4A", fontSize: "1.1rem", fontWeight: 700, marginTop: "1.5rem", marginBottom: "0.75rem" }}>
            The Five Harvest Categories
          </h3>
          <p>When analyzing a job description, you'll extract language across five dimensions:</p>
          <div className="grid gap-3 mt-4">
            {[
              { label: "Keywords", desc: "Core technical and functional terms the role demands" },
              { label: "Problem Language", desc: "The business challenges and pain points referenced" },
              { label: "Responsibilities", desc: "How they describe the scope and actions of the role" },
              { label: "Qualifications", desc: "The specific credentials, experiences, and attributes valued" },
              { label: "Nomenclature", desc: "Company-specific jargon, titles, and internal language patterns" },
            ].map((item) => (
              <div key={item.label} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: "#F9FAFB" }}>
                <span className="text-sm font-semibold shrink-0 w-32" style={{ color: "#C8A96E", fontFamily: "'Lato', sans-serif" }}>
                  {item.label}
                </span>
                <span className="text-sm" style={{ color: "#6B7280" }}>{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-xl p-6" style={{ backgroundColor: "rgba(200,169,110,0.08)", border: "1px solid rgba(200,169,110,0.2)" }}>
        <p className="text-sm" style={{ fontFamily: "'Lato', sans-serif", color: "#92702E" }}>
          <strong>Key insight:</strong> You're not copying job descriptions — you're learning the language your future employer speaks so you can demonstrate fluency from the first touchpoint.
        </p>
      </div>
    </div>
  );
}

function PlaceholderResults() {
  return (
    <div className="rounded-xl bg-white shadow-sm p-8 text-center">
      <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#F3F4F6" }}>
        <span className="text-2xl">📊</span>
      </div>
      <h3 className="text-lg mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#1B2A4A", fontWeight: 700 }}>
        Your Results
      </h3>
      <p className="text-sm" style={{ fontFamily: "'Lato', sans-serif", color: "#9CA3AF" }}>
        Complete the exercise to see your results here. Your coach will review and provide feedback.
      </p>
    </div>
  );
}

function LockedPlaceholder({ title }: { title: string }) {
  return (
    <div className="rounded-xl bg-white shadow-sm p-8 text-center">
      <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#F3F4F6" }}>
        <span className="text-2xl">🔒</span>
      </div>
      <h3 className="text-lg mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#1B2A4A", fontWeight: 700 }}>
        {title}
      </h3>
      <p className="text-sm" style={{ fontFamily: "'Lato', sans-serif", color: "#9CA3AF" }}>
        Complete the previous chapter to unlock this content.
      </p>
    </div>
  );
}
