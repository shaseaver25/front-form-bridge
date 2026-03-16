import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

type Harvest = {
  id: string;
  job_title: string;
  company_name: string;
  job_url: string | null;
  keywords: string[];
  problem_language: string[];
  responsibilities: string[];
  qualifications: string[];
  nomenclature: string[];
  created_at: string;
};

const CATEGORY_LABELS: { key: keyof Pick<Harvest, "keywords" | "problem_language" | "responsibilities" | "qualifications" | "nomenclature">; label: string; color: string }[] = [
  { key: "keywords", label: "Keywords", color: "#C8A96E" },
  { key: "problem_language", label: "Problem Language", color: "#6366F1" },
  { key: "responsibilities", label: "Responsibilities", color: "#0D9488" },
  { key: "qualifications", label: "Qualifications", color: "#2563EB" },
  { key: "nomenclature", label: "Nomenclature", color: "#9333EA" },
];

interface Props {
  refreshKey?: number;
}

export function HarvestResults({ refreshKey }: Props) {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("rebrand_harvests")
        .select("id, job_title, company_name, job_url, keywords, problem_language, responsibilities, qualifications, nomenclature, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setHarvests(data as unknown as Harvest[]);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="rounded-xl bg-white shadow-sm p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: "#C8A96E" }} />
      </div>
    );
  }

  if (harvests.length === 0) {
    return (
      <div className="rounded-xl bg-white shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#F3F4F6" }}>
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#1B2A4A", fontWeight: 700 }}>
          No Harvests Yet
        </h3>
        <p className="text-sm" style={{ fontFamily: "'Lato', sans-serif", color: "#9CA3AF" }}>
          Complete the Exercise tab to run your first harvest and see results here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg" style={{ fontFamily: "'Playfair Display', serif", color: "#1B2A4A", fontWeight: 700 }}>
          Your Harvests
        </h2>
        <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(200,169,110,0.12)", color: "#C8A96E", fontFamily: "'Lato', sans-serif", fontWeight: 600 }}>
          {harvests.length} saved
        </span>
      </div>

      {harvests.map((h) => {
        const isOpen = expanded === h.id;
        return (
          <div key={h.id} className="rounded-xl bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : h.id)}
              className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            >
              <div>
                <h3 className="text-sm font-semibold" style={{ fontFamily: "'Lato', sans-serif", color: "#1B2A4A" }}>
                  {h.job_title}
                </h3>
                <p className="text-xs mt-0.5" style={{ fontFamily: "'Lato', sans-serif", color: "#9CA3AF" }}>
                  {h.company_name} · {new Date(h.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {h.job_url && (
                  <a
                    href={h.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" style={{ color: "#9CA3AF" }} />
                  </a>
                )}
                <span className="text-xs" style={{ color: "#9CA3AF" }}>{isOpen ? "▲" : "▼"}</span>
              </div>
            </button>

            {isOpen && (
              <div className="px-6 pb-6 pt-2 space-y-4" style={{ borderTop: "1px solid #F3F4F6" }}>
                {CATEGORY_LABELS.map(({ key, label, color }) => {
                  const tags = h[key] as string[];
                  if (!tags || tags.length === 0) return null;
                  return (
                    <div key={key}>
                      <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color, fontFamily: "'Lato', sans-serif" }}>
                        {label}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-full text-xs"
                            style={{
                              backgroundColor: `${color}10`,
                              color,
                              border: `1px solid ${color}25`,
                              fontFamily: "'Lato', sans-serif",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
