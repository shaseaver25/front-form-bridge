import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";

interface LandingNavbarProps {
  onLoginClick: () => void;
  scrollToSection: (id: string) => void;
}

type NavItem = {
  label: string;
  id?: string;
  href?: string;
  children?: { label: string; id?: string; href?: string }[];
};

const LandingNavbar = ({ onLoginClick, scrollToSection }: LandingNavbarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navLinks: NavItem[] = [
    {
      label: "Exec Search",
      children: [
        { label: "Overview", id: "hero" },
        { label: "Our Process", id: "features" },
      ],
    },
    {
      label: "Advisory",
      children: [
        { label: "Services", id: "features" },
        { label: "Connect", id: "contact" },
      ],
    },
    { label: "About", id: "features" },
    {
      label: "Coaching",
      children: [
        { label: "Coaching Admin", href: "/admin/coaching" },
        { label: "Courses", href: "/help/training" },
        { label: "Client View", href: "/client/coaching/rebrand" },
      ],
    },
    {
      label: "Legal",
      children: [
        { label: "Terms of Service", href: "/legal/terms" },
        { label: "Privacy Notice", href: "/legal/privacy" },
      ],
    },
  ];

  const handleNavClick = (item: { id?: string; href?: string }) => {
    if (item.href) {
      // Link navigation handled by <Link>, just close menus
    } else if (item.id) {
      scrollToSection(item.id);
    }
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
    setOpenMobileDropdown(null);
  };

  const handleMouseEnter = (label: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  useEffect(() => {
    return () => {
      if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary tracking-tight">
              <span className="text-primary">/</span>AvidEdge
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) =>
              link.children ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(link.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button className="flex items-center gap-1 text-foreground hover:text-primary transition-colors font-medium text-sm tracking-wide py-2">
                    {link.label}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === link.label ? "rotate-180" : ""}`} />
                  </button>

                  {openDropdown === link.label && (
                    <div className="absolute top-full left-0 mt-1 min-w-[180px] bg-popover border border-border rounded-md shadow-lg py-1 animate-fade-in z-50">
                      {link.children.map((child) =>
                        child.href ? (
                          <Link
                            key={child.label}
                            to={child.href}
                            onClick={() => handleNavClick(child)}
                            className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            {child.label}
                          </Link>
                        ) : (
                          <button
                            key={child.label}
                            onClick={() => handleNavClick(child)}
                            className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            {child.label}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link)}
                  className="text-foreground hover:text-primary transition-colors font-medium text-sm tracking-wide py-2"
                >
                  {link.label}
                </button>
              )
            )}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" onClick={onLoginClick} className="font-medium">
              Login
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 border-t border-border mt-4 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) =>
                link.children ? (
                  <div key={link.label}>
                    <button
                      onClick={() =>
                        setOpenMobileDropdown(openMobileDropdown === link.label ? null : link.label)
                      }
                      className="flex items-center justify-between w-full text-left text-foreground font-medium py-2.5 px-1"
                    >
                      {link.label}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${openMobileDropdown === link.label ? "rotate-180" : ""}`}
                      />
                    </button>
                    {openMobileDropdown === link.label && (
                      <div className="pl-4 pb-2 space-y-1 animate-fade-in">
                        {link.children.map((child) =>
                          child.href ? (
                            <Link
                              key={child.label}
                              to={child.href}
                              onClick={() => handleNavClick(child)}
                              className="block py-2 px-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded"
                            >
                              {child.label}
                            </Link>
                          ) : (
                            <button
                              key={child.label}
                              onClick={() => handleNavClick(child)}
                              className="block w-full text-left py-2 px-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded"
                            >
                              {child.label}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link)}
                    className="text-left text-foreground font-medium py-2.5 px-1"
                  >
                    {link.label}
                  </button>
                )
              )}
              <div className="flex flex-col gap-2 pt-4 border-t border-border mt-2">
                <Button variant="outline" onClick={onLoginClick} className="w-full">
                  Login
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default LandingNavbar;
