import { Card, CardContent } from "@/components/ui/card";
import { Target, Shield, Sparkles } from "lucide-react";

const ValuePropositionSection = () => {
  return (
    <section className="py-20 md:py-24 px-4 bg-muted">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 text-foreground">
          Discovery-Driven Search
        </h2>
        <p className="text-lg md:text-xl text-center text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto">
          Deep discovery of your business, strategy, culture, and leadership fit — before and beyond your search.
        </p>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Strategic Alignment</h3>
              <p className="text-muted-foreground">
                We immerse ourselves in your strategy, culture, and business priorities to find leaders who truly fit.
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">AvidEdge Match™</h3>
              <p className="text-muted-foreground">
                Exclusive 90-day executive coaching service to help new leaders and your business realize enduring success.
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Advisory Services</h3>
              <p className="text-muted-foreground">
                Meeting you where you are, helping you meet your future with fractional CTO, IT assessments, and more.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ValuePropositionSection;
