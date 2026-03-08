import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Save, RotateCcw, Info, Building2, GraduationCap, Briefcase } from "lucide-react";
import { SaasOrganization } from "@/hooks/useSaasOrganizations";
import {
  OrganizationType,
  TERMINOLOGY_PRESETS,
  ORGANIZATION_TYPE_META,
} from "@/lib/organizationTypePresets";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CustomerTerminologyTabProps {
  organization: SaasOrganization;
}

interface TerminologyEntry {
  id?: string;
  term_key: string;
  term_value: string;
}

const TERM_KEYS = [
  { key: "constituent_label", label: "Contact Label", description: "What to call individual contacts" },
  { key: "organization_label", label: "Company Label", description: "What to call companies/orgs" },
  { key: "pipeline_label", label: "Pipeline Label", description: "The main pipeline name" },
  { key: "opportunity_label", label: "Opportunity Label", description: "What to call pipeline items" },
  { key: "account_label", label: "Account Label", description: "What to call account records" },
  { key: "site_label", label: "Company Label", description: "What to call company locations" },
];

const ICON_MAP = {
  nonprofit: Building2,
  education: GraduationCap,
  small_business: Briefcase,
};

export function CustomerTerminologyTab({ organization }: CustomerTerminologyTabProps) {
  const queryClient = useQueryClient();
  const [terminology, setTerminology] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const orgType = organization.organization_type as OrganizationType;

  // Fetch current terminology
  const { data: currentTerminology, isLoading } = useQuery({
    queryKey: ["saas-organization-terminology", organization.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saas_organization_terminology")
        .select("*")
        .eq("organization_id", organization.id);

      if (error) throw error;
      return data as TerminologyEntry[];
    },
  });

  // Initialize terminology state
  useEffect(() => {
    if (currentTerminology) {
      const termMap: Record<string, string> = {};
      currentTerminology.forEach((t) => {
        termMap[t.term_key] = t.term_value;
      });
      // Fill in defaults from preset if not set
      const preset = TERMINOLOGY_PRESETS[orgType];
      if (preset) {
        TERM_KEYS.forEach(({ key }) => {
          if (!termMap[key] && preset[key as keyof typeof preset]) {
            termMap[key] = preset[key as keyof typeof preset];
          }
        });
      }
      setTerminology(termMap);
    }
  }, [currentTerminology, orgType]);

  // Save terminology mutation
  const saveMutation = useMutation({
    mutationFn: async (terms: Record<string, string>) => {
      // Delete existing and insert new
      await supabase
        .from("saas_organization_terminology")
        .delete()
        .eq("organization_id", organization.id);

      const entries = Object.entries(terms).map(([term_key, term_value]) => ({
        organization_id: organization.id,
        term_key,
        term_value,
      }));

      const { error } = await supabase
        .from("saas_organization_terminology")
        .insert(entries);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saas-organization-terminology", organization.id] });
      setHasChanges(false);
      toast.success("Terminology saved. Click 'Sync Config' to apply changes.");
    },
    onError: (error) => {
      console.error("Failed to save terminology:", error);
      toast.error("Failed to save terminology");
    },
  });

  const handleChange = (key: string, value: string) => {
    setTerminology((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleApplyPreset = (type: OrganizationType) => {
    const preset = TERMINOLOGY_PRESETS[type];
    if (preset) {
      setTerminology({ ...preset });
      setHasChanges(true);
      toast.info(`Applied ${ORGANIZATION_TYPE_META[type].label} preset`);
    }
  };

  const handleSave = () => {
    saveMutation.mutate(terminology);
  };

  const handleReset = () => {
    if (currentTerminology) {
      const termMap: Record<string, string> = {};
      currentTerminology.forEach((t) => {
        termMap[t.term_key] = t.term_value;
      });
      setTerminology(termMap);
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preset Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Terminology Presets</CardTitle>
          <CardDescription>
            Apply a preset based on organization type or customize individually below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(ORGANIZATION_TYPE_META).map(([key, meta]) => {
              const Icon = ICON_MAP[key as OrganizationType];
              const isCurrentType = key === orgType;
              return (
                <Button
                  key={key}
                  variant={isCurrentType ? "default" : "outline"}
                  onClick={() => handleApplyPreset(key as OrganizationType)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {meta.label}
                  {isCurrentType && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      Recommended
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Custom Terminology */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custom Terminology</CardTitle>
          <CardDescription>
            Customize the labels used throughout the customer's CRM instance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TERM_KEYS.map(({ key, label, description }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  value={terminology[key] || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={description}
                />
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={!hasChanges || saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Terminology
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="ml-2">
          After saving terminology changes, click "Sync Config" to push changes to the customer's instance.
        </AlertDescription>
      </Alert>
    </div>
  );
}
