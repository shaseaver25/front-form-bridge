import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { WIZARD_STEPS } from "@/types/saas-wizard";

interface WizardProgressProps {
  currentStep: number;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;

          return (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors",
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCurrent
                      ? "border-primary text-primary bg-primary/10"
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < WIZARD_STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 mt-[-24px]",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
