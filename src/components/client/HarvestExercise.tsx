import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Save, Check, X, Plus } from "lucide-react";

type HarvestData = {
  keywords: string[];
  problem_language: string[];
  responsibilities: string[];
  qualifications: string[];
  nomenclature: string[];
};

interface Props {
  onSaved?: () => void;
}

const CATEGORY_LABELS: { key: keyof HarvestData; label: string; color: string }[] = [
  { key: "keywords", label: "Keywords", color: "#C8A96E" },
  { key: "problem_language", label: "Problem Language", color: "#6366F1" },
  { key: "responsibilities", label: "Responsibilities", color: "#0D9488" },
  { key: "qualifications", label: "Qualifications", color: "#2563EB" },
  { key: "nomenclature", label: "Nomenclature", color: "#9333EA" },
];

export function HarvestExercise({ onSaved }: Props) {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [rawDescription, setRawDescription] = useState("");
  const [harvestData, setHarvestData] = useState<HarvestData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newTagInputs, setNewTagInputs] = useState<Record<string, string>>({});

  const canAnalyze = rawDescription.trim().length >= 50 && jobTitle.trim() && companyName.trim();

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setHarvestData(null);
    setSaved(false);

    try {
      const { data, error } = await supabase.functions.invoke("harvest-analyze", {
        body: { job_description: rawDescription },
      });

      if (error) {
        console.error("Harvest invoke error:", error);
        throw error;
      }

      // supabase.functions.invoke may return a string or blob — parse defensively
      let parsed: any = data;
      if (typeof data === "string") {
        try {
          parsed = JSON.parse(data);
        } catch {
          console.error("Failed to parse harvest response as JSON:", data);
          throw new Error("Received invalid response from analysis. Please try again.");
        }
      }

      if (parsed?.error) throw new Error(parsed.error);

      // Validate expected shape
      const requiredKeys: (keyof HarvestData)[] = ["keywords", "problem_language", "responsibilities", "qualifications", "nomenclature"];
      for (const key of requiredKeys) {
        if (!Array.isArray(parsed[key])) {
          parsed[key] = [];
        }
      }

      setHarvestData(parsed as HarvestData);
      toast.success("Analysis complete! Review the results below, then click Save Harvest.");
    } catch (e: any) {
      console.error("Harvest analysis error:", e);
      toast.error(e.message || "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRemoveTag = (category: keyof HarvestData, index: number) => {
    if (!harvestData) return;
    setHarvestData({
      ...harvestData,
      [category]: harvestData[category].filter((_, i) => i !== index),
    });
  };

  const handleAddTag = (category: keyof HarvestData) => {
    const value = newTagInputs[category]?.trim();
    if (!value || !harvestData) return;
    setHarvestData({
      ...harvestData,
      [category]: [...harvestData[category], value],
    });
    setNewTagInputs({ ...newTagInputs, [category]: "" });
  };

  const handleSave = async () => {
    if (!harvestData) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert harvest
      const { error: insertError } = await supabase.from("rebrand_harvests").insert({
        user_id: user.id,
        job_title: jobTitle.trim(),
        company_name: companyName.trim(),
        job_url: jobUrl.trim() || null,
        raw_description: rawDescription,
        keywords: harvestData.keywords as any,
        problem_language: harvestData.problem_language as any,
        responsibilities: harvestData.responsibilities as any,
        qualifications: harvestData.qualifications as any,
        nomenclature: harvestData.nomenclature as any,
      });

      if (insertError) throw insertError;

      // Upsert progress for ch1 as complete
      const { error: progressError } = await supabase.from("rebrand_progress").upsert(
        {
          user_id: user.id,
          chapter_id: "ch1",
          status: "complete",
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,chapter_id" }
      );

      if (progressError) throw progressError;

      setSaved(true);
      toast.success("Harvest saved! Chapter 2 is now unlocked.");
      onSaved?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to save harvest.");
    } finally {
      setSaving(false);
    }
  };

  // Success state
  if (saved) {
    return (
      <div className="rounded-xl bg-white shadow-sm p-10 text-center">
        <div
          className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
          style={{ backgroundColor: "rgba(200,169,110,0.12)" }}
        >
          <Check className="h-10 w-10" style={{ color: "#C8A96E" }} />
        </div>
        <h3
          className="text-xl mb-2"
          style={{ fontFamily: "'Playfair Display', serif", color: "#1B2A4A", fontWeight: 700 }}
        >
          Harvest Saved!
        </h3>
        <p className="text-sm mb-6" style={{ fontFamily: "'Lato', sans-serif", color: "#6B7280" }}>
          Your analysis for <strong>{jobTitle}</strong> at <strong>{companyName}</strong> has been saved.
          <br />
          Chapter 2 is now unlocked — check the sidebar.
        </p>
        <button
          onClick={() => {
            setJobTitle("");
            setCompanyName("");
            setJobUrl("");
            setRawDescription("");
            setHarvestData(null);
            setSaved(false);
          }}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
          style={{ backgroundColor: "#1B2A4A", color: "#FFFFFF", fontFamily: "'Lato', sans-serif" }}
        >
          Harvest Another Posting
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input form */}
      <div className="rounded-xl bg-white shadow-sm p-6 lg:p-8">
        <h2
          className="text-lg mb-1"
          style={{ fontFamily: "'Playfair Display', serif", color: "#1B2A4A", fontWeight: 700 }}
        >
          Your First Harvest
        </h2>
        <p className="text-sm mb-6" style={{ fontFamily: "'Lato', sans-serif", color: "#6B7280" }}>
          Paste a job description that represents your ideal next role.
        </p>

        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ fontFamily: "'Lato', sans-serif", color: "#6B7280", fontWeight: 600 }}>
              Job Title *
            </label>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. VP of Engineering"
              className="w-full px-3 py-2.5 rounded-lg border text-sm"
              style={{ borderColor: "#E5E7EB", fontFamily: "'Lato', sans-serif" }}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ fontFamily: "'Lato', sans-serif", color: "#6B7280", fontWeight: 600 }}>
              Company Name *
            </label>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Salesforce"
              className="w-full px-3 py-2.5 rounded-lg border text-sm"
              style={{ borderColor: "#E5E7EB", fontFamily: "'Lato', sans-serif" }}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ fontFamily: "'Lato', sans-serif", color: "#6B7280", fontWeight: 600 }}>
            Job URL (optional)
          </label>
          <input
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 rounded-lg border text-sm"
            style={{ borderColor: "#E5E7EB", fontFamily: "'Lato', sans-serif" }}
          />
        </div>

        <div className="mb-5">
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ fontFamily: "'Lato', sans-serif", color: "#6B7280", fontWeight: 600 }}>
            Job Description *
          </label>
          <textarea
            value={rawDescription}
            onChange={(e) => setRawDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={10}
            className="w-full px-3 py-2.5 rounded-lg border text-sm resize-y"
            style={{ borderColor: "#E5E7EB", fontFamily: "'Lato', sans-serif", lineHeight: 1.6 }}
          />
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
            {rawDescription.length < 50 ? `${50 - rawDescription.length} more characters needed` : "✓ Ready to analyze"}
          </p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || analyzing}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
          style={{ backgroundColor: "#1B2A4A", color: "#FFFFFF", fontFamily: "'Lato', sans-serif" }}
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Run Harvest
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {harvestData && (
        <div className="rounded-xl bg-white shadow-sm p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className="text-lg"
                style={{ fontFamily: "'Playfair Display', serif", color: "#1B2A4A", fontWeight: 700 }}
              >
                Harvest Results
              </h2>
              <p className="text-xs mt-0.5" style={{ fontFamily: "'Lato', sans-serif", color: "#9CA3AF" }}>
                Review and edit the extracted terms, then save.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {CATEGORY_LABELS.map(({ key, label, color }) => (
              <div key={key}>
                <h3 className="text-sm font-semibold mb-2" style={{ fontFamily: "'Lato', sans-serif", color }}>
                  {label}
                  <span className="ml-2 text-xs font-normal" style={{ color: "#9CA3AF" }}>
                    ({harvestData[key].length})
                  </span>
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {harvestData[key].map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${color}12`,
                        color,
                        border: `1px solid ${color}30`,
                        fontFamily: "'Lato', sans-serif",
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(key, i)}
                        className="hover:opacity-70 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {/* Add new tag */}
                <div className="flex gap-2">
                  <input
                    value={newTagInputs[key] || ""}
                    onChange={(e) => setNewTagInputs({ ...newTagInputs, [key]: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag(key)}
                    placeholder={`Add ${label.toLowerCase()}…`}
                    className="px-2.5 py-1.5 rounded-lg border text-xs flex-1 max-w-xs"
                    style={{ borderColor: "#E5E7EB", fontFamily: "'Lato', sans-serif" }}
                  />
                  <button
                    onClick={() => handleAddTag(key)}
                    className="p-1.5 rounded-lg border transition-colors hover:bg-gray-50"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <Plus className="h-3.5 w-3.5" style={{ color: "#6B7280" }} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Save */}
          <div className="mt-8 pt-6" style={{ borderTop: "1px solid #E5E7EB" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: "#C8A96E", color: "#FFFFFF", fontFamily: "'Lato', sans-serif" }}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Harvest
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
