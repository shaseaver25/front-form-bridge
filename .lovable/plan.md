

## Problem

The SiteDetail page queries contacts via `crm_contacts.primary_company_id`, but that field is NULL for every contact in the database. The actual contact-company relationship is stored in `crm_career_history` (with `company_id` and `is_current` flag).

Jobs and activities are only linked to ~10 and ~39 companies respectively, so most company pages will legitimately show empty for those tabs. But contacts should show data for many more companies.

## Plan

### 1. Fix contact fetching in SiteDetail.tsx

Replace the contacts query to join through `crm_career_history`:

```sql
SELECT DISTINCT c.id, c.first_name, c.last_name, c.job_title, c.status, ch.job_title as career_title
FROM crm_career_history ch
JOIN crm_contacts c ON c.id = ch.contact_id
WHERE ch.company_id = :siteId AND ch.is_current = true
ORDER BY c.last_name
```

This fetches contacts who have a current career history entry at the company.

### 2. Update the contacts display

Use `career_title` from the career history as a fallback for `job_title` display since the contact's own `job_title` may differ from their role at this specific company.

### 3. Files to modify

- **`src/pages/SiteDetail.tsx`** — Update the `company-contacts` query to join through `crm_career_history` instead of filtering `crm_contacts` by `primary_company_id`.

