
## Fix: Crelate test passes but sync still returns 403

## What I found
- The success case and failure case are real and reproducible from the current code/logs:
  - `action: "test"` returns `success: true`
  - `action: "sync", entity_type: "contacts"` returns `Contacts sync failed: Crelate API error 403`
- The two paths are **not using the same request implementation**:
  - **Test connection** uses a one-off fetch to `/contacts?offset=0&limit=1` with only `x-api-key`
  - **Sync contacts** goes through `fetchAllPages -> crelateGet`, which sends the API key differently and requests larger paginated batches
- There is already a more robust helper in the function, `fetchCrelateWithAuthVariants(...)`, but it is currently **unused**.

## Likely root cause
This is most likely an **auth/request-shape mismatch**, not a frontend problem:
- the key is valid enough for the simple connection test
- but the sync path is using a different header/query combination than the test path
- Crelate is rejecting the sync request format with 403

A secondary possibility is a **restricted key scope** on the contacts endpoint, but the first thing to fix is the inconsistent request logic.

## Implementation plan

### 1. Unify test and sync onto one Crelate request helper
Refactor `supabase/functions/crelate-sync/index.ts` so both:
- `action === "test"`
- all sync fetches (`contacts`, `companies`, `jobs`, `activities`, etc.)

use the **same underlying request function**.

Planned approach:
- replace direct `fetch(...)` inside `crelateGet`
- route all v3 endpoint reads through `fetchCrelateWithAuthVariants(...)`
- make the test endpoint call the exact same helper used by sync

This removes the current “test path works, sync path differs” bug class entirely.

### 2. Make the first sync attempt match the known-good test request
For `/api3/contacts`, make the first auth attempt mirror the currently successful test request as closely as possible:
- same endpoint family
- same lowercase `x-api-key` header
- same query-param strategy where applicable

Then allow fallbacks only if needed.

This gives the sync path the best chance of matching the request shape Crelate already accepts.

### 3. Add endpoint-level auth diagnostics without exposing secrets
Improve logs in `crelate-sync` so failed requests show:
- endpoint name
- auth attempt used (`header_only`, `query_only`, etc.)
- status code
- sanitized credential metadata only if needed (length/prefix/suffix, never full key)

Example outcome in logs:
```text
contacts request failed with 403 using header_and_query
retry succeeded with header_only
```

That will make future debugging much faster.

### 4. Preserve existing special handling for document APIs
Keep document sync on its existing v2-specific flow unless needed:
- documents already use different endpoints and auth expectations
- this bug is currently on the v3 contacts sync path

So the change should target shared v3 reads first, not rewrite the whole integration.

### 5. Improve the admin UI error message
Update the sync failure surface so it no longer just says “Sync failed”.
Show a clearer message when the edge function returns a 401/403-style upstream error, for example:
- “Connection test passed, but Crelate rejected the contacts sync request.”
- “This usually means the sync endpoint needs a different auth format or the key lacks contacts access.”

This will make the state less confusing for admins.

## Files to change
- `supabase/functions/crelate-sync/index.ts`
  - unify request logic
  - use `fetchCrelateWithAuthVariants`
  - add sanitized diagnostics
- `src/hooks/useCrelateSync.ts`
  - preserve and surface richer sync error text
- optionally `src/pages/CrelateSettings.tsx`
  - show clearer inline guidance in sync history or toast copy

## Expected result
After this fix:
- if the issue is request-format mismatch, contacts sync should start working immediately
- if the issue is true permission scope, the logs will clearly prove that and identify which endpoint/auth variant is blocked
- the admin UI will stop giving the misleading impression that “connected” means “sync-ready”

## Technical notes
```text
Current
test -> custom fetch -> success
sync -> crelateGet/fetchAllPages -> 403

Planned
test -> shared request helper
sync -> same shared request helper
logs -> include auth attempt + endpoint + status
```
