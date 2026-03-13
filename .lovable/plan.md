

## Pipeline Page Rework

### The Problem

The current Pipeline Dashboard (`/pipeline`) has two tabs that don't match this business:

1. **Gift Pipeline Health** — queries a `major_gift_opportunities` table with nonprofit fundraising concepts (donor acquisition cost, gift sizes, cultivation/solicitation stages). This is a staffing/recruiting business.
2. **Programming Health** — queries `programs`, `program_beneficiaries`, and `outcome_metrics` tables. These are nonprofit program management concepts.

Meanwhile, the **Recruitment Pipeline** (`/recruitment-pipeline`) is the page that actually matches the business — it shows candidates flowing through hiring stages (new → screening → submitted → interview → offer → placed). This is the real pipeline for a staffing/recruiting firm.

### Recommendation

**Merge into a single Pipeline page** that serves as the recruitment pipeline dashboard with added analytics:

1. **Replace `/pipeline`** content with a redesigned page that has two tabs:
   - **Pipeline Board** — the current Recruitment Pipeline kanban (candidates by stage), with drag-and-drop to move candidates between stages
   - **Pipeline Analytics** — summary metrics built from real `crm_pipeline_items` and `crm_placements` data: total candidates, stage distribution, conversion rates, placement rate, time-in-stage

2. **Remove `/recruitment-pipeline`** as a separate route — fold it into `/pipeline`

3. **Update sidebar** — remove the "Recruiting" nav item since Pipeline now covers it

### What the new Pipeline Analytics tab will show (from real data)

- **Summary cards**: Total candidates in pipeline, Placements this month, Conversion rate (submitted → placed), Active jobs with candidates
- **Stage distribution**: Count per stage with visual bars
- **Conversion funnel**: new → screening → submitted → interview → offer → placed, with drop-off rates
- **Recent activity**: Latest stage changes

### Technical approach

- Rewrite `PipelineDashboard.tsx` to use the recruitment pipeline board as its primary tab (move/adapt code from `RecruitmentPipeline.tsx`)
- Add a new `RecruitmentAnalytics.tsx` component that queries `crm_pipeline_items` and `crm_placements` for the analytics tab
- Add drag-and-drop to the pipeline board (same pattern as `SitesKanban.tsx`)
- Remove `RecruitmentPipeline.tsx` and its route
- Update sidebar to remove the "Recruiting" entry
- Keep `GiftPipelineHealth.tsx` and `ProgrammingHealth.tsx` files but they'll no longer be referenced

### Files to modify
- `src/pages/PipelineDashboard.tsx` — full rewrite
- `src/routes/index.tsx` — remove `/recruitment-pipeline` route
- `src/components/AppSidebar.tsx` — remove Recruiting nav item
- New: `src/components/pipeline/RecruitmentAnalytics.tsx`
- Can delete: `src/pages/RecruitmentPipeline.tsx` (code absorbed into PipelineDashboard)

