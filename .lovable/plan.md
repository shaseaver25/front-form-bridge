

## CRM Data Audit: What Exists in Supabase but Is Not Shown

Here is every `crm_` table, its row count, and whether the CRM UI currently surfaces it:

```text
Table                   Rows    Shown in UI?   Where / Notes
─────────────────────── ─────── ────────────── ──────────────────────────────────
crm_contacts            3,062   YES            Constituents page, detail view
crm_companies           2,220   YES            Sites/Companies pages
crm_career_history      6,010   PARTIAL        Only used to link contacts→companies
crm_contact_emails      3,194   PARTIAL        Shown in ConstituentDetail only
crm_contact_phones      2,049   PARTIAL        Shown in ConstituentDetail only
crm_activities          2,970   YES            ActivityTimeline, SiteDetail
crm_jobs                   27   YES            Jobs page, SiteDetail
crm_contact_urls        4,920   NO ❌          Not displayed anywhere
crm_contact_tags        2,540   NO ❌          Not displayed anywhere
crm_tags                   15   NO ❌          Not displayed anywhere
crm_addresses           2,135   NO ❌          Not displayed anywhere
crm_contact_sources        42   NO ❌          Not displayed anywhere
crm_pipeline_items        110   COUNT ONLY ❌  Only a count on dashboard stats
crm_placements              6   COUNT ONLY ❌  Only a count on dashboard stats
crm_migration_log           0   N/A            Empty, internal migration tracking
```

### Data Not Being Shown

1. **Contact URLs** (`crm_contact_urls` — 4,920 rows): LinkedIn profiles, portfolio sites, etc. Not shown on contact detail or anywhere.

2. **Tags** (`crm_tags` + `crm_contact_tags` — 15 tags, 2,540 assignments): Contact tags exist but are never displayed or filterable. This is a significant missing feature for segmentation.

3. **Addresses** (`crm_addresses` — 2,135 rows): Physical addresses for contacts and companies. Not shown on contact detail or company detail pages.

4. **Contact Sources** (`crm_contact_sources` — 42 rows): How contacts were sourced (referral, job board, etc.). Not displayed anywhere.

5. **Pipeline Items** (`crm_pipeline_items` — 110 rows): Candidate-to-job pipeline stages. Only a count appears on the dashboard. No dedicated pipeline view showing candidates per job, their status, ratings, or stage progression.

6. **Placements** (`crm_placements` — 6 rows): Completed placements with salary, fee, and date data. Only a count on the dashboard. No detail view or list.

7. **Career History detail** (`crm_career_history` — 6,010 rows): Only `is_current` entries are used to link contacts to companies. Past positions, education entries, descriptions, and date ranges are not displayed on contact profiles.

### Summary of What to Build

| Priority | Feature | Table(s) |
|----------|---------|----------|
| High | Pipeline board (candidates per job with stages) | `crm_pipeline_items`, `crm_jobs`, `crm_contacts` |
| High | Tags display and filtering on contacts | `crm_tags`, `crm_contact_tags` |
| High | Contact URLs on detail page (LinkedIn, etc.) | `crm_contact_urls` |
| Medium | Addresses on contact and company detail pages | `crm_addresses` |
| Medium | Placements list/detail view | `crm_placements` |
| Medium | Full career history on contact profile | `crm_career_history` |
| Low | Contact sources display/filter | `crm_contact_sources` |

