import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, Save, ShieldAlert } from "lucide-react";
import { ProfileTabProps } from "./types";

export function SearchConstraintsTab({ profile, onSave, onSaveAll, onDirty, savedField }: ProfileTabProps) {
  const [offLimits, setOffLimits] = useState(!!profile?.off_limits_source);
  const [offLimitsReason, setOffLimitsReason] = useState((profile?.off_limits_reason as string) ?? "");
  const [compMin, setCompMin] = useState(String(profile?.comp_range_min ?? ""));
  const [compMax, setCompMax] = useState(String(profile?.comp_range_max ?? ""));
  const [bonus, setBonus] = useState((profile?.bonus_structure as string) ?? "");

  const saved = (f: string) =>
    savedField === f || savedField === "all" ? (
      <Check className="w-4 h-4 text-green-500 animate-in fade-in" />
    ) : null;

  return (
    <div className="space-y-6 py-4">
      {/* Off-limits toggle */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Switch
            checked={offLimits}
            onCheckedChange={(v) => {
              setOffLimits(v);
              onSave("off_limits_source", v);
            }}
          />
          <Label className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-destructive" />
            Off-Limits Source
          </Label>
          {saved("off_limits_source")}
        </div>
        {offLimits && (
          <div className="space-y-2 pl-12">
            <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm">
              <ShieldAlert className="w-4 h-4" /> Company is off-limits
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-foreground">Reason</label>
              {saved("off_limits_reason")}
            </div>
            <Textarea
              value={offLimitsReason}
              onChange={(e) => { setOffLimitsReason(e.target.value); onDirty(); }}
              onBlur={() => onSave("off_limits_reason", offLimitsReason)}
              rows={2}
              placeholder="Why is this company off-limits?"
            />
          </div>
        )}
      </div>

      {/* Comp range */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Compensation Range</label>
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              value={compMin}
              onChange={(e) => { setCompMin(e.target.value); onDirty(); }}
              onBlur={() => onSave("comp_range_min", compMin ? Number(compMin) : null)}
              placeholder="Min"
              className="pl-7"
              type="number"
            />
          </div>
          <span className="text-muted-foreground">—</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              value={compMax}
              onChange={(e) => { setCompMax(e.target.value); onDirty(); }}
              onBlur={() => onSave("comp_range_max", compMax ? Number(compMax) : null)}
              placeholder="Max"
              className="pl-7"
              type="number"
            />
          </div>
          {saved("comp_range_min")}
          {saved("comp_range_max")}
        </div>
      </div>

      {/* Bonus structure */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Bonus Structure</label>
          {saved("bonus_structure")}
        </div>
        <Textarea
          value={bonus}
          onChange={(e) => { setBonus(e.target.value); onDirty(); }}
          onBlur={() => onSave("bonus_structure", bonus)}
          rows={3}
          placeholder="Annual bonus, signing bonus, equity…"
        />
      </div>

      <div className="pt-4 border-t">
        <Button
          onClick={() =>
            onSaveAll({
              off_limits_source: offLimits,
              off_limits_reason: offLimitsReason,
              comp_range_min: compMin ? Number(compMin) : null,
              comp_range_max: compMax ? Number(compMax) : null,
              bonus_structure: bonus,
            })
          }
        >
          <Save className="w-4 h-4 mr-2" /> Save All
        </Button>
      </div>
    </div>
  );
}
