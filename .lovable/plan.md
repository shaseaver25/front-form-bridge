

## Goal

Enable automatic daily Gmail sync so Juliet (and Shannon) get their emails synced once per day, with matched emails appearing in client correspondence automatically.

## Current State

- Gmail sync edge function exists and works when triggered manually
- "Auto-Sync" toggle exists in the UI but has **no backend cron job** -- it is a dead toggle
- Contact matching already works during sync (cross-references `crm_contact_emails`)
- Unmatched emails (from people not in contacts) are stored but invisible in the CRM

## What Needs to Happen

### 1. Create a daily cron job for Gmail auto-sync

Use `pg_cron` + `pg_net` to call the `gmail-sync` edge function once per day for each user who has `auto_sync_enabled = true`.

This requires a small wrapper edge function (`gmail-auto-sync`) that:
- Queries all `gmail_connections` where `is_active = true` AND `auto_sync_enabled = true`
- Calls the existing sync logic for each connection (using the service role key, not a user JWT)
- The existing `gmail-sync` function needs a minor update to support service-role invocation (currently requires a user JWT)

Schedule: once daily (e.g., 6 AM UTC).

### 2. Update `gmail-sync` to support service-role calls

Add an alternative auth path: if called with a `connection_id` in the body (and authenticated via service role), skip the user JWT check and sync that specific connection directly. This lets the cron-triggered wrapper call it per-connection.

### 3. No changes needed for contact matching

The existing matching logic in `gmail-sync` already cross-references all email addresses against `crm_contact_emails` and sets `matched_contact_id`. The `ContactCorrespondence` component already displays matched emails. This works automatically -- no extra setup per user.

## Files to create/update

- **Create** `supabase/functions/gmail-auto-sync/index.ts` -- cron-triggered wrapper
- **Update** `supabase/functions/gmail-sync/index.ts` -- support service-role auth path
- **Update** `supabase/config.toml` -- add `gmail-auto-sync` function config
- **SQL** -- create `pg_cron` job to call `gmail-auto-sync` daily

## What Juliet needs to do

1. Connect her Gmail on the Gmail Settings page (OAuth flow)
2. Turn on the "Auto-Sync" toggle
3. That's it -- emails will sync daily and matched ones appear in contact correspondence automatically

## Unmatched emails

Emails from people not in contacts are stored but not surfaced anywhere. No change proposed here unless you want a separate "unmatched emails" view.

