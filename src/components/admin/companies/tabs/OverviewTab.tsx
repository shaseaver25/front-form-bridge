import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Save, X } from "lucide-react";
import { ProfileTabProps } from "./types";

const POSTURES = ["Builder", "Scaler", "Fixer"] as const;
const POSTURE_COLORS: Record<string, string> = {
  Builder: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300",
  Scaler: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-300",
  Fixer: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300",
};

export function OverviewTab({ profile, onSave, onSaveAll, onDirty, savedField }: ProfileTabProps) {
  const [story, setStory] = useState((profile?.company_story as string) ?? "");
  const [whereAre, setWhereAre] = useState((profile?.where_they_are as string) ?? "");
  const [whereGoing, setWhereGoing] = useState((profile?.where_they_are_going as string) ?? "");
  const [posture, setPosture] = useState((profile?.strategic_posture as string) ?? "");
  const [goals, setGoals] = useState<string[]>((profile?.strategic_goals as string[]) ?? []);
  const [goalInput, setGoalInput] = useState("");

  const handleBlur = useCallback(
    (field: string, value: unknown) => {
      const original = profile?.[field as keyof typeof profile];
      if (value !== original) {
        onSave(field, value);
      }
    },
    [profile, onSave]
  );

  const addGoal = () => {
    if (!goalInput.trim()) return;
    const updated = [...goals, goalInput.trim()];
    setGoals(updated);
    setGoalInput("");
    onSave("strategic_goals", updated);
  };

  const removeGoal = (idx: number) => {
    const updated = goals.filter((_, i) => i !== idx);
    setGoals(updated);
    onSave("strategic_goals", updated);
  };

  const saved = (f: string) =>
    savedField === f || savedField === "all" ? (
      <Check className="w-4 h-4 text-green-500 animate-in fade-in" />
    ) : null;

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Company Story</label>
          {saved("company_story")}
        </div>
        <Textarea
          value={story}
          onChange={(e) => { setStory(e.target.value); onDirty(); }}
          onBlur={() => handleBlur("company_story", story)}
          rows={4}
          placeholder="What does this company do? Why do they matter?"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Where They Are</label>
          {saved("where_they_are")}
        </div>
        <Textarea
          value={whereAre}
          onChange={(e) => { setWhereAre(e.target.value); onDirty(); }}
          onBlur={() => handleBlur("where_they_are", whereAre)}
          rows={3}
          placeholder="Current state of the company…"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Where They're Going</label>
          {saved("where_they_are_going")}
        </div>
        <Textarea
          value={whereGoing}
          onChange={(e) => { setWhereGoing(e.target.value); onDirty(); }}
          onBlur={() => handleBlur("where_they_are_going", whereGoing)}
          rows={3}
          placeholder="Future direction, growth plans…"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Strategic Posture</label>
          {saved("strategic_posture")}
        </div>
        <div className="flex gap-2">
          {POSTURES.map((p) => (
            <button
              key={p}
              onClick={() => {
                setPosture(p);
                onSave("strategic_posture", p);
              }}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                posture === p
                  ? POSTURE_COLORS[p]
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Strategic Goals</label>
        <div className="flex flex-wrap gap-2">
          {goals.map((g, i) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {g}
              <button onClick={() => removeGoal(i)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGoal())}
            placeholder="Add a goal…"
            className="max-w-xs"
          />
          <Button size="sm" variant="outline" onClick={addGoal}>Add</Button>
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button
          onClick={() =>
            onSaveAll({
              company_story: story,
              where_they_are: whereAre,
              where_they_are_going: whereGoing,
              strategic_posture: posture,
              strategic_goals: goals,
            })
          }
        >
          <Save className="w-4 h-4 mr-2" /> Save All
        </Button>
      </div>
    </div>
  );
}
