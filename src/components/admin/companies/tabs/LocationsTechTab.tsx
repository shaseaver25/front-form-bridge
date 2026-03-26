import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Save, Plus, Trash2, X } from "lucide-react";
import { ProfileTabProps } from "./types";

interface LocationRow {
  city: string;
  state: string;
  type: string;
}

export function LocationsTechTab({
  profile,
  onSave,
  onSaveAll,
  onDirty,
  savedField,
}: ProfileTabProps & { companyId: string }) {
  const [techStack, setTechStack] = useState<string[]>(
    Array.isArray(profile?.tech_stack) ? (profile.tech_stack as string[]) : []
  );
  const [techInput, setTechInput] = useState("");
  const [locations, setLocations] = useState<LocationRow[]>(
    Array.isArray(profile?.geographic_locations)
      ? (profile.geographic_locations as LocationRow[])
      : []
  );
  const [officePreference, setOfficePreference] = useState(
    (profile?.office_preference as string) ?? ""
  );
  const [candidateGeo, setCandidateGeo] = useState(
    (profile?.preferred_candidate_geography as string) ?? ""
  );

  const addTech = () => {
    if (!techInput.trim()) return;
    const updated = [...techStack, techInput.trim()];
    setTechStack(updated);
    setTechInput("");
    onSave("tech_stack", updated);
  };

  const removeTech = (idx: number) => {
    const updated = techStack.filter((_, i) => i !== idx);
    setTechStack(updated);
    onSave("tech_stack", updated);
  };

  const addLocation = () => {
    const updated = [...locations, { city: "", state: "", type: "Office" }];
    setLocations(updated);
    onDirty();
  };

  const updateLocation = (idx: number, field: keyof LocationRow, value: string) => {
    const updated = locations.map((l, i) => (i === idx ? { ...l, [field]: value } : l));
    setLocations(updated);
    onDirty();
  };

  const removeLocation = (idx: number) => {
    const updated = locations.filter((_, i) => i !== idx);
    setLocations(updated);
    onSave("geographic_locations", updated);
  };

  const saved = (f: string) =>
    savedField === f || savedField === "all" ? (
      <Check className="w-4 h-4 text-green-500 animate-in fade-in" />
    ) : null;

  return (
    <div className="space-y-6 py-4">
      {/* Tech Stack */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Tech Stack</label>
          {saved("tech_stack")}
        </div>
        <div className="flex flex-wrap gap-2">
          {techStack.map((t, i) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {t}
              <button onClick={() => removeTech(i)}><X className="w-3 h-3" /></button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
            placeholder="Add technology…"
            className="max-w-xs"
          />
          <Button size="sm" variant="outline" onClick={addTech}>Add</Button>
        </div>
      </div>

      {/* Locations */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Geographic Locations</label>
          {saved("geographic_locations")}
        </div>
        <div className="space-y-2">
          {locations.map((loc, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                placeholder="City"
                value={loc.city}
                onChange={(e) => updateLocation(i, "city", e.target.value)}
                onBlur={() => onSave("geographic_locations", locations)}
                className="flex-1"
              />
              <Input
                placeholder="State"
                value={loc.state}
                onChange={(e) => updateLocation(i, "state", e.target.value)}
                onBlur={() => onSave("geographic_locations", locations)}
                className="w-24"
              />
              <Select value={loc.type} onValueChange={(v) => { updateLocation(i, "type", v); onSave("geographic_locations", locations); }}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HQ">HQ</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => removeLocation(i)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addLocation}>
            <Plus className="w-4 h-4 mr-1" /> Add Location
          </Button>
        </div>
      </div>

      {/* Office Preference */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Office Preference</label>
          {saved("office_preference")}
        </div>
        <RadioGroup
          value={officePreference}
          onValueChange={(v) => {
            setOfficePreference(v);
            onSave("office_preference", v);
          }}
          className="flex gap-4"
        >
          {["In-Office", "Hybrid", "Remote", "Flexible"].map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <RadioGroupItem value={opt} id={`office-${opt}`} />
              <Label htmlFor={`office-${opt}`}>{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Candidate Geo */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Preferred Candidate Geography</label>
          {saved("preferred_candidate_geography")}
        </div>
        <Textarea
          value={candidateGeo}
          onChange={(e) => { setCandidateGeo(e.target.value); onDirty(); }}
          onBlur={() => {
            if (candidateGeo !== ((profile?.preferred_candidate_geography as string) ?? "")) {
              onSave("preferred_candidate_geography", candidateGeo);
            }
          }}
          rows={2}
          placeholder="Where should candidates be located?"
        />
      </div>

      <div className="pt-4 border-t">
        <Button
          onClick={() =>
            onSaveAll({
              tech_stack: techStack,
              geographic_locations: locations,
              office_preference: officePreference,
              preferred_candidate_geography: candidateGeo,
            })
          }
        >
          <Save className="w-4 h-4 mr-2" /> Save All
        </Button>
      </div>
    </div>
  );
}
