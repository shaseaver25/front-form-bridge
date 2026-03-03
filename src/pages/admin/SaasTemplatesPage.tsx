import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutTemplate, Plus, Copy, Pencil } from "lucide-react";
import { useSaasTemplates, SaasOrganizationTemplate } from "@/hooks/useSaasTemplates";
import { TemplateDetailSheet } from "@/components/admin/templates/TemplateDetailSheet";

const ORG_TYPE_LABELS: Record<string, string> = {
  nonprofit: "Nonprofit",
  education: "Education",
  small_business: "Small Business",
};

export default function SaasTemplatesPage() {
  const { data: templates, isLoading } = useSaasTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<SaasOrganizationTemplate | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleEdit = (template: SaasOrganizationTemplate) => {
    setSelectedTemplate(template);
    setSheetOpen(true);
  };

  // Group templates by organization type
  const templatesByType = templates.reduce((acc, template) => {
    const type = template.organization_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(template);
    return acc;
  }, {} as Record<string, SaasOrganizationTemplate[]>);

  const countEnabledFeatures = (features: Record<string, boolean>) => {
    return Object.values(features).filter(Boolean).length;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Organization Templates</h1>
              <p className="text-muted-foreground">
                Pre-configured setups for different organization types
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organization Templates</h1>
            <p className="text-muted-foreground">
              Pre-configured setups for different organization types
            </p>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </div>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <LayoutTemplate className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Templates</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                No organization templates have been created yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(templatesByType).map(([type, typeTemplates]) => (
              <div key={type}>
                <h2 className="text-lg font-semibold mb-4">
                  {ORG_TYPE_LABELS[type] || type}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {typeTemplates.map((template) => (
                    <Card key={template.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant={template.is_active ? "default" : "secondary"}>
                            {template.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {template.description || "No description"}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {countEnabledFeatures(template.default_features)} features enabled
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" disabled>
                              <Copy className="h-4 w-4 mr-1" />
                              Duplicate
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TemplateDetailSheet
        template={selectedTemplate}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </Layout>
  );
}
