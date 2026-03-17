
Goal: fix the login issue for `shannon@tailoredu.org` and remove the auth-flow confusion that is making this harder to diagnose.

What I found
- The user record exists in Supabase, is email-confirmed, has a stored password, and has the `admin` role.
- Supabase rejected the exact password that was submitted (`AvidCRM26!`) with `invalid_credentials`.
- There was also a stale refresh-token error earlier, which means the preview likely had an old valid session cached. That can make it look like “preview login works” even when a fresh password login does not.
- The app currently has two different login routes:
  - `/auth` = CRM auth page with forgot-password
  - `/login` = client portal login page without forgot-password
- Redirects are inconsistent:
  - `Layout` sends logged-out users to `/auth`
  - `RequireAdmin` and `RequireClient` send users to `/login`
  - invitation/bootstrap flows also point to `/login`

Conclusion
- This is not a missing-user or missing-role problem.
- The fresh password being entered is not the current password in Supabase.
- The codebase also needs cleanup so there is one clear login entry point and a reliable recovery path.

Implementation plan
1. Unify authentication entry points
- Make `/login` the single public login route, matching the project memory.
- Convert `/auth` into a redirect to `/login` or remove its separate sign-in logic.
- Update all redirects/guards to send logged-out users to the same route.

2. Add password recovery directly to `/login`
- Bring the forgot-password flow into `src/pages/Login.tsx`.
- Keep `/reset-password` as the destination for recovery links.
- This gives users a recovery option from the route they are actually using.

3. Harden stale-session handling
- Update the Supabase client/session bootstrapping so invalid refresh tokens are cleared cleanly before users try to sign in again.
- Standardize auth initialization so listeners and session checks behave consistently across pages.

4. Improve login diagnostics
- Keep generic user-facing messaging, but internally distinguish:
  - bad password
  - no role / inactive account
  - stale session / refresh-token failure
- This will make future debugging much easier without exposing sensitive details.

5. Verify role-based redirect behavior
- After a successful login:
  - `admin` → `/`
  - `client` → `/client/dashboard`
  - no valid role → sign out and show activation message

Files I would update
- `src/pages/Login.tsx`
- `src/pages/Auth.tsx`
- `src/integrations/supabase/client.ts`
- `src/components/Layout.tsx`
- `src/components/RequireAdmin.tsx`
- `src/components/client/RequireClient.tsx`
- any route/navigation files still pointing to the wrong auth page, including invitation/bootstrap/logout paths

Important technical note
- The evidence shows Supabase itself is denying the typed password, so a code-only fix will not make that specific password work.
- The immediate recovery path is to reset/set a new password for `shannon@tailoredu.org`, then implement the auth cleanup above so future sign-ins are consistent and self-service.

Expected result after implementation
- One login page for everyone
- Clear password reset path from that page
- No more confusion between `/auth` and `/login`
- Cleaner handling of stale sessions
- Correct redirect after sign-in based on role
