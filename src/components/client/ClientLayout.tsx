import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, BookOpen, FileText, Settings, LogOut, Menu, X } from "lucide-react";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", to: "/client/dashboard", icon: LayoutDashboard },
  { label: "Coaching", to: "/client/coaching/rebrand", icon: BookOpen },
  { label: "Documents", to: "/client/documents", icon: FileText },
  { label: "Settings", to: "/client/settings", icon: Settings },
];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();
      if (data) {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
      }
    }
    loadProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/login", { replace: true });
  };

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F5F2ED" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col
          transition-transform duration-300 lg:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{ backgroundColor: "#1B2A4A" }}
      >
        {/* Brand */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <h2
              className="text-xl tracking-tight"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#FFFFFF",
                fontWeight: 700,
              }}
            >
              <span style={{ color: "#C8A96E" }}>/</span>AvidEdge
            </h2>
            <button
              className="lg:hidden text-white/60 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p
            className="text-[10px] uppercase tracking-[0.2em] mt-1"
            style={{ color: "#C8A96E", fontFamily: "'Lato', sans-serif" }}
          >
            Client Portal
          </p>
        </div>

        {/* User badge */}
        <div className="px-6 py-3 mx-4 rounded-lg mb-4" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{
                backgroundColor: "#C8A96E",
                color: "#1B2A4A",
                fontFamily: "'Lato', sans-serif",
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "#FFFFFF", fontFamily: "'Lato', sans-serif" }}
              >
                {firstName} {lastName}
              </p>
              <p
                className="text-[10px] uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Lato', sans-serif" }}
              >
                Client
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? "text-white"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`
              }
              style={({ isActive }) => ({
                fontFamily: "'Lato', sans-serif",
                fontWeight: isActive ? 600 : 400,
                backgroundColor: isActive ? "rgba(200,169,110,0.15)" : undefined,
              })}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              {/* Active indicator */}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-4 pb-6">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-all duration-150 hover:bg-white/5"
            style={{
              fontFamily: "'Lato', sans-serif",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center h-14 px-4 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg"
            style={{ color: "#1B2A4A" }}
          >
            <Menu className="h-5 w-5" />
          </button>
          <h2
            className="ml-3 text-lg"
            style={{ fontFamily: "'Playfair Display', serif", color: "#1B2A4A", fontWeight: 700 }}
          >
            <span style={{ color: "#C8A96E" }}>/</span>AvidEdge
          </h2>
        </header>

        <main className="flex-1 p-6 lg:p-10 max-w-6xl">
          {children}
        </main>
      </div>
    </div>
  );
}
