import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, GripVertical } from "lucide-react";


export interface FieldSetting {
  show: boolean;
  required: boolean;
}

export interface FormFieldSettings {
  phone: FieldSetting;
  company: FieldSetting;
  job_title: FieldSetting;
  skills: FieldSetting;
  availability_notes: FieldSetting;
  emergency_contact: FieldSetting;
  shirt_size: FieldSetting;
  dietary_restrictions: FieldSetting;
  referral_source: FieldSetting;
  waiver: FieldSetting;
}

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "radio";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export const defaultFormFieldSettings: FormFieldSettings = {
  phone: { show: true, required: true },
  company: { show: true, required: true },
  job_title: { show: true, required: true },
  skills: { show: true, required: false },
  availability_notes: { show: true, required: false },
  emergency_contact: { show: true, required: true },
  shirt_size: { show: true, required: false },
  dietary_restrictions: { show: true, required: false },
  referral_source: { show: true, required: false },
  waiver: { show: true, required: true },
};

interface FormFieldSettingsProps {
  settings: FormFieldSettings;
  onSettingsChange: (settings: FormFieldSettings) => void;
  customFields: CustomField[];
  onCustomFieldsChange: (fields: CustomField[]) => void;
  waiverText: string;
  onWaiverTextChange: (text: string) => void;
}

const fieldLabels: Record<keyof FormFieldSettings, string> = {
  phone: "Phone Number",
  company: "Company",
  job_title: "Job Title",
  skills: "Skills Selection",
  availability_notes: "Availability Notes",
  emergency_contact: "Emergency Contact",
  shirt_size: "T-Shirt Size",
  dietary_restrictions: "Dietary Restrictions",
  referral_source: "How did you hear about us?",
  waiver: "Waiver Agreement",
};

const fieldGroups = [
  {
    title: "Contact Information",
    fields: ["phone"] as (keyof FormFieldSettings)[],
  },
  {
    title: "Professional Information",
    fields: ["company", "job_title"] as (keyof FormFieldSettings)[],
  },
  {
    title: "Additional Details",
    fields: [
      "skills",
      "availability_notes",
      "shirt_size",
      "dietary_restrictions",
      "referral_source",
    ] as (keyof FormFieldSettings)[],
  },
  {
    title: "Safety & Legal",
    fields: ["emergency_contact", "waiver"] as (keyof FormFieldSettings)[],
  },
];

export function FormFieldSettingsPanel({
  settings,
  onSettingsChange,
  customFields,
  onCustomFieldsChange,
  waiverText,
  onWaiverTextChange,
}: FormFieldSettingsProps) {
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<CustomField["type"]>("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState("");

  const updateField = (
    fieldKey: keyof FormFieldSettings,
    property: keyof FieldSetting,
    value: boolean
  ) => {
    const newSettings = {
      ...settings,
      [fieldKey]: {
        ...settings[fieldKey],
        [property]: value,
      },
    };
    
    // If hiding a field, it can't be required
    if (property === "show" && !value) {
      newSettings[fieldKey].required = false;
    }
    
    onSettingsChange(newSettings);
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;

    const newField: CustomField = {
      id: crypto.randomUUID(),
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
      options:
        newFieldType === "select" || newFieldType === "radio"
          ? newFieldOptions.split(",").map((o) => o.trim()).filter(Boolean)
          : undefined,
      placeholder: "",
    };

    onCustomFieldsChange([...customFields, newField]);
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldRequired(false);
    setNewFieldOptions("");
  };

  const removeCustomField = (id: string) => {
    onCustomFieldsChange(customFields.filter((f) => f.id !== id));
  };

  const updateCustomField = (id: string, updates: Partial<CustomField>) => {
    onCustomFieldsChange(
      customFields.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  return (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={["built-in", "custom", "waiver"]} className="w-full">
        {/* Built-in Fields */}
        <AccordionItem value="built-in">
          <AccordionTrigger className="text-sm font-medium">
            Built-in Form Fields
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {fieldGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {group.title}
                  </p>
                  {group.fields.map((fieldKey) => (
                    <div
                      key={fieldKey}
                      className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={settings[fieldKey].show}
                          onCheckedChange={(checked) =>
                            updateField(fieldKey, "show", checked)
                          }
                        />
                        <span className="text-sm">{fieldLabels[fieldKey]}</span>
                      </div>
                      {settings[fieldKey].show && (
                        <Select
                          value={settings[fieldKey].required ? "required" : "optional"}
                          onValueChange={(value) =>
                            updateField(fieldKey, "required", value === "required")
                          }
                        >
                          <SelectTrigger className="w-[110px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="required">Required</SelectItem>
                            <SelectItem value="optional">Optional</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Custom Fields */}
        <AccordionItem value="custom">
          <AccordionTrigger className="text-sm font-medium">
            Custom Questions ({customFields.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {/* Existing custom fields */}
              {customFields.map((field) => (
                <div
                  key={field.id}
                  className="p-3 rounded-md border bg-card space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <Input
                        value={field.label}
                        onChange={(e) =>
                          updateCustomField(field.id, { label: e.target.value })
                        }
                        className="flex-1"
                        placeholder="Question label"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomField(field.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 pl-6">
                    <Select
                      value={field.type}
                      onValueChange={(value: CustomField["type"]) =>
                        updateCustomField(field.id, { type: value })
                      }
                    >
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="textarea">Text Area</SelectItem>
                        <SelectItem value="select">Dropdown</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                        <SelectItem value="radio">Radio</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={field.required ? "required" : "optional"}
                      onValueChange={(value) =>
                        updateCustomField(field.id, {
                          required: value === "required",
                        })
                      }
                    >
                      <SelectTrigger className="w-[110px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="required">Required</SelectItem>
                        <SelectItem value="optional">Optional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(field.type === "select" || field.type === "radio") && (
                    <div className="pl-6">
                      <Input
                        value={field.options?.join(", ") || ""}
                        onChange={(e) =>
                          updateCustomField(field.id, {
                            options: e.target.value
                              .split(",")
                              .map((o) => o.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="Options (comma-separated): Yes, No, Maybe"
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Add new field */}
              <div className="p-3 rounded-md border border-dashed space-y-3">
                <p className="text-sm font-medium">Add Custom Question</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="Question label"
                    className="col-span-2"
                  />
                  <Select
                    value={newFieldType}
                    onValueChange={(value: CustomField["type"]) =>
                      setNewFieldType(value)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="textarea">Text Area</SelectItem>
                      <SelectItem value="select">Dropdown</SelectItem>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="radio">Radio</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={newFieldRequired ? "required" : "optional"}
                    onValueChange={(value) =>
                      setNewFieldRequired(value === "required")
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="required">Required</SelectItem>
                      <SelectItem value="optional">Optional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(newFieldType === "select" || newFieldType === "radio") && (
                  <Input
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    placeholder="Options (comma-separated): Yes, No, Maybe"
                  />
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomField}
                  disabled={!newFieldLabel.trim()}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Waiver Text */}
        <AccordionItem value="waiver">
          <AccordionTrigger className="text-sm font-medium">
            Custom Waiver Text
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Leave blank to use the default waiver text
              </Label>
              <Textarea
                value={waiverText}
                onChange={(e) => onWaiverTextChange(e.target.value)}
                placeholder="I agree to volunteer at this event and acknowledge the inherent risks involved. I release the organization from any liability..."
                rows={4}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
