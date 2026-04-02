

## Email Storage Optimization Plan

### Current Problem
- Gmail sync stores **all** 150 messages, but only **33** are matched to contacts
- The remaining 117 unmatched messages serve no CRM purpose and will keep growing
- The `gmail_messages` table acts as both a sync buffer and permanent storage, which is inefficient

### Recommended Architecture: Rolling Sync Buffer + Pinned Correspondence

The most efficient approach is a **two-tier model**:

1. **`gmail_messages` stays as a temporary sync buffer** — auto-purge messages older than 7 days that haven't been "saved" to a contact
2. **Add a "save to contact" action** — users can pin/save important emails from the correspondence panel, which copies key fields into `crm_activities` (the existing activity log table) with `activity_type = 'email'`
3. **Saved emails live permanently in `crm_activities`** — already linked to contacts, already has RLS, already shown in activity feeds

### Implementation Steps

**Step 1: Add a cleanup mechanism**
- Create a scheduled Edge Function (`gmail-cleanup`) that runs daily
- Deletes rows from `gmail_messages` where `internal_date` is older than 7 days AND the message has NOT been marked as saved
- Add a `is_saved` boolean column to `gmail_messages` to track which ones the user chose to keep

**Step 2: Add "Save to Contact" UI**
- In the ContactCorrespondence panel, add a bookmark/save icon on each Gmail message
- When clicked, copy the email data into `crm_activities` with `activity_type = 'email'`, `direction`, `subject`, `body` (snippet), linked to the `contact_id`
- Mark the source `gmail_messages` row as `is_saved = true` (so cleanup skips it, or optionally delete it since it's now in activities)

**Step 3: Update ContactCorrespondence to read from both sources**
- Continue reading from `gmail_messages` for recent/unsaved emails (the rolling 7-day window)
- Also read from `crm_activities` where `activity_type = 'email'` for permanently saved correspondence
- Merge and deduplicate in the UI

**Step 4: Schedule the cleanup cron**
- Daily pg_cron job calls the `gmail-cleanup` Edge Function
- Deletes `gmail_messages` rows older than 7 days where `is_saved = false`

### Database Changes
- Add column: `gmail_messages.is_saved` (boolean, default false)
- No new tables needed — reuses existing `crm_activities`

### Result
- `gmail_messages` stays small (only last 7 days + explicitly saved items)
- Important correspondence lives permanently in `crm_activities`, tied to contacts
- Users have explicit control over what gets kept

