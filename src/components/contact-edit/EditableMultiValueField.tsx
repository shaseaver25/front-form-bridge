import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";

export interface MultiValueItem {
  id?: string;
  value: string;
  category: string;
  is_primary: boolean;
  extension?: string;
  _deleted?: boolean;
  [key: string]: any;
}

interface EditableMultiValueFieldProps {
  items: Item[];
  onChange: (items: Item[]) => void;
  categories: string[];
  placeholder?: string;
  showExtension?: boolean;
}

export default function EditableMultiValueField({
  items,
  onChange,
  categories,
  placeholder = "Value",
  showExtension = false,
}: EditableMultiValueFieldProps) {
  const visibleItems = items.filter((i) => !i._deleted);

  const update = (index: number, field: string, val: any) => {
    const realIndex = getRealIndex(index);
    const next = [...items];
    next[realIndex] = { ...next[realIndex], [field]: val };
    onChange(next);
  };

  const getRealIndex = (visibleIdx: number) => {
    let count = -1;
    for (let i = 0; i < items.length; i++) {
      if (!items[i]._deleted) count++;
      if (count === visibleIdx) return i;
    }
    return -1;
  };

  const remove = (index: number) => {
    const realIndex = getRealIndex(index);
    const next = [...items];
    if (next[realIndex].id) {
      next[realIndex] = { ...next[realIndex], _deleted: true };
    } else {
      next.splice(realIndex, 1);
    }
    onChange(next);
  };

  const add = () => {
    onChange([...items, { value: "", category: categories[0] || "work", is_primary: false }]);
  };

  return (
    <div className="space-y-2">
      {visibleItems.map((item, i) => (
        <div key={item.id || `new-${i}`} className="flex items-center gap-2">
          <Input
            className="flex-1"
            value={item.value}
            onChange={(e) => update(i, "value", e.target.value)}
            placeholder={placeholder}
          />
          {showExtension && (
            <Input
              className="w-20"
              value={item.extension || ""}
              onChange={(e) => update(i, "extension", e.target.value)}
              placeholder="Ext"
            />
          )}
          <Select value={item.category} onValueChange={(v) => update(i, "category", v)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Checkbox
              checked={item.is_primary}
              onCheckedChange={(v) => update(i, "is_primary", !!v)}
              title="Primary"
            />
            <span className="text-xs text-muted-foreground">Primary</span>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(i)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={add}>
        <Plus className="w-3.5 h-3.5 mr-1" />
        Add
      </Button>
    </div>
  );
}
