

## ROI Dashboard — What's Needed to Make It Work

### Current State
The ROI dashboard is built and renders, but it shows empty data because:
1. The `unified_tasks` table has only **1 row** with **no time logged** and **no outcomes**
2. The `board_cards` table has **2 cards** with **no hours logged** and **none completed**
3. The ROI hooks only query `unified_tasks` — they don't include board cards (same gap we just fixed for the task list)
4. The team performance table shows "Team Member" for everyone because it never fetches actual user names

### The Core Problem
ROI data depends on two things being tracked:
- **Time invested** (`actual_time_minutes` on unified_tasks, `actual_hours` on board_cards)
- **Outcomes** (linking completed tasks to placements/revenue via `outcome_amount`, `outcome_id`)

Neither is being populated right now.

### Plan

**Step 1: Update ROI hooks to include board_cards data**
- Modify `useTaskROIByCategory`, `useTaskROIByUser`, and `useTaskSummaryStats` in `src/hooks/useTaskROI.ts`
- Fetch from both `unified_tasks` AND `board_cards`, merge results before aggregating
- Map `board_cards.actual_hours` → minutes for consistency
- For team member names: join with `user_profiles` table to get real names instead of "Team Member"

**Step 2: Add time tracking to board cards**
- When a board card is completed (moved to done column or marked complete), prompt for actual hours spent
- Add an "Log Hours" action on task cards in the unified task list so users can record time
- This populates the `actual_hours` field on `board_cards` and `actual_time_minutes` on `unified_tasks`

**Step 3: Add outcome linking**
- When completing a task, allow linking it to a placement from `crm_placements` (which has `fee_amount`)
- This populates `outcome_id` and `outcome_amount` on unified_tasks
- For board cards, use `linked_donation_id` (which maps to placements in the current schema)

**Step 4: Rename dashboard labels for recruiting context**
- "Total Outcomes" → "Total Placement Fees"
- "Outcome Rate" → "Placement Conversion Rate"
- "Revenue/Hour" stays as-is (makes sense for recruiting)
- "Tasks with Outcomes" → "Tasks with Placements"

### Files to Modify
- `src/hooks/useTaskROI.ts` — merge board_cards data, fetch user names
- `src/components/tasks/TaskROIDashboard.tsx` — rename labels
- `src/components/tasks/UnifiedTaskList.tsx` — add "Log Hours" action
- `src/components/tasks/CreateTaskDialog.tsx` or new component — add time/outcome logging UI

### Result
Once implemented, the dashboard will show real data as soon as team members start logging hours on their tasks and linking completed tasks to placements. The charts and team table will populate automatically.

