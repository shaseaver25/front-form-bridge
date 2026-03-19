

# Fix Gmail OAuth 403 Issue

## What's happening

The 403 occurs because the `gmail-oauth` edge function validates the user's JWT using `supabase.auth.getUser(token)`. This project uses ES256-signed tokens (signing-keys system), and while `verify_jwt = false` is correctly set in `config.toml` (so the gateway doesn't block the request), the internal auth validation with `getUser()` makes a network round-trip that can intermittently fail or be slow. The recommended approach is to use `getClaims()` for faster, local JWT verification.

Additionally, the function creates its Supabase client with the **service role key** but then calls `auth.getUser(token)` — this works but is suboptimal. The client should be created with the **anon key** and the user's Authorization header for proper token validation.

## Plan

### 1. Update `gmail-oauth` edge function auth validation

In `supabase/functions/gmail-oauth/index.ts`, change the initiate (POST) path to:

- Create a **user-scoped** Supabase client using `SUPABASE_ANON_KEY` + the user's Authorization header
- Replace `supabase.auth.getUser(token)` with `supabase.auth.getClaims(token)` for reliable ES256 token validation
- Keep the service-role client separate for database writes (callback path)

### 2. Redeploy the edge function

Deploy the updated `gmail-oauth` function so the fix takes effect.

## Technical details

The function will have two Supabase clients:
- **Service-role client** (existing): used in the callback path to upsert `gmail_connections` records
- **Auth client** (new): created with anon key + user's Authorization header, used only in the POST/initiate path to validate the caller's identity via `getClaims()`

This matches the pattern already used successfully by other edge functions in the project.

