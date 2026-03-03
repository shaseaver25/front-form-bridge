import { TrendingDown, BarChart3, Zap, Bell, RefreshCw, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BurndownUpgradePromptProps {
  variant?: "full" | "compact";
}

export function BurndownUpgradePrompt({ variant = "full" }: BurndownUpgradePromptProps) {
  const benefits = [
    {
      icon: BarChart3,
      title: "Visual burndown projections",
      description: "See your cash runway over 24 months with interactive charts",
    },
    {
      icon: RefreshCw,
      title: "Auto-sync from CRM & QuickBooks",
      description: "Donations, grants, and expenses flow in automatically",
    },
    {
      icon: Layers,
      title: "What-if scenario planning",
      description: "Model different funding scenarios and their impact",
    },
    {
      icon: Bell,
      title: "Low runway alerts",
      description: "Get notified when cash reserves hit critical thresholds",
    },
  ];

  if (variant === "compact") {
    return (
      <Card className="border-dashed border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)]">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#0D7377] flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground">Financial Runway Calculator</h4>
              <Badge variant="secondary" className="bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90">
                Pro
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Know exactly when you'll run out of funds
            </p>
          </div>
          <Button variant="outline" size="sm">
            Learn More
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="overflow-hidden">
        <div 
          className="h-2"
          style={{ 
            background: "linear-gradient(90deg, #0D7377 0%, #14919B 50%, #FF6B35 100%)" 
          }}
        />
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0D7377] to-[#14919B] flex items-center justify-center mx-auto mb-4">
            <TrendingDown className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <CardTitle className="text-2xl">Financial Runway Calculator</CardTitle>
            <Badge className="bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90">
              Pro Feature
            </Badge>
          </div>
          <CardDescription className="text-lg">
            Know exactly when you'll run out of funds
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#14919B]/10 flex items-center justify-center shrink-0">
                  <benefit.icon className="w-5 h-5 text-[#14919B]" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-4 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <Zap className="w-4 h-4 text-[#FF6B35]" />
              <span>Contact your administrator to enable this feature</span>
            </div>
            <Button 
              variant="outline" 
              className="border-[#0D7377] text-[#0D7377] hover:bg-[#0D7377] hover:text-white"
            >
              Request Access
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
