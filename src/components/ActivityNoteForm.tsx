import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ActivityNoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  constituentId: string;
  onSuccess: () => void;
  defaultTitle?: string;
}

interface ActionItem {
  title: string;
  dueDate: string;
}

const INTERACTION_TYPES = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "networking_event", label: "Networking Event" },
];

const ActivityNoteForm = ({ open, onOpenChange, constituentId, onSuccess, defaultTitle = "" }: ActivityNoteFormProps) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [createActionItem, setCreateActionItem] = useState(false);
  const [actionItems, setActionItems] = useState<ActionItem[]>([{ title: "", dueDate: "" }]);

  useEffect(() => {
    if (open && defaultTitle) {
      const matchedType = INTERACTION_TYPES.find(
        type => defaultTitle.toLowerCase().includes(type.value.replace("_", " "))
      );
      if (matchedType) {
        setSelectedTypes([matchedType.value]);
      }
    }
  }, [open, defaultTitle]);

  const toggleInteractionType = (value: string) => {
    setSelectedTypes(prev =>
      prev.includes(value)
        ? prev.filter(t => t !== value)
        : [...prev, value]
    );
  };

  const addActionItem = () => {
    setActionItems([...actionItems, { title: "", dueDate: "" }]);
  };

  const removeActionItem = (index: number) => {
    if (actionItems.length > 1) {
      setActionItems(actionItems.filter((_, i) => i !== index));
    }
  };

  const updateActionItem = (index: number, field: keyof ActionItem, value: string) => {
    const newActionItems = [...actionItems];
    newActionItems[index][field] = value;
    setActionItems(newActionItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTypes.length === 0) {
      toast.error("Please select at least one interaction type");
      return;
    }

    if (createActionItem) {
      for (const item of actionItems) {
        if (!item.title.trim()) {
          toast.error("Please enter a title for all action items");
          return;
        }
        if (!item.dueDate) {
          toast.error("Please select a due date for all action items");
          return;
        }
      }
    }

    setLoading(true);

    const title = selectedTypes
      .map(type => INTERACTION_TYPES.find(t => t.value === type)?.label)
      .filter(Boolean)
      .join(", ");

    // Insert activity note using crm_activities table
    const { error: activityError } = await supabase.from("crm_activities").insert({
      activity_type: "note",
      subject: title,
      body: description,
      contact_id: constituentId,
    });

    // If action items are checked, log them as additional activities
    if (!activityError && createActionItem) {
      const activitiesToInsert = actionItems.map(item => ({
        activity_type: "task",
        subject: item.title,
        body: description || null,
        scheduled_at: item.dueDate,
        contact_id: constituentId,
      }));

      const { error: taskError } = await supabase.from("crm_activities").insert(activitiesToInsert);

      if (taskError) {
        console.error("Failed to create action items:", taskError);
        toast.error("Note added but action item creation failed");
        setLoading(false);
        return;
      }
    }

    setLoading(false);

    if (activityError) {
      toast.error("Failed to add note");
    } else {
      const successMessage = createActionItem
        ? `Note and ${actionItems.length} action item(s) added successfully`
        : "Note added successfully";
      toast.success(successMessage);
      setSelectedTypes([]);
      setDescription("");
      setCreateActionItem(false);
      setActionItems([{ title: "", dueDate: "" }]);
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Interaction Note</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-3 block">Interaction Type *</Label>
            <div className="grid grid-cols-2 gap-3">
              {INTERACTION_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.value}
                    checked={selectedTypes.includes(type.value)}
                    onCheckedChange={() => toggleInteractionType(type.value)}
                  />
                  <Label
                    htmlFor={type.value}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Notes</Label>
            <Textarea
              id="description"
              placeholder="Details about this interaction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="actionItem"
              checked={createActionItem}
              onCheckedChange={(checked) => setCreateActionItem(checked as boolean)}
            />
            <Label
              htmlFor="actionItem"
              className="text-sm font-normal cursor-pointer"
            >
              Create action items
            </Label>
          </div>

          {createActionItem && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Action Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addActionItem}>
                  Add Another
                </Button>
              </div>

              {actionItems.map((item, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Action Item {index + 1}
                    </Label>
                    {actionItems.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeActionItem(index)} className="h-6 w-6 p-0">
                        ×
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Action item title *"
                    value={item.title}
                    onChange={(e) => updateActionItem(index, "title", e.target.value)}
                    required={createActionItem}
                  />
                  <Input
                    type="date"
                    value={item.dueDate}
                    onChange={(e) => updateActionItem(index, "dueDate", e.target.value)}
                    required={createActionItem}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Note
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityNoteForm;
