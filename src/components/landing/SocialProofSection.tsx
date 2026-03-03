import { Card, CardContent } from "@/components/ui/card";
import { Search, CheckCircle2 } from "lucide-react";

const SocialProofSection = () => {
  return (
    <section className="py-20 md:py-24 px-4 bg-background">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
          Built for Executive Search
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Purpose-built with real-world retained search workflows in mind.
        </p>

        <Card className="card-hover">
          <CardContent className="py-8 md:py-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="text-left">
                <div className="font-bold text-foreground">AvidEdge Search</div>
                <div className="text-sm text-muted-foreground">Technology Executive Search</div>
              </div>
            </div>
            <blockquote className="text-lg md:text-xl text-muted-foreground italic mb-6">
              "We don't just find tech leaders. We find the right ones for your business — whether you need a Technology Leader in a non-technology business or a Functional Leader in a tech-enabled company."
            </blockquote>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              {["Retained executive search", "90-day onboarding support", "Advisory services"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  {item}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default SocialProofSection;
