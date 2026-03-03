import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useCallback } from "react";
import { WizardProgress } from "@/components/admin/wizard/WizardProgress";
import { StepBasics } from "@/components/admin/wizard/StepBasics";
import { StepTemplate } from "@/components/admin/wizard/StepTemplate";
import { StepSubscription } from "@/components/admin/wizard/StepSubscription";
import { NewCustomerWizardState, initialWizardState } from "@/types/saas-wizard";

export default function SaasCustomerNewPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<NewCustomerWizardState>(initialWizardState);

  const updateWizardData = useCallback((updates: Partial<NewCustomerWizardState>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepBasics
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <StepTemplate
            data={wizardData}
            onUpdate={updateWizardData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <StepSubscription
            data={wizardData}
            onUpdate={updateWizardData}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/customers">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Customer</h1>
            <p className="text-muted-foreground">
              Configure a new TailoredU customer instance
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <WizardProgress currentStep={currentStep} />
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
