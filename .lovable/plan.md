

## Wire Up Apollo.io Enrichment for Contacts

The Enrich button is currently a placeholder. The `APOLLO_API_KEY` secret already exists. We need to create an edge function that calls Apollo's People Enrichment API and update the client to call it.

### Changes

**1. Create edge function `supabase/functions/enrich-contact/index.ts`**
- Accepts `{ contact_id }` in the request body
- Authenticates the caller via `getClaims()`
- Reads the contact's primary email (and optionally name) from `crm_contacts` + `crm_contact_emails`
- Calls Apollo.io People Enrichment API (`https://api.apollo.io/api/v1/people/match`) with the email/name
- Writes the enrichment result back to `crm_contacts`: sets `enrichment_data` (JSONB), `enrichment_status = 'enriched'`, `enrichment_source = 'apollo'`, `enrichment_updated_at = now()`
- Also updates useful fields if present in Apollo response: `job_title`, `description`, and optionally inserts/updates career history and company info
- Returns success/failure JSON with CORS headers

**2. Add config entry in `supabase/config.toml`**
```toml
[functions.enrich-contact]
verify_jwt = false
```

**3. Update `src/pages/ContactDetail.tsx` — `handleEnrich`**
- Replace the placeholder with `supabase.functions.invoke('enrich-contact', { body: { contact_id: id } })`
- On success, call `fetchContact()` to refresh the page with enriched data
- On error, show a toast with the error message

**4. Update `src/components/exec-search/ESContactsList.tsx` — `handleEnrich`**
- Same pattern: invoke the edge function with the contact ID
- On success, refresh the contacts list via `fetchContacts()`
- On error, show error toast

### Apollo API Call Detail

```typescript
// POST https://api.apollo.io/api/v1/people/match
// Headers: { "X-Api-Key": APOLLO_API_KEY, "Content-Type": "application/json" }
// Body: { email, first_name, last_name }
// Returns: { person: { title, organization_name, linkedin_url, ... } }
```

The edge function stores the full Apollo `person` object in `enrichment_data` for future use and extracts key fields to update the contact record directly.

