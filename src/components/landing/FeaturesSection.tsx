import { Card, CardContent } from "@/components/ui/card";
import { Users, Briefcase, Sparkles, BarChart3, Building2, Link2 } from "lucide-react";

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 md:py-24 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 text-foreground">
          Your Expertise, Amplified
        </h2>
        <p className="text-lg md:text-xl text-center text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto">
          Tools built for retained executive search firms.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[
            { icon: Users, title: "Candidate Pipeline", desc: "Track candidates from sourcing through placement. Manage relationships, notes, and pipeline stages.", color: "primary" },
            { icon: Briefcase, title: "Job & Placement Tracking", desc: "Manage active searches, job requirements, compensation details, and placement outcomes.", color: "primary" },
            { icon: Sparkles, title: "AI-Powered Matching", desc: "Semantic search to find the right candidates. Our AI understands skills, experience, and cultural fit.", color: "accent" },
            { icon: BarChart3, title: "Search Analytics", desc: "Visualize pipeline health, time-to-fill, and placement metrics to optimize your process.", color: "secondary" },
            { icon: Building2, title: "Company Intelligence", desc: "360° view of client companies. Track contacts, career histories, and relationships across organizations.", color: "primary" },
            { icon: Link2, title: "Integrations", desc: "Connect to your calendar, email, and tools. Your workflow stays seamless.", color: "primary" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <Card key={title} className="card-hover">
              <CardContent className="pt-6">
                <div className={`w-12 h-12 bg-${color}/10 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 text-${color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
                <p className="text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
