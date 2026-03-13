import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap } from "lucide-react";

interface CareerHistoryEntryProps {
  entry: {
    id: string;
    job_title?: string | null;
    degree?: string | null;
    company_name?: string | null;
    institution?: string | null;
    entry_type?: string;
    is_current?: boolean;
    started_at?: string | null;
    ended_at?: string | null;
    description?: string | null;
  };
}

/**
 * Parse a career description that may contain bullet points (• character)
 * into a structured format with an intro paragraph and bullet items.
 */
function parseDescription(raw: string): { intro: string; bullets: string[] } {
  // Split on bullet character (•) — often preceded by whitespace or tab
  const parts = raw.split(/\s*•\s*/);

  const intro = (parts[0] || "").trim();
  const bullets = parts
    .slice(1)
    .map((b) => b.trim())
    .filter(Boolean);

  return { intro, bullets };
}

export default function CareerHistoryEntry({ entry }: CareerHistoryEntryProps) {
  const isEducation = entry.entry_type === "education";
  const title = entry.job_title || entry.degree || "Position";
  const org = entry.company_name || entry.institution || "";

  const dateRange = (() => {
    if (!entry.started_at && !entry.ended_at) return null;
    const start = entry.started_at
      ? new Date(entry.started_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : "?";
    const end = entry.is_current
      ? "Present"
      : entry.ended_at
        ? new Date(entry.ended_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        : "?";
    return `${start} — ${end}`;
  })();

  const parsed = entry.description ? parseDescription(entry.description) : null;

  return (
    <div className="border-l-2 border-border pl-4 space-y-2">
      {/* Title row */}
      <div className="flex items-center gap-2 flex-wrap">
        {isEducation ? (
          <GraduationCap className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <p className="text-sm font-semibold">{title}</p>
        {entry.is_current && (
          <Badge variant="secondary" className="text-xs">Current</Badge>
        )}
      </div>

      {/* Organization */}
      {org && (
        <p className="text-sm text-muted-foreground font-medium">{org}</p>
      )}

      {/* Date range */}
      {dateRange && (
        <p className="text-xs text-muted-foreground">{dateRange}</p>
      )}

      {/* Description with parsed bullets */}
      {parsed && (
        <div className="space-y-2 pt-1">
          {parsed.intro && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {parsed.intro}
            </p>
          )}
          {parsed.bullets.length > 0 && (
            <ul className="space-y-1.5 ml-1">
              {parsed.bullets.map((bullet, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground leading-relaxed">
                  <span className="text-primary mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
