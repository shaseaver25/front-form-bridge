

## Fix: Pyrz's Notes and Activity Not Loading

### Root Cause Analysis

Data exists in the database (10 notes, 18 activities for Joe Pyrz). The `ContactNotes` component has two issues that could prevent data from appearing:

1. **No error handling**: If either the `crm_contact_notes` or `crm_activities` query fails (network issue, timeout, etc.), the `Promise.all` silently swallows the error. The component either stays stuck on "Loading notes..." or shows "No notes or activity yet" with no indication of failure.

2. **No retry/refetch mechanism**: The data is fetched once on mount via `useEffect`. If the initial fetch fails or returns empty due to a transient auth timing issue, there's no way to recover without navigating away and back.

3. **Missing error logging**: Neither query checks `error` from the Supabase response, making debugging impossible.

### Changes

**File: `src/components/ContactNotes.tsx`**

1. Add error handling to `fetchNotes`: check both `notesRes.error` and `activitiesRes.error`, log errors, and show a toast on failure
2. Remove the unnecessary `as any` cast on `crm_activities` (it's a valid table in the schema)
3. Add a retry button that appears when the fetch fails or returns empty, so users can manually refetch
4. Add a `try/catch` around the entire `fetchNotes` to handle unexpected failures
5. Increase the activity limit from 50 to 200 to ensure all activities load for contacts with extensive history

### Technical Detail

The key fix is wrapping the fetch in proper error handling:

```typescript
const fetchNotes = async () => {
  setLoading(true);
  try {
    const [notesRes, activitiesRes] = await Promise.all([...]);
    
    if (notesRes.error) {
      console.error("Failed to fetch notes:", notesRes.error);
      toast.error("Failed to load notes");
    }
    if (activitiesRes.error) {
      console.error("Failed to fetch activities:", activitiesRes.error);
    }
    // ... process data
  } catch (err) {
    console.error("Unexpected error fetching notes:", err);
    toast.error("Failed to load notes");
  } finally {
    setLoading(false);
  }
};
```

This ensures `setLoading(false)` always runs and errors are visible to both users and developers.

