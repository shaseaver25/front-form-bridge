import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Kanban, Link, Sparkles, Clock, Users, Zap, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const benefits = [
  {
    icon: Kanban,
    text: "Kanban boards to visualize work in progress",
  },
  {
    icon: Link,
    text: "Link tasks to grants, donors, and campaigns",
  },
  {
    icon: Sparkles,
    text: "AI-powered task suggestions and time estimates",
  },
  {
    icon: Clock,
    text: "Track time spent on grant applications",
  },
  {
    icon: Users,
    text: "Team collaboration with assignments and comments",
  },
  {
    icon: Zap,
    text: "Automations to streamline workflows",
  },
];

export function BoardsUpgradePrompt() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full border-2 border-dashed">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Kanban className="w-8 h-8 text-primary" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <CardTitle className="text-2xl">Project Boards</CardTitle>
            <Badge className="bg-[#FF6B35] text-white">Pro</Badge>
          </div>
          <CardDescription className="text-base">
            Visual project management for your team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-3">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground pt-1.5">
                  {benefit.text}
                </span>
              </li>
            ))}
          </ul>

          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Contact your administrator to enable this feature
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
