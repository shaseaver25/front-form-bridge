import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { SaasOrganizationTemplate } from "@/hooks/useSaasTemplates";
import { useSaasFeatureDefinitions } from "@/hooks/useSaasFeatureDefinitions";
import { useUpdateSaasTemplate } from "@/hooks/useUpdateSaasTemplate";
import { ConfirmDeactivateTemplateDialog } from "../ConfirmDeactivateTemplateDialog";

interface TemplateDetailSheetProps {
  template: SaasOrganizationTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TERMINOLOGY_FIELDS = [
  { key: "constituent_label", label: "Constituent Label", placeholder: "e.g., Donor, Student, Customer" },
  { key: "organization_label", label: "Organization Label", placeholder: "e.g., Organization, School, Company" },
  { key: "pipeline_label", label: "Pipeline Label", placeholder: "e.g., Pipeline, Workflow, Process" },
  { key: "opportunity_label", label: "Opportunity Label", placeholder: "e.g., Opportunity, Application, Deal" },
  { key: "site_label", label: "Site Label", placeholder: "e.g., Site, Campus, Location" },
];

const STAGE_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#ef4444", "#f97316", "#eab308", "#84cc16",
  "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6",
];

export function TemplateDetailSheet({ template, open, onOpenChange }: TemplateDetailSheetProps) {
  const { data: featureDefinitions } = useSaasFeatureDefinitions();
  const updateTemplate = useUpdateSaasTemplate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [terminology, setTerminology] = useState<Record<string, string>>({});
  const [pipelineStages, setPipelineStages] = useState<Array<{ name: string; color: string; order: number }>>([]);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [pendingActiveState, setPendingActiveState] = useState<boolean | null>(null);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      setDisplayOrder(template.display_order || 0);
      setIsActive(template.is_active ?? true);
      setFeatures(template.default_features || {});
      setTerminology(template.default_terminology || {});
      setPipelineStages(template.default_pipeline_stages || []);
    }
  }, [template]);

  const handleSave = () => {
    if (!template) return;

    updateTemplate.mutate(
      {
        id: template.id,
        templateName: template.name,
        data: {
          name,
          description: description || null,
          display_order: displayOrder,
          is_active: isActive,
          default_features: features,
          default_terminology: terminology,
          default_pipeline_stages: pipelineStages,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  const handleActiveToggle = (checked: boolean) => {
    if (!checked && isActive) {
      // Trying to deactivate - show confirmation
      setPendingActiveState(false);
      setShowDeactivateConfirm(true);
    } else {
      setIsActive(checked);
    }
  };

  const confirmDeactivate = () => {
    setIsActive(false);
    setShowDeactivateConfirm(false);
    setPendingActiveState(null);
  };

  const toggleFeature = (key: string) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateTerminology = (key: string, value: string) => {
    setTerminology((prev) => ({ ...prev, [key]: value }));
  };

  const addStage = () => {
    setPipelineStages((prev) => [
      ...prev,
      { name: "New Stage", color: STAGE_COLORS[prev.length % STAGE_COLORS.length], order: prev.length },
    ]);
  };

  const updateStage = (index: number, field: "name" | "color", value: string) => {
    setPipelineStages((prev) =>
      prev.map((stage, i) => (i === index ? { ...stage, [field]: value } : stage))
    );
  };

  const removeStage = (index: number) => {
    setPipelineStages((prev) =>
      prev.filter((_, i) => i !== index).map((stage, i) => ({ ...stage, order: i }))
    );
  };

  // Group features by category
  const featuresByCategory = featureDefinitions.reduce((acc, feature) => {
    const category = feature.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, typeof featureDefinitions>);

  const categoryLabels: Record<string, string> = {
    core: "Core Features",
    fundraising: "Fundraising",
    operations: "Operations",
    enterprise: "Enterprise",
    integrations: "Integrations",
    other: "Other",
  };

  if (!template) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>Edit Template</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgType">Organization Type</Label>
                    <Input
                      id="orgType"
                      value={template.organization_type}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayOrder">Display Order</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active</Label>
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={handleActiveToggle}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Default Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Default Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(featuresByCategory).map(([category, categoryFeatures]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      {categoryLabels[category] || category}
                    </h4>
                    <div className="space-y-2">
                      {categoryFeatures.map((feature) => (
                        <div
                          key={feature.key}
                          className="flex items-center justify-between py-1"
                        >
                          <div className="flex-1">
                            <span className="text-sm">{feature.name}</span>
                            {feature.description && (
                              <p className="text-xs text-muted-foreground">
                                {feature.description}
                              </p>
                            )}
                          </div>
                          <Switch
                            checked={features[feature.key] ?? false}
                            onCheckedChange={() => toggleFeature(feature.key)}
                          />
                        </div>
                      ))}
                    </div>
                    <Separator className="mt-3" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Default Terminology */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Default Terminology</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {TERMINOLOGY_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Input
                      id={field.key}
                      value={terminology[field.key] || ""}
                      onChange={(e) => updateTerminology(field.key, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Default Pipeline Stages */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Default Pipeline Stages</CardTitle>
                <Button variant="outline" size="sm" onClick={addStage}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Stage
                </Button>
              </CardHeader>
              <CardContent>
                {pipelineStages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pipeline stages defined
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pipelineStages.map((stage, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 border rounded-md bg-muted/30"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Input
                          value={stage.name}
                          onChange={(e) => updateStage(index, "name", e.target.value)}
                          className="flex-1"
                        />
                        <input
                          type="color"
                          value={stage.color}
                          onChange={(e) => updateStage(index, "color", e.target.value)}
                          className="w-10 h-8 rounded cursor-pointer border-0"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStage(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <SheetFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateTemplate.isPending}>
            {updateTemplate.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>

      <ConfirmDeactivateTemplateDialog
        open={showDeactivateConfirm}
        onOpenChange={setShowDeactivateConfirm}
        onConfirm={confirmDeactivate}
        templateName={template?.name || ""}
      />
    </Sheet>
  );
}
