import { Link } from "react-router-dom";
import avidEdgeLogo from "@/assets/avidedge-logo.png";

const FooterSection = ({ scrollToSection }: { scrollToSection: (id: string) => void }) => {
  return (
    <footer className="py-12 px-4 bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">AvidEdge Search</span>
            </div>
            <p className="text-sidebar-foreground/70 mb-2">A CRM by TailorEDU</p>
            <p className="text-sm text-sidebar-foreground/60 italic">
              Technology leadership that advances business strategy.
            </p>
          </div>

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

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-sidebar-foreground/70">
              <li><Link to="/legal/terms" className="hover:text-sidebar-foreground transition-colors">Terms of Service</Link></li>
              <li><Link to="/legal/privacy" className="hover:text-sidebar-foreground transition-colors">Privacy Policy</Link></li>
              <li><a href="mailto:shannon@tailoredu.org" className="hover:text-sidebar-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-sidebar-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-sidebar-foreground/60">© {new Date().getFullYear()} AvidEdge Search. All rights reserved.</p>
          <p className="text-sm text-sidebar-foreground/60">Powered by TailorEDU</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
