import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { careerDate, careerKey, type ParsedResume } from "@/lib/resumeParsing";

export function ResumeCareerFields({ values, selected, onToggle, disabled, existing }: { values: ParsedResume; selected: Set<string>; onToggle: (key: string, checked: boolean) => void; disabled: boolean; existing: string[] }) {
  if (!values.career_history.length) return null;
  return <section className="space-y-3 border-t border-border pt-4">
    <h3 className="font-semibold">Career history</h3>
    {values.career_history.map((role, index) => {
      const key = `career-${index}`;
      const inCrm = existing.includes(careerKey(role.company, role.title, careerDate(role.start_date)));
      const dates = [role.start_date, role.is_current ? "Present" : role.end_date].filter(Boolean).join(" – ");
      return <div key={key} className="space-y-1"><div className="flex items-center gap-2"><Checkbox id={`apply-${key}`} checked={!inCrm && selected.has(key)} disabled={disabled || inCrm} onCheckedChange={checked => onToggle(key, checked === true)} /><Label htmlFor={`apply-${key}`}>{[role.title, role.company].filter(Boolean).join(" · ")}</Label>{inCrm && <span className="text-xs text-muted-foreground">Already in CRM</span>}</div>
        {dates && <p className="text-xs text-muted-foreground pl-6">{dates}</p>}
        {role.description && <p className="text-xs text-muted-foreground pl-6 whitespace-pre-wrap break-words max-h-24 overflow-y-auto">{role.description}</p>}
      </div>;
    })}
  </section>;
}
