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

function parseDescription(raw: string): { intro: string; bullets: string[] } {
  const normalized = raw.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) return { intro: "", bullets: [] };

  const bulletSplit = normalized
    .split(/\s*(?:•|▪|◦|‣|\*|—\s+|–\s+|\-\s+)\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (bulletSplit.length > 1) {
    return {
      intro: bulletSplit[0],
      bullets: bulletSplit.slice(1),
    };
  }

  const sentenceSplit = normalized
    .split(/(?<=\.)\s*(?=[A-Z])/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (sentenceSplit.length >= 4) {
    return {
      intro: sentenceSplit[0],
      bullets: sentenceSplit.slice(1),
    };
  }

  return { intro: normalized, bullets: [] };
}

export default function CareerHistoryEntry({ entry }: CareerHistoryEntryProps) {
  const isEducation = entry.entry_type === "education";

  const hasLongJobTitle = (entry.job_title?.length || 0) > 140;
  const hasShortDescription = (entry.description?.length || 0) > 0 && (entry.description?.length || 0) < 120;
  const swappedFields = hasLongJobTitle && hasShortDescription;

  const title = swappedFields
    ? (entry.description || "Position")
    : (entry.job_title || entry.degree || "Position");

  const detailText = swappedFields ? (entry.job_title || "") : (entry.description || "");
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

  const parsed = detailText ? parseDescription(detailText) : null;

  return (
    <div className="border-l-2 border-border pl-4 space-y-2">
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

      {org && <p className="text-sm text-muted-foreground font-medium">{org}</p>}

      {dateRange && <p className="text-xs text-muted-foreground">{dateRange}</p>}

      {parsed && (
        <div className="space-y-2 pt-1">
          {parsed.intro && (
            <p className="text-sm text-muted-foreground leading-relaxed">{parsed.intro}</p>
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
