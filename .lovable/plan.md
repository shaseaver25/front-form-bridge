

# Fix: Notes & Activities Not Fully Loading

## Problem
The Notes & Activity feed silently drops activities that have no `subject` and no `body`. For this contact, there are 2 activities in the database but only 1 shows — a "meeting" activity is hidden because both its `subject` and `body` fields are null. This pattern affects all contact pages where activities like calls, meetings, and tasks were synced without text content.

## Root Cause
In `ContactNotes.tsx` line 89:
```js
.filter((a: any) => a.body || a.subject)
```
This removes any activity lacking both fields, making it invisible in the feed.

## Solution

### 1. Remove the filter — show all activities (ContactNotes.tsx)
- Remove the `.filter((a: any) => a.body || a.subject)` gate
- For activities with no subject/body, generate a display label from the activity type (e.g., "Meeting logged", "Call recorded", "Task created")
- Update the `content` construction to handle null subject+body gracefully

### 2. Improve activity display labels
- Add a mapping of `activity_type` to human-readable labels (meeting → "Meeting", call → "Call", email_sent → "Email Sent", etc.)
- When both subject and body are empty, use the label as the content so the card isn't blank

### 3. Fix forwardRef console warnings
- The console shows warnings about `Badge` and `RichTextDisplay` not using `forwardRef` — these are non-blocking but should be cleaned up in `RichTextDisplay` to avoid noise

## Files to Change
- `src/components/ContactNotes.tsx` — remove filter, add fallback content for empty activities

