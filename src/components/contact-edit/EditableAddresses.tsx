import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import type { EditableAddress } from "@/hooks/useContactEdit";

interface EditableAddressesProps {
  addresses: EditableAddress[];
  onChange: (addresses: EditableAddress[]) => void;
}

const CATEGORIES = ["business", "home", "mailing", "other"];

export default function EditableAddresses({ addresses, onChange }: EditableAddressesProps) {
  const visible = addresses.filter((a) => !a._deleted);

  const getRealIndex = (visibleIdx: number) => {
    let count = -1;
    for (let i = 0; i < addresses.length; i++) {
      if (!addresses[i]._deleted) count++;
      if (count === visibleIdx) return i;
    }
    return -1;
  };

  const update = (index: number, field: string, val: any) => {
    const ri = getRealIndex(index);
    const next = [...addresses];
    next[ri] = { ...next[ri], [field]: val };
    onChange(next);
  };

  const remove = (index: number) => {
    const ri = getRealIndex(index);
    const next = [...addresses];
    if (next[ri].id) {
      next[ri] = { ...next[ri], _deleted: true };
    } else {
      next.splice(ri, 1);
    }
    onChange(next);
  };

  const add = () => {
    onChange([
      ...addresses,
      { line1: "", line2: "", city: "", state: "", zip_code: "", country: "US", category: "business", is_primary: false },
    ]);
  };

  return (
    <div className="space-y-4">
      {visible.map((addr, i) => (
        <div key={addr.id || `new-${i}`} className="space-y-2 border border-border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Select value={addr.category} onValueChange={(v) => update(i, "category", v)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Checkbox checked={addr.is_primary} onCheckedChange={(v) => update(i, "is_primary", !!v)} />
                <span className="text-xs text-muted-foreground">Primary</span>
              </div>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(i)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Input value={addr.line1} onChange={(e) => update(i, "line1", e.target.value)} placeholder="Address Line 1" />
          <Input value={addr.line2} onChange={(e) => update(i, "line2", e.target.value)} placeholder="Address Line 2" />
          <div className="grid grid-cols-3 gap-2">
            <Input value={addr.city} onChange={(e) => update(i, "city", e.target.value)} placeholder="City" />
            <Input value={addr.state} onChange={(e) => update(i, "state", e.target.value)} placeholder="State" />
            <Input value={addr.zip_code} onChange={(e) => update(i, "zip_code", e.target.value)} placeholder="ZIP" />
          </div>
          <Input value={addr.country} onChange={(e) => update(i, "country", e.target.value)} placeholder="Country" />
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={add}>
        <Plus className="w-3.5 h-3.5 mr-1" />
        Add Address
      </Button>
    </div>
  );
}
