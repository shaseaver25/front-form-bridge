

# AvidEdge Search — Functional Components Report

**Date:** March 14, 2026

I'll generate a complete report as a Markdown document covering every functional area of the application as it exists today. This will update the existing CAPABILITIES.md (last updated March 7) with additions made since then (Apollo.io enrichment, contact headshots, additional edge functions).

The report will be produced as a downloadable Markdown file at `/mnt/documents/AvidEdge_Functional_Report_2026-03-14.md`.

### What the report will cover

1. **Overview** — platform description and terminology
2. **Landing Page & Public Site** — marketing, public routes, legal pages
3. **Authentication & Onboarding** — auth, invitations, setup wizard
4. **Dashboard** — widgets and quick links
5. **Contact Management (CRM)** — full CRUD, search, filtering, headshot display, Apollo.io enrichment
6. **Company Management** — profiles, AI summaries, associated data
7. **Job Management** — job records, team assignment, tier gating
8. **Pipeline Management** — pipeline dashboard, stages, archived opportunities
9. **Placements** — placement records and tracking
10. **Task Management** — unified tasks, ROI scoring, time tracking
11. **Calendar** — Google Calendar sync
12. **Project Boards (Kanban)** — drag-and-drop, templates, AI suggestions, board dashboard
13. **Voice Notes** — recording, transcription, AI processing
14. **Email Outreach** — templates, campaigns, email log
15. **Campaigns** — multi-channel campaign management
16. **Content Repository** — centralized content
17. **Events & Volunteer Management** — events, registration, volunteer coordination
18. **Talent Pool** — applications, pool management
19. **Employee Feedback** — feedback dashboard and forms
20. **Meeting Transcripts** — transcription, task extraction
21. **Integrations** — all 11 supported integrations
22. **AI Assistant (Chip)** — chat, voice, TTS, support tickets
23. **Contact Enrichment** — Apollo.io People Match integration (NEW)
24. **Help & Support System** — help docs, training, tickets
25. **Admin Panel** — user/role management, activity log
26. **Super Admin (SaaS)** — multi-tenant management
27. **Subscription & Tier Gating** — feature gating by plan
28. **Security & Access Control** — RLS, role guards
29. **Supabase Edge Functions** — all 7 deployed functions
30. **Technical Architecture** — frontend, backend, database, libraries

### New items not in existing CAPABILITIES.md
- **Apollo.io Contact Enrichment** — `enrich-contact` edge function calling Apollo People Match API, updating `enrichment_data`, `enrichment_status`, LinkedIn URL insertion
- **Contact Headshot Display** — `RecordAvatar` component with `imageUrl` prop, signed URL resolution from `icon_attachment_url`
- **Company AI Summary** — `company-summary` edge function generating AI-powered company profiles
- **Chip TTS** — `chip-tts` edge function for ElevenLabs text-to-speech
- **Accept/Verify Invitation** edge functions
- **Executive Search** filtered views (ES Contacts, ES Companies, ES Jobs)
- **Employee Feedback** module (dashboard + forms)

### Deliverable
A comprehensive Markdown report file.

