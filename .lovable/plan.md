
Root cause is now clear: this is primarily a data/storage problem, not a UI loading problem.

What I verified
- On the affected contact (`49817374-1bf9-4f08-bd1e-eac6be10cdb0`), `crm_contact_notes` returns zero rows.
- That same contact has only 2 `crm_activities` rows, and both have:
  - `subject = null`
  - `body = null`
- The preview network request for `crm_contact_notes` succeeds with `200` and returns `[]`.
- The session replay shows the UI expanding “Meeting logged” and “Note”, which matches the fallback labels in `ContactNotes.tsx` for activities that have no text body.

Why the UI looks broken
- `ContactNotes.tsx` is doing this:
  - fetches `crm_contact_notes`
  - fetches `crm_activities`
  - if an activity has no text, it renders a fallback label like “Meeting logged”
- So when you only see titles, that is because the database rows being rendered do not contain note body text.

Deeper systemic issue I found
- This is widespread in the data, not just one contact:
  - `crm_activities` with `activity_type='note'`: 1250 total, only 9 have any text, 1241 have no subject/body
  - `meeting`: 183 total, only 1 has text
  - `email_received`: 334 total, only 6 have text
- That means the imported/synced activity dataset is mostly missing body content.

Important code-level cause
In `supabase/functions/crelate-sync/index.ts`:
```ts
const noteRows = rows
  .filter(r => r.contact_id && (r.body || r.subject))
```
Then later:
```ts
const { data: existingNotes } = await supabase
  .from("crm_contact_notes")
  .select("id")
  .limit(1);

if (!existingNotes || existingNotes.length === 0) {
  // insert all noteRows
} else {
  console.log("Contact notes already exist, skipping population to avoid duplicates");
}
```

That means:
- The sync only populates `crm_contact_notes` if the entire table is empty.
- Once even one note exists anywhere in the table, later imports/syncs never backfill notes for other contacts.
- So a “complete data load into Supabase” would still not show note bodies in this UI unless:
  1. those bodies were actually loaded into `crm_activities` or `crm_contact_notes`, and
  2. the one-time table-empty gate did not block note creation.

Diagnosis summary
1. The page is loading successfully.
2. The current contact has no `crm_contact_notes`.
3. The fallback activity rows have no stored text.
4. The sync/import logic has a global guard that prevents note backfill after the first seed.
5. Therefore the real fix is in the data ingestion/backfill path, not in the note card rendering.

Implementation plan
1. Fix note backfill logic in `crelate-sync`
- Remove the global “only insert if crm_contact_notes is empty” behavior.
- Replace it with per-record deduplication/backfill logic, e.g. insert missing notes per contact/content/timestamp instead of skipping the whole table.
- Keep manual notes safe by only backfilling generated notes from activity-derived content.

2. Add a durable provenance field for generated notes
- Add a column such as `source_type` / `source_activity_id` / `source_crelate_id` on `crm_contact_notes`.
- This lets the app distinguish:
  - manual notes
  - synced/generated notes
- It also makes deduplication and re-import safe.

3. Backfill note bodies from existing activity data where possible
- Create a migration/backfill step that populates `crm_contact_notes` from existing `crm_activities` rows that do have text.
- This will recover note bodies for records already present in the database.

4. Improve the UI to avoid misleading output
- In `ContactNotes.tsx`, separate:
  - real notes with content
  - activity events without content
- Show empty-text activities as activity log items, not as if they were full notes.
- Add a clear empty-state message like “No note body was imported for this activity.”

5. Audit the import source mapping
- Review where your “complete data download” landed:
  - if it populated `crm_contact_notes`, the UI should show it
  - if it only populated `crm_activities` but those rows still lack body text, the source import mapping is incomplete
- Confirm whether the raw source dataset contains note text that never made it into these two tables.

Technical details
```text
Current behavior
Contact page
  -> fetch crm_contact_notes (empty)
  -> fetch crm_activities (2 rows, no text)
  -> render fallback labels only

Real fix path
source import / sync
  -> ensure note text lands in crm_activities and/or crm_contact_notes
  -> backfill missing crm_contact_notes safely
  -> render activities without pretending they are full notes
```

Files and areas to change
- `supabase/functions/crelate-sync/index.ts`
  - remove table-empty guard
  - implement per-note backfill logic
- database migration
  - add provenance/dedup fields to `crm_contact_notes`
- `src/components/ContactNotes.tsx`
  - distinguish contentful notes from textless activities
  - improve empty/fallback messaging

Expected outcome after fix
- Contacts with imported note bodies will display full note content.
- Contacts with only textless activities will no longer look like “broken notes”; they will appear as activity events with explicit no-body messaging.
- Future syncs/imports will correctly backfill missing notes instead of silently skipping because the table is no longer empty.
