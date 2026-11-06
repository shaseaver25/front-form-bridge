import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ParsedResume } from "@/lib/resumeParsing";

export function ResumeContactFields({ values, onChange, selected, onToggle, disabled, existing }: { values: ParsedResume; onChange: (value: ParsedResume) => void; selected: Set<string>; onToggle: (key: string, checked: boolean) => void; disabled: boolean; existing: string[] }) {
  return <section className="space-y-4 border-t border-border pt-4">
    <h3 className="font-semibold">Contact information</h3>
    {existing.length > 0 && <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words">Current: {existing.join(" · ")}</p>}
    {(["emails", "phones"] as const).map(kind => values[kind].map((value, index) => {
      const label = `${kind === "emails" ? "Email" : "Phone"} ${index + 1}`;
      const key = `${kind === "emails" ? "email" : "phone"}-${index}`;
      return <div key={key} className="space-y-2"><div className="flex items-center gap-2"><Checkbox id={`apply-${key}`} checked={selected.has(key)} disabled={disabled} onCheckedChange={checked => onToggle(key, checked === true)} /><Label htmlFor={`apply-${key}`}>{label}</Label></div><Input aria-label={label} value={value} disabled={disabled} onChange={event => onChange({ ...values, [kind]: values[kind].map((item, i) => i === index ? event.target.value : item) })} /></div>;
    }))}
    {values.addresses.map((address, index) => <div key={`address-${index}`} className="space-y-2"><div className="flex items-center gap-2"><Checkbox id={`apply-address-${index}`} checked={selected.has(`address-${index}`)} disabled={disabled} onCheckedChange={checked => onToggle(`address-${index}`, checked === true)} /><Label htmlFor={`apply-address-${index}`}>Mailing address {index + 1}</Label></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{(["street", "city", "state", "postal_code", "country"] as const).map(field => <div key={field}><Label htmlFor={`address-${index}-${field}`}>{field === "postal_code" ? "Postal code" : field.charAt(0).toUpperCase() + field.slice(1)}</Label><Input id={`address-${index}-${field}`} value={address[field]} disabled={disabled} onChange={event => onChange({ ...values, addresses: values.addresses.map((item, i) => i === index ? { ...item, [field]: event.target.value } : item) })} /></div>)}</div></div>)}
  </section>;
}