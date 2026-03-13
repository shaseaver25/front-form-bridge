

## Redesign Company Detail Page

### What changes

**Remove**: The 5 quick info cards (Type, Status, Contacts, Jobs, Placements) at lines 370-402.

**Add to the header area** (inline, below company name):
- **Main contact**: Find the primary contact (first `is_current` career history entry, or highest-ranking) and show their name, title, email, phone inline -- clickable to their contact page
- **HQ address**: Show the primary address from `crm_addresses` inline with a MapPin icon
- Company logo already handled by `CompanyAvatar`

**Add AI Company Summary section** (replaces the cards area):
- A card with an AI-generated overview combining public web info + CRM stats
- Uses Lovable AI Gateway via a new `company-summary` edge function
- The edge function receives: company name, domain, CRM stats (contact count, job count, placement count, revenue, description)
- Returns a 2-3 paragraph summary blending public info with internal data
- Frontend shows a "Generate Summary" button, with loading state, and caches the result in component state
- Summary is displayed as rendered text in a card

**Additional suggestions for the page** (worth considering):
- Recent activity preview (last 3 activities shown inline, not just in a tab)
- Key metrics row: revenue, total placements value, active jobs count -- but as simple inline text, not cards

### Technical approach

1. **New edge function**: `supabase/functions/company-summary/index.ts`
   - Uses `LOVABLE_API_KEY` (already available) to call Lovable AI Gateway
   - Non-streaming response via `supabase.functions.invoke()`
   - System prompt instructs the model to write a brief company profile given the name, domain, and CRM context
   - Add to `config.toml` with `verify_jwt = false`

2. **SiteDetail.tsx changes**:
   - Remove the 5-card grid (lines 370-402)
   - Add a query for primary address (already fetched, just surface the `is_primary` one in header)
   - Add a query for main contact: from `crm_career_history` where `is_current = true`, pick the first, join contact emails via `crm_contact_emails`
   - Add AI summary card with generate button + loading spinner + result display
   - Show main contact name/title/email inline in the header metadata row
   - Show HQ address inline in the header metadata row

3. **Files to create/edit**:
   - Create `supabase/functions/company-summary/index.ts`
   - Edit `supabase/config.toml` (add function entry)
   - Edit `src/pages/SiteDetail.tsx` (major UI restructure of the top section)

