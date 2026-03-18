

# Login Hardening Plan

## Overview
Prevent recurring "can't log in" incidents by adding automatic stale-session recovery, smarter error messages, a self-heal button on the login page, and consistent auth utilities across all login surfaces.

## Changes

### 1. Create shared auth utilities — `src/lib/authUtils.ts` (new file)

Three reusable helpers:

- **`clearStoredAuthState()`** — removes all Supabase auth keys from localStorage
- **`signOutAndClearSession()`** — calls `supabase.auth.signOut()`, then `clearStoredAuthState()`
- **`redirectUserByRole(userId, navigate)`** — fetches roles from `user_roles`, redirects admin to `/`, client to `/client/dashboard`, or signs out with an activation error message. Returns the error string if no role found.

### 2. Harden Supabase client startup — `src/integrations/supabase/client.ts`

- Expand the `onAuthStateChange` listener to catch `TOKEN_REFRESHED` failures (when session is null after a refresh attempt)
- On any stale/missing token detection, call `clearStoredAuthState()` instead of just removing one key
- Remove the duplicated IIFE startup check since the listener now covers it

### 3. Add self-heal and smarter errors to `/login` — `src/pages/Login.tsx`

- Replace inline `redirectByRole` with the shared `redirectUserByRole` helper
- Add a "Having trouble signing in?" link below the forgot-password link that calls `signOutAndClearSession()`, resets form state, and shows a toast: "Session cleared — please try signing in again"
- Improve error detection: if the auth error message contains "refresh_token" or "invalid_grant", automatically call `clearStoredAuthState()` and show "Your session was stale and has been cleared. Please try again." instead of the generic error

### 4. Update ClientLogin — `src/pages/ClientLogin.tsx`

- Replace inline role-check logic with `redirectUserByRole`
- Add the same stale-session error detection from Login.tsx

### 5. Fix LoginModal redirect — `src/components/LoginModal.tsx`

- Change password reset `redirectTo` from `${window.location.origin}/reset-password` to `"https://front-form-bridge.lovable.app/reset-password"` (line 78)
- Replace inline sign-in redirect with `redirectUserByRole`

### 6. Update AcceptInvitation — `src/pages/AcceptInvitation.tsx`

- Replace inline role-check + redirect block (lines 148-170) with `redirectUserByRole`

## Files affected
- `src/lib/authUtils.ts` — new
- `src/integrations/supabase/client.ts` — update listener
- `src/pages/Login.tsx` — shared helper + self-heal button + smarter errors
- `src/pages/ClientLogin.tsx` — shared helper
- `src/components/LoginModal.tsx` — fix redirect URL + shared helper
- `src/pages/AcceptInvitation.tsx` — shared helper

## What this solves
- Stale refresh tokens auto-clear without user action
- Users see a one-click "clear session" recovery path on the login page
- Error messages distinguish between wrong password, rate limiting, and stale sessions
- Password reset links always point to the production domain
- Role-based redirect logic is consistent everywhere

