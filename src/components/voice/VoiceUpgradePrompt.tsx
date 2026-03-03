import { Mic, Clock, Users, Brain, Wifi, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VoiceUpgradePromptProps {
  variant?: "full" | "compact";
}

export function VoiceUpgradePrompt({ variant = "full" }: VoiceUpgradePromptProps) {
  const benefits = [
    {
      icon: Clock,
      title: "Record notes right after meetings",
      description: "Never forget a detail - capture while it's fresh",
    },
    {
      icon: Users,
      title: "Automatically create or update contacts",
      description: "AI extracts names, titles, and organizations",
    },
    {
      icon: Brain,
      title: "AI extracts follow-up tasks",
      description: "Next steps appear on your personal dashboard",
    },
    {
      icon: Sparkles,
      title: "Grant manager sees all activity",
      description: "Complete visibility into networking efforts",
    },
    {
      icon: Wifi,
      title: "Works offline, syncs when connected",
      description: "Perfect for conferences and events",
    },
  ];

  if (variant === "compact") {
    return (
      <Card className="border-dashed border-2 border-primary bg-primary/5">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#FF6B35] flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground">Voice Notes for Networking</h4>
              <Badge variant="secondary" className="bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90">
                Pro
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Capture contacts and follow-ups hands-free
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
            background: "linear-gradient(90deg, #FF6B35 0%, #14919B 50%, #0D7377 100%)" 
          }}
        />
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF8B5A] flex items-center justify-center mx-auto mb-4">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <CardTitle className="text-2xl">Voice Notes for Networking</CardTitle>
            <Badge className="bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90">
              Pro Feature
            </Badge>
          </div>
          <CardDescription className="text-lg">
            Capture contacts and follow-ups hands-free
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="flex gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center shrink-0">
                  <benefit.icon className="w-5 h-5 text-[#FF6B35]" />
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
              <Sparkles className="w-4 h-4 text-[#FF6B35]" />
              <span>Contact your administrator to enable this feature</span>
            </div>
            <Button 
              variant="outline" 
              className="border-[#FF6B35] text-[#FF6B35] hover:bg-[#FF6B35] hover:text-white"
            >
              Request Access
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
