import { supabase } from "@/integrations/supabase/client";
import type { NavigateFunction } from "react-router-dom";

const STORAGE_KEY = "sb-rzhcefyigmkavddjjxvg-auth-token";

/**
 * Remove all Supabase auth keys from localStorage.
 * Safe to call even if nothing is stored.
 */
export function clearStoredAuthState() {
  try {
    // Remove the primary token key
    localStorage.removeItem(STORAGE_KEY);
    // Remove any other Supabase auth keys that may exist
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("sb-") || key.startsWith("supabase.auth"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // localStorage may be unavailable in rare cases
  }
}

/**
 * Sign out via Supabase, then purge all local auth state.
 */
export async function signOutAndClearSession() {
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore sign-out errors — we're clearing everything anyway
  }
  clearStoredAuthState();
}

/**
 * Detect whether an auth error indicates a stale/expired session
 * rather than genuinely wrong credentials.
 */
export function isStaleSessionError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("refresh_token") ||
    lower.includes("invalid_grant") ||
    lower.includes("token is expired") ||
    lower.includes("session_not_found")
  );
}

/**
 * Fetch the user's role and redirect accordingly.
 * - admin  → /
 * - client → /client/dashboard
 * - no role → sign out + return error string
 *
 * Returns null on success or an error message string.
 */
export async function redirectUserByRole(
  userId: string,
  navigate: NavigateFunction
): Promise<string | null> {
  try {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = roles?.some((r) => r.role === "admin");
    const isClient = roles?.some((r) => r.role === "client");

    if (isAdmin) {
      navigate("/", { replace: true });
      return null;
    }
    if (isClient) {
      navigate("/client/dashboard", { replace: true });
      return null;
    }

    // No recognised role — sign out
    await signOutAndClearSession();
    return "Your account hasn't been activated yet. Please contact your AvidEdge representative.";
  } catch {
    await signOutAndClearSession();
    return "Something went wrong checking your account. Please try again.";
  }
}
