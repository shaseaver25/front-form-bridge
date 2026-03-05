

## Company Cards - Data Analysis and Improvement Plan

### What's in the database vs. what's shown

**Current card shows:** name, domain, status badge, company_type badge, description, revenue

**What actually has data (out of 2,221 companies):**
- `name`: all records (always present)
- `status`: all records (but all are "active")
- `company_type`: all are "other" (not useful to display)
- `domain`: only 5 companies
- `description`: only 1 company
- `revenue`: only 1 company
- `primary_owner_id`: 36 companies
- URLs (website links from `crm_contact_urls`): 33 companies
- Addresses (`crm_addresses`): 1 company
- `icon_attachment_url`, `last_activity_date`, `last_engagement_date`, `parent_company_id`: none

**Related data that IS populated:**
- **Contact count** (via `crm_career_history`): many companies have 10-22+ current employees/contacts linked
- **Company URLs** (33 records in `crm_contact_urls` with `company_id`)
- **Jobs linked**: 0 currently
- **Placements**: 0 currently

### The problem

The cards are mostly empty because domain, description, revenue, and company_type are almost never populated. The most valuable piece of related data -- **how many contacts are linked to each company** -- is not shown at all.

### Plan

**1. Enrich the SitesHub query to fetch related counts and URLs**

In `SitesHub.tsx`, change the query from `select("*")` to also fetch:
- Contact count from `crm_career_history` (where `is_current = true`)
- Website URL from `crm_contact_urls` (where `company_id` matches)

Since Supabase doesn't support aggregated counts in `select`, we'll fetch the related data in parallel queries and merge it client-side (similar to the pattern used in `ConstituentList.tsx`).

**2. Redesign `SiteCard.tsx` to show what matters**

Replace the current card layout with one that prioritizes populated data:
- **Company name** (prominent)
- **Status badge** (keep, with color coding)
- **Website URL** from `crm_contact_urls` (fallback to `domain` field) with external link icon
- **Contact count** badge (e.g., "14 contacts") -- this is the most useful metric
- **Location** from `crm_addresses` if available
- **Description** if available (line-clamped)
- Remove `company_type` badge since all values are "other"
- Remove `revenue` display (only 1 record has it)

**3. Update `SitesPipeline.tsx` and `SitesKanban.tsx`**

These components render their own mini-cards that also need the enriched data (contact count, website URL). Pass the enriched site data through.

### Technical approach

- Add parallel queries in `SitesHub.tsx` for `crm_career_history` (grouped by `company_id`, count of distinct `contact_id` where `is_current`), `crm_contact_urls` (where `company_id IS NOT NULL`), and `crm_addresses` (where `company_id IS NOT NULL`)
- Merge into site objects before passing to child components
- Update `SiteCard.tsx` to render: name, status, website link, contact count, location
- Update pipeline/kanban mini-cards to show contact count

