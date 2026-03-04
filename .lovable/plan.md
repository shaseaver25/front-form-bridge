

## Crelate API Integration Plan

### What We Know
- Your database already has `crelate_id` columns on every `crm_` table, meaning data was previously migrated from Crelate
- Crelate uses a simple API key auth: `https://app.crelate.com/api3/{endpoint}?api_key={key}`
- No edge functions or Crelate secret exist yet

### What We'll Build

**1. Store the Crelate API key securely**
- Add a `CRELATE_API_KEY` secret to Supabase
- You'll need to get your API key from Crelate: Settings → My Settings & Preferences → API Access → Generate Key

**2. Create a `crelate-sync` edge function**
- A single edge function that pulls data from Crelate's API and upserts into your existing `crm_` tables using `crelate_id` as the match key
- Endpoints to sync:
  - `GET /api3/contacts` → `crm_contacts`, `crm_contact_emails`, `crm_contact_phones`, `crm_contact_urls`, `crm_contact_tags`
  - `GET /api3/companies` → `crm_companies`
  - `GET /api3/jobs` → `crm_jobs`
  - `GET /api3/placements` → `crm_placements`
  - `GET /api3/addresses` → `crm_addresses`
  - `GET /api3/activities` → `crm_activities`
- Handles pagination (Crelate returns pages of results)
- Uses `crelate_id` to upsert (update existing, insert new)
- Tracks sync results (counts of created/updated records)

**3. Create a `crm_sync_log` table**
- Stores sync history: timestamp, entity type, records synced, errors, status

**4. Add a Crelate integration settings page**
- New page at `/integrations/crelate` with:
  - Connection status (checks if API key is configured)
  - Test connection button
  - Sync controls (full sync, per-entity sync)
  - Sync history log
- Add to the integrations page navigation

**5. Wire up the frontend**
- Hook to invoke the edge function with sync type parameter
- Display sync progress and results via toasts
- Show last sync time and record counts

### Technical Details

- **Auth**: Crelate API key passed as query param `?api_key=...`
- **Base URL**: `https://app.crelate.com/api3`
- **Upsert strategy**: Use Supabase `.upsert()` with `onConflict: 'crelate_id'` where unique constraints exist, otherwise match-and-update logic
- **Pagination**: Crelate API uses `skip` and `take` params; we'll page through all records
- **Rate limiting**: Add delays between API calls to respect Crelate's limits

### Required from You
1. Your Crelate API key (I'll prompt you to add it as a secret)
2. Confirmation that API access is enabled in your Crelate org settings

