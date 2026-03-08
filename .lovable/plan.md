

## Problem

Notes in the contact detail page don't visually respond to clicks. The expand/collapse logic only triggers for notes longer than 120 characters (`isLong`), but most synced notes have short content (just subjects). Clicking a short note does nothing visible -- no chevron icon, no state change.

## Plan

**File: `src/components/ContactNotes.tsx`**

Remove the `isLong` gate so all notes are expandable:

1. Always show the chevron icon (expand/collapse indicator) on every note, regardless of content length.
2. When collapsed, show a single-line truncated view (subject/content). When expanded, show full content plus additional metadata (activity type, full date).
3. Remove the `isLong` condition from both the chevron rendering and the `line-clamp` logic -- all notes get `line-clamp-1` when collapsed and full text when expanded.

This is a small change confined to the rendering logic in `ContactNotes.tsx`. No database or backend changes needed.

