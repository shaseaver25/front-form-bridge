import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    document.title = "AvidEdge — Client Portal";
    return () => { document.title = "AvidEdge Search"; };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await redirectByRole(session.user.id);
      }
      setCheckingSession(false);
    });
  }, []);

  const redirectByRole = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = roles?.some((r) => r.role === "admin");
    const isClient = roles?.some((r) => r.role === "client");

    if (isAdmin) {
      navigate("/", { replace: true });
    } else if (isClient) {
      navigate("/client/dashboard", { replace: true });
    } else {
      await supabase.auth.signOut();
      setError("Your account hasn't been activated yet. Please contact your AvidEdge representative.");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message?.toLowerCase().includes("rate limit")) {
          setError("Too many sign-in attempts. Please wait a moment and try again.");
        } else {
          setError("Invalid email or password. Please try again.");
        }
        return;
      }

      if (!data.user) {
        setError("Invalid email or password. Please try again.");
        return;
      }

      await redirectByRole(data.user.id);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const redirectUrl = "https://front-form-bridge.lovable.app/reset-password";
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setResetSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5F2ED" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#C8A96E" }} />
      </div>
    );
  }

  // Forgot password view
  if (showForgotPassword) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ backgroundColor: "#F5F2ED" }}
      >
        <div className="w-full" style={{ maxWidth: 420 }}>
          <div
            className="rounded-xl"
            style={{
              backgroundColor: "#FFFFFF",
              padding: "40px 48px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            <button
              type="button"
              onClick={() => { setShowForgotPassword(false); setError(null); setResetSent(false); }}
              className="inline-flex items-center gap-1 mb-6 transition-colors"
              style={{ fontFamily: "'Lato', sans-serif", fontSize: 14, color: "#C8A96E" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </button>

            <div className="text-center">
              <h1
                className="tracking-tight mb-1"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#1B2A4A",
                }}
              >
                Reset Password
              </h1>
              <p
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: 14,
                  color: "#555555",
                  marginTop: 8,
                }}
              >
                Enter your email and we'll send you a reset link
              </p>
            </div>

            <div
              className="mx-auto"
              style={{ width: 60, height: 1, backgroundColor: "#C8A96E", marginTop: 24, marginBottom: 24 }}
            />

            {resetSent ? (
              <div
                style={{
                  backgroundColor: "rgba(200, 169, 110, 0.1)",
                  borderLeft: "3px solid #C8A96E",
                  borderRadius: "0 6px 6px 0",
                  padding: "16px",
                  fontFamily: "'Lato', sans-serif",
                  fontSize: 14,
                  color: "#1B2A4A",
                }}
              >
                Check your inbox for a password reset link. It may take a minute to arrive.
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <div className="mb-5">
                  <label
                    htmlFor="reset-email"
                    style={{
                      fontFamily: "'Lato', sans-serif",
                      fontSize: 13,
                      color: "#555555",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="w-full outline-none transition-colors duration-200"
                    style={{
                      fontFamily: "'Lato', sans-serif",
                      fontSize: 15,
                      border: "1px solid #E0DCD6",
                      borderRadius: 8,
                      padding: "14px 16px",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#C8A96E")}
                    onBlur={(e) => (e.target.style.borderColor = "#E0DCD6")}
                  />
                </div>

                {error && (
                  <div
                    className="mb-5"
                    style={{
                      backgroundColor: "rgba(226, 75, 74, 0.08)",
                      borderLeft: "3px solid #E24B4A",
                      borderRadius: "0 6px 6px 0",
                      padding: "12px 16px",
                      fontFamily: "'Lato', sans-serif",
                      fontSize: 13,
                      color: "#791F1F",
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full transition-colors duration-200 disabled:opacity-60"
                  style={{
                    backgroundColor: "#1B2A4A",
                    color: "#FFFFFF",
                    fontFamily: "'Lato', sans-serif",
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    borderRadius: 8,
                    height: 48,
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = "#243656";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = "#1B2A4A";
                  }}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#F5F2ED" }}
    >
      <div className="w-full" style={{ maxWidth: 420 }}>
        <div
          className="rounded-xl"
          style={{
            backgroundColor: "#FFFFFF",
            padding: "40px 48px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          {/* Logo */}
          <div className="text-center">
            <h1
              className="tracking-tight mb-1"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 28,
                fontWeight: 700,
                color: "#1B2A4A",
              }}
            >
              <span style={{ color: "#C8A96E" }}>/</span>AvidEdge
            </h1>
            <p
              className="uppercase"
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: 14,
                letterSpacing: "2px",
                color: "#C8A96E",
                fontWeight: 400,
              }}
            >
              Client Portal
            </p>
          </div>

          {/* Gold divider */}
          <div
            className="mx-auto"
            style={{
              width: 60,
              height: 1,
              backgroundColor: "#C8A96E",
              marginTop: 24,
              marginBottom: 24,
            }}
          />

          <form onSubmit={handleSignIn}>
            {/* Email */}
            <div className="mb-5">
              <label
                htmlFor="login-email"
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: 13,
                  color: "#555555",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full outline-none transition-colors duration-200"
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: 15,
                  border: "1px solid #E0DCD6",
                  borderRadius: 8,
                  padding: "14px 16px",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#C8A96E")}
                onBlur={(e) => (e.target.style.borderColor = "#E0DCD6")}
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <label
                htmlFor="login-password"
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: 13,
                  color: "#555555",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full outline-none transition-colors duration-200"
                  style={{
                    fontFamily: "'Lato', sans-serif",
                    fontSize: 15,
                    border: "1px solid #E0DCD6",
                    borderRadius: 8,
                    padding: "14px 16px",
                    paddingRight: 48,
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#C8A96E")}
                  onBlur={(e) => (e.target.style.borderColor = "#E0DCD6")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" style={{ color: "#888888" }} />
                  ) : (
                    <Eye className="h-5 w-5" style={{ color: "#888888" }} />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="mb-5"
                style={{
                  backgroundColor: "rgba(226, 75, 74, 0.08)",
                  borderLeft: "3px solid #E24B4A",
                  borderRadius: "0 6px 6px 0",
                  padding: "12px 16px",
                  fontFamily: "'Lato', sans-serif",
                  fontSize: 13,
                  color: "#791F1F",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full transition-colors duration-200 disabled:opacity-60"
              style={{
                backgroundColor: "#1B2A4A",
                color: "#FFFFFF",
                fontFamily: "'Lato', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "0.5px",
                borderRadius: 8,
                height: 48,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!loading) (e.target as HTMLButtonElement).style.backgroundColor = "#243656";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = "#1B2A4A";
              }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            {/* Forgot password link */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setError(null); }}
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: 13,
                  color: "#C8A96E",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                Forgot your password?
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6" style={{ fontFamily: "'Lato', sans-serif" }}>
          <p style={{ fontSize: 12, color: "#888888" }}>
            © {new Date().getFullYear()} AvidEdge Executive Search
          </p>
          <p style={{ fontSize: 12, color: "#888888", marginTop: 4 }}>
            Need help?{" "}
            <a
              href="mailto:support@avidedgesearch.com"
              style={{ color: "#C8A96E", textDecoration: "none" }}
            >
              Contact support@avidedgesearch.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
