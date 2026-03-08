

## Problem

Juliet (and potentially other users) see an empty contact list after logging in. The root cause is a **race condition**: the `ConstituentList` component fires its Supabase queries immediately on mount (`useEffect([], [])`), but the Supabase client may not have its auth token fully set yet. When queries hit `crm_contacts` with no auth token, the RLS policy `auth.uid() IS NOT NULL` returns zero rows silently — no error, just empty data.

This same pattern exists in other components that fetch data on mount without verifying the session is ready.

## Fix

**1. Create a `useAuthReady` hook** that provides a stable `isReady` flag and `user` object, based on `getSession()` completing first.

**2. Update `ConstituentList`** to await session readiness before fetching contacts. Add `getSession()` call at the start of `fetchContacts` to ensure the token is set, and re-trigger fetch when session becomes available.

**3. Review other list components** (`GrantList`, `MajorGiftList`, `TaskList`, etc.) for the same pattern and apply the same fix.

## Technical Details

### New file: `src/hooks/useAuthReady.ts`
- Calls `supabase.auth.getSession()` on mount → sets `isReady = true` and captures `user`
- Listens to `onAuthStateChange` for subsequent changes
- Returns `{ user, isReady }`

### Changes to `src/components/ConstituentList.tsx`
- Import and use `useAuthReady`
- Gate `fetchContacts()` and `fetchTags()` calls on `isReady && !!user`
- Add `isReady` to the `useEffect` dependency array

### Same pattern applied to:
- `src/components/GrantList.tsx`
- `src/components/MajorGiftList.tsx`  
- `src/components/TaskList.tsx`
- Any other components using raw `useEffect` + Supabase queries on mount

This ensures no data-fetching query fires until the Supabase client has a valid auth token, eliminating the empty-list race condition.

