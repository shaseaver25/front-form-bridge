import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Building2, GraduationCap, Briefcase, Check, X, Loader2 } from "lucide-react";
import {
  OrganizationType,
  ORGANIZATION_TYPE_META,
  TERMINOLOGY_PRESETS,
  DEFAULT_ENABLED_FEATURES,
} from "@/lib/organizationTypePresets";
import { SaasFeatureDefinition } from "@/hooks/useSaasFeatureDefinitions";

interface QuickConfigureDropdownProps {
  currentType: OrganizationType;
  features: SaasFeatureDefinition[];
  currentEnabledFeatures: string[];
  onApplyPreset: (
    type: OrganizationType,
    terminology: Record<string, string>,
    featuresToEnable: string[],
    featuresToDisable: string[]
  ) => Promise<void>;
  isApplying?: boolean;
}

const ICON_MAP = {
  nonprofit: Building2,
  education: GraduationCap,
  small_business: Briefcase,
};

export function QuickConfigureDropdown({
  currentType,
  features,
  currentEnabledFeatures,
  onApplyPreset,
  isApplying = false,
}: QuickConfigureDropdownProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<OrganizationType | null>(null);

  const handleSelectPreset = (type: OrganizationType) => {
    setSelectedPreset(type);
    setDialogOpen(true);
  };

  const getChanges = (type: OrganizationType) => {
    const terminology = TERMINOLOGY_PRESETS[type];
    const defaultFeatures = DEFAULT_ENABLED_FEATURES[type];

    const featuresToEnable = defaultFeatures.filter((f) => !currentEnabledFeatures.includes(f));
    const featuresToDisable = currentEnabledFeatures.filter((f) => !defaultFeatures.includes(f));

    return { terminology, featuresToEnable, featuresToDisable };
  };

  const handleApply = async () => {
    if (!selectedPreset) return;

    const { terminology, featuresToEnable, featuresToDisable } = getChanges(selectedPreset);
    const terminologyRecord: Record<string, string> = { ...terminology };
    await onApplyPreset(selectedPreset, terminologyRecord, featuresToEnable, featuresToDisable);
    setDialogOpen(false);
    setSelectedPreset(null);
  };

  const renderPreview = () => {
    if (!selectedPreset) return null;

    const { terminology, featuresToEnable, featuresToDisable } = getChanges(selectedPreset);
    const featureMap = new Map(features.map((f) => [f.key, f.name]));

    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Terminology Changes</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(terminology).map(([key, value]) => (
              <div key={key} className="flex justify-between bg-muted p-2 rounded">
                <span className="text-muted-foreground capitalize">
                  {key.replace(/_/g, " ")}:
                </span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {featuresToEnable.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Check className="w-4 h-4 text-green-600" />
              Features to Enable ({featuresToEnable.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {featuresToEnable.map((key) => (
                <Badge key={key} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {featureMap.get(key) || key}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {featuresToDisable.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <X className="w-4 h-4 text-red-600" />
              Features to Disable ({featuresToDisable.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {featuresToDisable.map((key) => (
                <Badge key={key} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {featureMap.get(key) || key}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {featuresToEnable.length === 0 && featuresToDisable.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No feature changes needed - current configuration matches the preset.
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isApplying}>
            {isApplying ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ChevronDown className="w-4 h-4 mr-2" />
            )}
            Quick Configure
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Apply Preset Configuration</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(ORGANIZATION_TYPE_META).map(([key, value]) => {
            const Icon = ICON_MAP[key as OrganizationType];
            const isCurrentType = key === currentType;
            return (
              <DropdownMenuItem
                key={key}
                onClick={() => handleSelectPreset(key as OrganizationType)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                <span>Apply {value.label} Defaults</span>
                {isCurrentType && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Current
                  </Badge>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Apply {selectedPreset && ORGANIZATION_TYPE_META[selectedPreset]?.label} Configuration
            </DialogTitle>
            <DialogDescription>
              Review the changes that will be applied to this customer's configuration.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px] pr-4">
            {renderPreview()}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isApplying}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={isApplying}>
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                "Apply & Sync"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
