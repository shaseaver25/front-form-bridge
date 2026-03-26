import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Save } from "lucide-react";
import { ProfileTabProps } from "./types";

const FIELDS = [
  { key: "pe_firm_name", label: "PE Firm Name", type: "input" },
  { key: "pe_firm_context", label: "PE Firm Context", type: "textarea" },
  { key: "board_structure", label: "Board Structure", type: "textarea" },
  { key: "key_decision_makers", label: "Key Decision Makers", type: "textarea" },
  { key: "culture_summary", label: "Culture Summary", type: "textarea" },
  { key: "decision_making_style", label: "Decision Making Style", type: "textarea" },
  { key: "competitive_landscape", label: "Competitive Landscape", type: "textarea" },
] as const;

export function OwnershipCultureTab({ profile, onSave, onSaveAll, onDirty, savedField }: ProfileTabProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, (profile?.[f.key] as string) ?? ""]))
  );

  const handleBlur = useCallback(
    (field: string) => {
      if (values[field] !== ((profile?.[field] as string) ?? "")) {
        onSave(field, values[field]);
      }
    },
    [values, profile, onSave]
  );

  const saved = (f: string) =>
    savedField === f || savedField === "all" ? (
      <Check className="w-4 h-4 text-green-500 animate-in fade-in" />
    ) : null;

  return (
    <div className="space-y-6 py-4">
      {FIELDS.map((f) => (
        <div key={f.key} className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">{f.label}</label>
            {saved(f.key)}
          </div>
          {f.type === "textarea" ? (
            <Textarea
              value={values[f.key]}
              onChange={(e) => { setValues((v) => ({ ...v, [f.key]: e.target.value })); onDirty(); }}
              onBlur={() => handleBlur(f.key)}
              rows={3}
            />
          ) : (
            <Input
              value={values[f.key]}
              onChange={(e) => { setValues((v) => ({ ...v, [f.key]: e.target.value })); onDirty(); }}
              onBlur={() => handleBlur(f.key)}
            />
          )}
        </div>
      ))}

      <div className="pt-4 border-t">
        <Button onClick={() => onSaveAll(values)}>
          <Save className="w-4 h-4 mr-2" /> Save All
        </Button>
      </div>
    </div>
  );
}
