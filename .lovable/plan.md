

## Add Tag Management to Contact Detail Page

Currently, tags are displayed as read-only badges on the contact detail page. There is no UI to add or remove tags from a contact. We need to add a tag management feature so users can tag contacts with "Executive Search" (or any other tag).

### Changes

**File: `src/pages/ContactDetail.tsx`**

1. Add a tag management section near the existing tags display (around line 360-369):
   - Show a "+" button next to the tag badges that opens a popover
   - The popover contains a searchable list of all available tags from `crm_tags`
   - Already-applied tags are shown as checked/highlighted
   - Clicking an unapplied tag inserts into `crm_contact_tags`; clicking an applied tag removes it
   - Add an "x" button on each tag badge to quickly remove it

2. Add state and fetch logic:
   - `allTags` state: fetched from `crm_tags` on mount
   - `addTag(tagId)`: inserts into `crm_contact_tags` and refreshes
   - `removeTag(tagId)`: deletes from `crm_contact_tags` and refreshes

3. This works regardless of edit mode — tags can be toggled at any time (similar to how notes work).

### Technical Detail

- Uses existing `Popover` + `Command` (cmdk) components for the searchable tag picker
- Tag add: `supabase.from("crm_contact_tags").insert({ contact_id: id, tag_id: tagId })`
- Tag remove: `supabase.from("crm_contact_tags").delete().eq("contact_id", id).eq("tag_id", tagId)`
- If "Executive Search" tag doesn't exist yet, users can find and apply it once it's seeded (already done in prior migration)
- No schema changes needed — all tables and RLS policies are already in place

