import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Building2, Briefcase, AlertTriangle, Check, Info } from "lucide-react";
import { useCurrentOrganizationType, useUpdateOrganizationType } from "@/hooks/useOrganizationType";
import { organizationTypeOptions, type OrganizationType } from "@/types/priority-types";

export function OrganizationTypeSettings() {
  const { data: org, isLoading } = useCurrentOrganizationType();
  const updateOrgType = useUpdateOrganizationType();
  const [selected, setSelected] = useState<OrganizationType>("nonprofit");
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (org?.priority_algorithm_type) {
      setSelected(org.priority_algorithm_type);
    }
  }, [org]);

  const handleSave = () => {
    if (!org?.id) return;
    if (selected !== org.priority_algorithm_type) {
      setShowWarning(true);
    } else {
      updateOrgType.mutate({ orgId: org.id, priority_algorithm_type: selected });
    }
  };

  const confirmChange = () => {
    if (!org?.id) return;
    updateOrgType.mutate({ orgId: org.id, priority_algorithm_type: selected });
    setShowWarning(false);
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle>Priority Algorithm</CardTitle>
        </div>
        <CardDescription>
          Choose the task prioritization algorithm based on your organization type
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Current: <Badge variant="outline" className="ml-1">{org?.priority_algorithm_type || "Not set"}</Badge></span>
        </div>

        <RadioGroup value={selected} onValueChange={(v) => setSelected(v as OrganizationType)} className="space-y-4">
          {organizationTypeOptions.map((option) => (
            <div key={option.value} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
              <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  {option.value === "nonprofit" ? (
                    <Building2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Briefcase className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="font-medium">{option.label}</span>
                  {org?.priority_algorithm_type === option.value && (
                    <Badge variant="secondary" className="text-xs"><Check className="h-3 w-3 mr-1" />Current</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </Label>
            </div>
          ))}
        </RadioGroup>

        {showWarning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              Changing the organization type will affect how all task priorities are calculated. 
              Existing priority scores will be recalculated.
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="destructive" onClick={confirmChange} disabled={updateOrgType.isPending}>
                  {updateOrgType.isPending ? "Saving..." : "Confirm Change"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowWarning(false)}>
                  Cancel
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!showWarning && (
          <Button onClick={handleSave} disabled={updateOrgType.isPending || selected === org?.priority_algorithm_type}>
            {updateOrgType.isPending ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
