

## Problem

The `<button>` element wrapping each note (line 196-222 of `ContactNotes.tsx`) contains block-level elements (`<div>` on line 201, `<p>` on line 216). This is **invalid HTML** -- `<button>` can only contain phrasing content, not block elements like `<div>` and `<p>`. Browsers silently restructure the DOM to fix this, which breaks React's virtual DOM reconciliation and event handling. The click handler on the `<button>` never fires correctly.

## Plan

**File: `src/components/ContactNotes.tsx`**

Replace the `<button>` wrapper with a `<div>` that has proper interactive attributes:

```tsx
<div
  role="button"
  tabIndex={0}
  className="w-full text-left p-3 space-y-1 cursor-pointer"
  onClick={() => toggleExpand(noteKey)}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpand(noteKey); }}
>
```

This preserves accessibility (keyboard interaction, screen reader semantics) while allowing block-level children. No other changes needed -- the expand/collapse state logic is already correct.

