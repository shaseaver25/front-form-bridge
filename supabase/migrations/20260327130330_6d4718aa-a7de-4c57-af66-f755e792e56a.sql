
INSERT INTO crm_contact_notes (contact_id, content, is_pinned, created_at, source_type, source_activity_id, source_crelate_id)
SELECT 
  a.contact_id,
  CASE 
    WHEN a.subject IS NOT NULL AND a.body IS NOT NULL THEN a.subject || E'\n\n' || a.body
    WHEN a.subject IS NOT NULL THEN a.subject
    ELSE a.body
  END,
  a.is_pinned,
  COALESCE(a.scheduled_at, a.completed_at, a.created_at, now()),
  'sync',
  a.id,
  a.crelate_id
FROM crm_activities a
WHERE a.contact_id IS NOT NULL
  AND (a.body IS NOT NULL OR a.subject IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM crm_contact_notes cn
    WHERE cn.source_activity_id = a.id
  );
