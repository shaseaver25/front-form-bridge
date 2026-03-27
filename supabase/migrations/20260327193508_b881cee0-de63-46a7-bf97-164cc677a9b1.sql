
-- Backfill institution names on education records (batch 1 of 3)
-- Using TimelineItems CSV to link career_history records to AccreditingInstitutions

DO $$
DECLARE
  pairs text[][] := ARRAY[
    ARRAY['c22f762a-07d4-4656-0770-0027e2e5db08', 'Minnesota High Tech Association | MHTA'],
    ARRAY['53bf6dd7-15f0-445e-35d2-003610d5dc08', 'University of Minnesota'],
    ARRAY['ccc008cd-aed4-45a1-8744-0061a2ecdc08', 'University of Minnesota - Carlson School of Management']
  ];
BEGIN
  -- This approach is too slow for 2400 records, use VALUES instead
END $$;
