import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NewCustomerWizardState } from "@/types/saas-wizard";
import { useSaasTemplates } from "@/hooks/useSaasTemplates";
import { cn } from "@/lib/utils";
import { Loader2, Check, FileQuestion } from "lucide-react";

interface StepTemplateProps {
  data: NewCustomerWizardState;
  onUpdate: (updates: Partial<NewCustomerWizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepTemplate({ data, onUpdate, onNext, onBack }: StepTemplateProps) {
  const { data: templates, isLoading } = useSaasTemplates(data.organization_type || undefined);

  const handleSelectTemplate = (templateId: string) => {
    onUpdate({ template_id: templateId });
  };

  const canProceed = templates.length === 0 || !!data.template_id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Select a Template</h2>
        <p className="text-muted-foreground text-sm">
          Choose a starting configuration for this {data.organization_type?.replace("_", " ")} organization.
        </p>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No matching templates</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              There are no templates configured for {data.organization_type?.replace("_", " ")} organizations.
              You can continue without a template and configure features manually.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => {
            const isSelected = data.template_id === template.id;
            return (
              <Card
                key={template.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  isSelected
                    ? "ring-2 ring-primary border-primary"
                    : "hover:border-muted-foreground/50"
                )}
                onClick={() => handleSelectTemplate(template.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {template.description || "No description available"}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-3">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          Next
        </Button>
      </div>
    </div>
  );
}
