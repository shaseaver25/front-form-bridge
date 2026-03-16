

## Plan: Fix Gmail OAuth + Create Gmail Send + Update Compose Dialog

### Current State
- The `gmail-oauth` edge function is deployed and responding (confirmed via curl test -- returns 401 as expected without auth)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` secrets exist in Supabase
- The redirect URI `https://rzhcefyigmkavddjjxvg.supabase.co/functions/v1/gmail-oauth` is configured in Google Console
- Edge function logs show only boot/shutdown -- no request-level logs, suggesting the callback may fail at Google's token exchange step
- `GmailSettingsPage` does NOT handle `?connected=true` or `?error=` query params after OAuth redirect
- `gmail-sync` has `verify_jwt = true` which causes ES256 signature failures (known issue in this project)
- No `send-gmail-email` edge function exists yet
- `EmailComposeDialog` currently calls `send-microsoft-email` (which doesn't exist)

### Changes

#### 1. Fix GmailSettingsPage to handle OAuth callback
- Add `useSearchParams` to detect `?connected=true` and `?error=` params
- Show success/error toasts and refetch connection data on return

#### 2. Add logging to gmail-oauth edge function
- Add `console.log` statements at key points (callback entry, token exchange, redirect) to debug the 404
- Add error details to the redirect URL so users see what went wrong

#### 3. Fix gmail-sync JWT issue
- Change `verify_jwt` to `false` in `config.toml` for `gmail-sync`
- Add internal JWT validation via `supabase.auth.getUser()` (same pattern as other functions)

#### 4. Create `send-gmail-email` edge function
- Authenticate the calling user via internal JWT validation
- Fetch their `gmail_connections` record, refresh token if expired
- Use Gmail API `POST /gmail/v1/users/me/messages/send` to send email as the user
- Log the send to `email_log` table
- Add to `config.toml` with `verify_jwt = false`

#### 5. Update EmailComposeDialog to use Gmail
- Change from `send-microsoft-email` to `send-gmail-email`
- Keep the same UI and form fields

#### 6. Update google-calendar-oauth fallback URL
- Change hardcoded fallback from `tailoredu.org` to `front-form-bridge.lovable.app`

### Prerequisite (User Action)
Your Google Cloud Console redirect URI is confirmed set. If you still get a 404 after these fixes, the enhanced logging will show exactly where it fails.

