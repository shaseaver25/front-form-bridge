import { useState } from "react";
import LoginModal from "@/components/LoginModal";
import LandingNavbar from "@/components/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import ValuePropositionSection from "@/components/landing/ValuePropositionSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import CTASection from "@/components/landing/CTASection";
import FooterSection from "@/components/landing/FooterSection";

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
      <LandingNavbar
        onLoginClick={() => setIsLoginModalOpen(true)}
        scrollToSection={scrollToSection}
      />
      <HeroSection
        onGetStarted={() => setIsLoginModalOpen(true)}
        onSeeFeatures={() => scrollToSection("features")}
      />
      <ValuePropositionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SocialProofSection />
      <CTASection onGetStarted={() => setIsLoginModalOpen(true)} />
      <FooterSection scrollToSection={scrollToSection} />
      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </div>
  );
};

export default Landing;
