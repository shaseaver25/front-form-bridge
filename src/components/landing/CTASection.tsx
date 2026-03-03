import { Button } from "@/components/ui/button";
import { ArrowRight, Mail } from "lucide-react";

const CTASection = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <section id="contact" className="py-20 md:py-24 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/5">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
          Ready to Transform Your Search Practice?
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join firms that have unified their candidate pipeline, client relationships, and placements in one platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={onGetStarted} className="text-lg px-8 gap-2">
            Get Started <ArrowRight className="w-5 h-5" />
          </Button>
          <Button size="lg" variant="outline" asChild className="text-lg px-8">
            <a href="mailto:shannon@tailoredu.org">
              <Mail className="w-5 h-5 mr-2" />
              Contact Us
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
