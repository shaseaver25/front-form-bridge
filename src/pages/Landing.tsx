import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, FileText, BarChart3, Link2, 
  CheckCircle2, Building2, Calendar,
  Sparkles, AlertTriangle, Clock, MessagesSquare,
  ArrowRight, Mail
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
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/5 pt-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              The CRM Built for Nonprofits<br className="hidden sm:block" /> That Do It All
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Manage grants, track donors, and measure impact — all in one place.<br className="hidden md:block" />
              Built by nonprofits, for nonprofits.
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
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Grants</span>
            </div>
            <div className="flex flex-col items-center gap-2 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Donors</span>
            </div>
            <div className="flex flex-col items-center gap-2 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-secondary" />
              </div>
              <span className="text-sm text-muted-foreground font-medium">Impact</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 md:py-24 px-4 bg-muted">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 text-foreground">
            Sound Familiar?
          </h2>
          <p className="text-lg md:text-xl text-center text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto">
            Traditional CRMs weren't built for the way nonprofits actually work.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <Card className="card-hover border-destructive/20">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Missed Grant Deadlines</h3>
                <p className="text-muted-foreground">
                  Scrambling to find program data when an RFP drops? Important opportunities slip away when information is scattered.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover border-destructive/20">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Fragmented Donor History</h3>
                <p className="text-muted-foreground">
                  New staff inherits incomplete records. Relationships built over years get lost in spreadsheets and old email threads.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover border-destructive/20">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
                  <MessagesSquare className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Reporting Nightmares</h3>
                <p className="text-muted-foreground">
                  Funders want impact data, but pulling numbers from five different systems takes days, not hours.
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-xl md:text-2xl font-semibold text-primary mt-12">
            TailoredU CRM solves all three.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-24 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 text-foreground">
            Everything You Need in One Place
          </h2>
          <p className="text-lg md:text-xl text-center text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto">
            Purpose-built tools for nonprofit fundraising teams.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Grant Management</h3>
                <p className="text-muted-foreground">
                  Track opportunities from prospect to close. Store proposals, budgets, and reports. Never miss a deadline.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Donor Relationships</h3>
                <p className="text-muted-foreground">
                  360° view of every constituent. Household tracking, soft credits, and relationship mapping.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">AI-Powered Search</h3>
                <p className="text-muted-foreground">
                  Find content by meaning, not just keywords. Our semantic search understands what you're looking for.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Mission Impact Dashboard</h3>
                <p className="text-muted-foreground">
                  Visualize program outcomes. Track beneficiaries. Show funders exactly how you're making a difference.
                </p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">Pledge Tracking</h3>
                <p className="text-muted-foreground">
                  Multi-year commitments with automatic payment schedules. Never lose track of pledged revenue.
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
                  Connect to QuickBooks, Mailchimp, Stripe, and more. Your data flows where it needs to go.
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
            Up and Running in Days, Not Months
          </h2>
          <p className="text-lg md:text-xl text-center text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto">
            Go from scattered data to complete visibility quickly.
          </p>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Import Your Data</h3>
              <p className="text-muted-foreground">
                Bring your existing donors, grants, and history. We handle Salesforce, spreadsheets, and more.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Connect Your Tools</h3>
              <p className="text-muted-foreground">
                Link QuickBooks, email marketing, and payment systems with just a few clicks.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Start Working Smarter</h3>
              <p className="text-muted-foreground">
                Your team sees everything in one place—donors, grants, and impact metrics unified.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 md:py-24 px-4 bg-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Trusted by Nonprofits Like Yours
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Built with real-world nonprofit needs in mind.
          </p>

          <Card className="card-hover">
            <CardContent className="py-8 md:py-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-foreground">createMPLS</div>
                  <div className="text-sm text-muted-foreground">Minneapolis, MN</div>
                </div>
              </div>
              <blockquote className="text-lg md:text-xl text-muted-foreground italic mb-6">
                "We built TailoredU because we couldn't find a CRM that understood both grant management and donor fundraising. Now we use it every day."
              </blockquote>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  Serving Minneapolis nonprofits
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  Built by nonprofit staff
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  Real-world tested
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-24 px-4 bg-muted">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Affordable for Organizations of Any Size
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Simple, transparent pricing tailored to your needs.
          </p>

          <Card className="card-hover max-w-lg mx-auto">
            <CardContent className="py-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">Custom Pricing</h3>
              <p className="text-muted-foreground mb-6">
                Contact us for pricing tailored to your organization's needs.
              </p>
              <ul className="space-y-3 text-left max-w-xs mx-auto mb-8">
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span>No per-seat fees</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span>No surprise costs</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span>All features included</span>
                </li>
                <li className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-secondary flex-shrink-0" />
                  <span>Onboarding support</span>
                </li>
              </ul>
              <Button size="lg" asChild className="gap-2">
                <a href="mailto:shannon@tailoredu.org">
                  <Mail className="w-5 h-5" />
                  Request a Demo
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="contact" className="py-20 md:py-24 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
            Ready to Simplify Your Nonprofit Operations?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join organizations that have ditched spreadsheets and disconnected systems.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setIsLoginModalOpen(true)} className="text-lg px-8 gap-2">
              Get Started <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <a href="mailto:shannon@tailoredu.org">
                Questions? Contact Us
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
                  <Building2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">TailoredU CRM</span>
              </div>
              <p className="text-sidebar-foreground/70 mb-2">
                Built by createMPLS
              </p>
              <p className="text-sm text-sidebar-foreground/60 italic">
                Making nonprofit fundraising data actually useful.
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
                  <button onClick={() => scrollToSection("pricing")} className="hover:text-sidebar-foreground transition-colors">
                    Pricing
                  </button>
                </li>
                <li>
                  <a href="mailto:shannon@tailoredu.org" className="hover:text-sidebar-foreground transition-colors">
                    Integrations
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
              © {new Date().getFullYear()} createMPLS. All rights reserved.
            </p>
            <p className="text-sm text-sidebar-foreground/60">
              Minneapolis, MN
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
