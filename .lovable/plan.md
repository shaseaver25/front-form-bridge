

## Import Crelate CSV Data into Supabase

### Current state

Most data from these CSVs is **already synced** via the API:

| CSV File | CSV Rows | DB Rows | Status |
|----------|----------|---------|--------|
| Tags | ~15 | 16 (15 with crelate_id) | Already synced |
| TagRelationships | ~2,541 | 2,541 (2,540 with crelate_id) | Already synced |
| Urls | ~4,932 | 4,939 (4,920 with crelate_id) | Already synced |
| TimelineItems | ~6,019 | 7,195 (all with crelate_id) | Already synced (DB has more) |
| WorkflowItems | ~150 | 113 (110 with crelate_id) | **~40 missing** |
| Portals | ~824 | 1 | **~823 missing** |
| Users | ~14 | Reference only | N/A |
| RelationshipTypes | ~6 | Reference only | N/A |
| RelationshipGroups | ~1 | Reference only | N/A |
| SubmittalTemplates | ~13 | No target table | Skip |

### What to import

**1. WorkflowItems → `crm_pipeline_items` (~40 new records)**

Map CSV columns to existing table:
- `Id` → `crelate_id` (dedup key)
- `TargetId` (contact crelate_id) → look up `contact_id` from `crm_contacts.crelate_id`
- `JobId` → look up `job_id` from `crm_jobs.crelate_id`
- `WorkflowItemStatusId` → `status` (map values like "Declined - Client", "Placed", "New", etc.)
- `AverageRating` → `average_rating`
- `ExecutiveSummaryHtml` → `executive_summary`
- `LastActivityDateForThisJob` → `last_activity_date`
- `LastStageChange` → `last_stage_change`
- `CreatedOnSystem` → `created_at`

Only insert rows where `crelate_id` does not already exist in `crm_pipeline_items`.

**2. Portals → `briefing_room_clients` (~823 new records)**

Map CSV columns:
- `Id` → used as reference
- `Name` → `client_name`
- `AccountId` → `crm_company_id` (look up from `crm_companies.crelate_id`)
- `CompanyName` → fallback for client name
- `IsActive` → `is_active`
- `crm_search_id` → link to the related job/search

This requires inspecting the Portals CSV more carefully to determine which fields map to `crm_search_id` and `client_email`.

**3. Skip**: Tags, TagRelationships, Urls, TimelineItems (already fully synced). SubmittalTemplates (no target table). Users, RelationshipTypes, RelationshipGroups (reference data only).

### Implementation

Write a Python script that:
1. Reads the CSV files
2. Queries existing `crm_contacts` and `crm_jobs` by `crelate_id` to build lookup maps
3. Transforms WorkflowItems rows into `crm_pipeline_items` inserts, skipping duplicates
4. Transforms Portals rows into `briefing_room_clients` inserts
5. Runs the inserts via `psql`

### Technical details

- Uses `psql` with the pre-set env vars for database access
- Deduplicates on `crelate_id` using `ON CONFLICT DO NOTHING` or pre-filtering
- Status values from WorkflowItems (e.g., "Declined - Client", "Placed", "Interview") mapped to `crm_pipeline_items.status` values
- Portals CSV needs deeper inspection of its column structure before finalizing the mapping

