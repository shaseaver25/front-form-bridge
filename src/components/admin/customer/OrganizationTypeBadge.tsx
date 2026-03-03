import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, GraduationCap, Briefcase, AlertTriangle } from "lucide-react";
import { OrganizationType, ORGANIZATION_TYPE_META } from "@/lib/organizationTypePresets";

interface OrganizationTypeBadgeProps {
  organizationType: string;
  onTypeChange?: (newType: OrganizationType) => void;
  editable?: boolean;
}

const ICON_MAP = {
  nonprofit: Building2,
  education: GraduationCap,
  small_business: Briefcase,
};

const BADGE_COLORS: Record<string, string> = {
  nonprofit: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  education: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  small_business: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
};

export function OrganizationTypeBadge({
  organizationType,
  onTypeChange,
  editable = true,
}: OrganizationTypeBadgeProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<OrganizationType>(
    organizationType as OrganizationType
  );

  const type = organizationType as OrganizationType;
  const meta = ORGANIZATION_TYPE_META[type] || {
    label: organizationType,
    icon: "Building2",
    description: "",
  };
  const Icon = ICON_MAP[type] || Building2;
  const badgeColor = BADGE_COLORS[type] || "bg-gray-100 text-gray-800";

  const handleConfirm = () => {
    if (onTypeChange && selectedType !== type) {
      onTypeChange(selectedType);
    }
    setDialogOpen(false);
  };

  return (
    <>
      <Badge
        className={`${badgeColor} cursor-pointer flex items-center gap-1.5 px-3 py-1 text-sm font-medium transition-colors`}
        onClick={() => editable && setDialogOpen(true)}
      >
        <Icon className="w-4 h-4" />
        {meta.label}
      </Badge>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Organization Type</DialogTitle>
            <DialogDescription>
              Changing the organization type will affect recommended features and terminology.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will change which features are recommended but won't automatically enable or disable any features.
                Use "Quick Configure" to apply type-specific defaults.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium">Organization Type</label>
              <Select
                value={selectedType}
                onValueChange={(v) => setSelectedType(v as OrganizationType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ORGANIZATION_TYPE_META).map(([key, value]) => {
                    const TypeIcon = ICON_MAP[key as OrganizationType];
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4" />
                          <span>{value.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedType && ORGANIZATION_TYPE_META[selectedType] && (
                <p className="text-sm text-muted-foreground">
                  {ORGANIZATION_TYPE_META[selectedType].description}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={selectedType === type}>
              Change Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
