import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users, Search, BarChart3, Link2,
  CheckCircle2, Building2, Target,
  Sparkles, ArrowRight, Mail, Briefcase, Shield
} from "lucide-react";
import LoginModal from "@/components/LoginModal";
import LandingNavbar from "@/components/LandingNavbar";

const Landing = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <LandingNavbar
        onLoginClick={() => setIsLoginModalOpen(true)}
        scrollToSection={scrollToSection}
      />

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/5 pt-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="animate-fade-in">
            <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-4">
              A CRM by TailorEDU
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Technology Executive Search<br className="hidden sm:block" /> Redefined
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Manage candidates, track placements, and close retained searches — all in one platform.
              <br className="hidden md:block" />
              Purpose-built for executive search firms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => setIsLoginModalOpen(true)} className="text-lg px-8 gap-2">
                Get Started <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollToSection("features")} className="text-lg px-8">
                See Features
              </Button>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto">
            <div className="flex flex-col items-center gap-2 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Search</span>
            </div>
            <div className="flex flex-col items-center gap-2 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Candidates</span>
            </div>
            <div className="flex flex-col items-center gap-2 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-secondary" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Placements</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
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

      {/* Features Section */}
      <section id="features" className="py-20 md:py-24 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 text-foreground">
            Your Expertise, Amplified
          </h2>
          <p className="text-lg md:text-xl text-center text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto">
            Tools built for retained executive search firms.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Candidate Pipeline</h3>
                <p className="text-muted-foreground">
                  Track candidates from sourcing through placement. Manage relationships, notes, and pipeline stages.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Job & Placement Tracking</h3>
                <p className="text-muted-foreground">
                  Manage active searches, job requirements, compensation details, and placement outcomes.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">AI-Powered Matching</h3>
                <p className="text-muted-foreground">
                  Semantic search to find the right candidates. Our AI understands skills, experience, and cultural fit.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Search Analytics</h3>
                <p className="text-muted-foreground">
                  Visualize pipeline health, time-to-fill, and placement metrics to optimize your process.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Company Intelligence</h3>
                <p className="text-muted-foreground">
                  360° view of client companies. Track contacts, career histories, and relationships across organizations.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Link2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Integrations</h3>
                <p className="text-muted-foreground">
                  Connect to your calendar, email, and tools. Your workflow stays seamless.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-24 px-4 bg-muted">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 text-foreground">
            Up and Running in Days
          </h2>
          <p className="text-lg md:text-xl text-center text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto">
            From scattered data to complete visibility, quickly.
          </p>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Import Your Data</h3>
              <p className="text-muted-foreground">
                Bring your existing candidates, companies, and search history. We handle Crelate, spreadsheets, and more.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Connect Your Tools</h3>
              <p className="text-muted-foreground">
                Link your calendar, email, and meeting tools with just a few clicks.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Start Closing Searches</h3>
              <p className="text-muted-foreground">
                Your team sees everything in one place — candidates, jobs, and pipeline metrics unified.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
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
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  Retained executive search
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  90-day onboarding support
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  Advisory services
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 md:py-24 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Ready to Transform Your Search Practice?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join firms that have unified their candidate pipeline, client relationships, and placements in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setIsLoginModalOpen(true)} className="text-lg px-8 gap-2">
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

      {/* Footer */}
      <footer className="py-12 px-4 bg-sidebar text-sidebar-foreground">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Tagline */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Search className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">AvidEdge Search</span>
              </div>
              <p className="text-sidebar-foreground/70 mb-2">
                A CRM by TailorEDU
              </p>
              <p className="text-sm text-sidebar-foreground/60 italic">
                Technology leadership that advances business strategy.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li>
                  <button onClick={() => scrollToSection("features")} className="hover:text-sidebar-foreground transition-colors">
                    Features
                  </button>
                </li>
                <li>
                  <a href="mailto:shannon@tailoredu.org" className="hover:text-sidebar-foreground transition-colors">
                    Request a Demo
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li>
                  <Link to="/legal/terms" className="hover:text-sidebar-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/legal/privacy" className="hover:text-sidebar-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <a href="mailto:shannon@tailoredu.org" className="hover:text-sidebar-foreground transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-sidebar-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-sidebar-foreground/60">
              © {new Date().getFullYear()} AvidEdge Search. All rights reserved.
            </p>
            <p className="text-sm text-sidebar-foreground/60">
              Powered by TailorEDU
            </p>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </div>
  );
};

export default Landing;
