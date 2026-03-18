import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { redirectUserByRole, isStaleSessionError, clearStoredAuthState } from "@/lib/authUtils";

export default function ClientLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (isStaleSessionError(error.message)) {
          clearStoredAuthState();
          toast.error("Your session was stale and has been cleared. Please try signing in again.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (!data.user) {
        toast.error("Sign in failed.");
        return;
      }

      const roleError = await redirectUserByRole(data.user.id, navigate);
      if (roleError) {
        toast.error(roleError);
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#F5F2ED" }}
    >
      <div className="w-full max-w-md">
        <div
          className="rounded-2xl shadow-xl p-10"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl tracking-tight mb-2"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#1B2A4A",
                fontWeight: 700,
              }}
            >
              <span style={{ color: "#C8A96E" }}>/</span>AvidEdge
            </h1>
            <p
              className="text-sm uppercase tracking-[0.25em]"
              style={{
                fontFamily: "'Lato', sans-serif",
                color: "#C8A96E",
                fontWeight: 500,
              }}
            >
              Client Portal
            </p>
          </div>

          {/* Divider */}
          <div
            className="w-12 h-px mx-auto mb-8"
            style={{ backgroundColor: "#C8A96E" }}
          />

          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs uppercase tracking-widest"
                style={{
                  fontFamily: "'Lato', sans-serif",
                  color: "#6B7280",
                  fontWeight: 600,
                }}
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="h-12 rounded-lg border-gray-200 focus:border-[#C8A96E] focus:ring-[#C8A96E]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs uppercase tracking-widest"
                style={{
                  fontFamily: "'Lato', sans-serif",
                  color: "#6B7280",
                  fontWeight: 600,
                }}
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-12 rounded-lg border-gray-200 focus:border-[#C8A96E] focus:ring-[#C8A96E]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg text-sm uppercase tracking-widest font-semibold transition-all duration-200"
              style={{
                backgroundColor: "#1B2A4A",
                color: "#FFFFFF",
                fontFamily: "'Lato', sans-serif",
              }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          {/* Footer */}
          <p
            className="text-center text-xs mt-8"
            style={{
              fontFamily: "'Lato', sans-serif",
              color: "#9CA3AF",
            }}
          >
            Access is by invitation only.
            <br />
            Contact your AvidEdge representative for assistance.
          </p>
        </div>

        {/* Bottom branding */}
        <p
          className="text-center text-xs mt-6"
          style={{
            fontFamily: "'Lato', sans-serif",
            color: "#B0A99A",
          }}
        >
          © {new Date().getFullYear()} AvidEdge Technology Executive Search
        </p>
      </div>
    </div>
  );
}
