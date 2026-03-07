# AvidEdge Search — Platform Capabilities Document

**Version:** 1.0  
**Last Updated:** March 7, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Landing Page & Public Site](#landing-page--public-site)
3. [Authentication & Onboarding](#authentication--onboarding)
4. [Dashboard](#dashboard)
5. [Contact Management (CRM)](#contact-management-crm)
6. [Company Management](#company-management)
7. [Job Management](#job-management)
8. [Pipeline Management](#pipeline-management)
9. [Placements](#placements)
10. [Task Management](#task-management)
11. [Calendar](#calendar)
12. [Project Boards (Kanban)](#project-boards-kanban)
13. [Voice Notes](#voice-notes)
14. [Email Outreach](#email-outreach)
15. [Campaigns](#campaigns)
16. [Content Repository](#content-repository)
17. [Events & Volunteer Management](#events--volunteer-management)
18. [Talent Pool](#talent-pool)
19. [Meeting Transcripts](#meeting-transcripts)
20. [Integrations](#integrations)
21. [AI Assistant (Chip)](#ai-assistant-chip)
22. [Help & Support System](#help--support-system)
23. [Admin Panel](#admin-panel)
24. [Super Admin (SaaS Management)](#super-admin-saas-management)
25. [Subscription & Tier Gating](#subscription--tier-gating)
26. [Security & Access Control](#security--access-control)
27. [Technical Architecture](#technical-architecture)

---

## 1. Overview

AvidEdge Search is a full-featured CRM and executive search management platform built for retained executive search firms. It combines contact/company management, job pipeline tracking, placement recording, project management, AI-powered assistance, email outreach, and multi-tenant SaaS administration into a single unified application.

**Terminology mapping:**
| UI Label | Internal Term |
|----------|---------------|
| Contacts | Constituents |
| Companies | Sites/Organizations |
| Jobs | Grants |
| Clients | Donors |

---

## 2. Landing Page & Public Site

- **Marketing landing page** with hero section, value propositions, and call-to-action
- **Navigation sections:** Exec Search, Advisory, About, Connect
- **Value Proposition Cards:** Strategic Alignment, AvidEdge Match™ (90-day executive coaching), Advisory Services (fractional CTO, IT assessments)
- **Public routes:**
  - Event registration (`/register/event/:eventId`)
  - Program registration (`/register/program/:offeringId`)
  - Volunteer sign-up (`/volunteer/:slug`)
  - Volunteer opportunities (`/volunteer-opportunities/:boardId`)
  - Public donation pages (`/donate/:slug`)
  - Talent pool applications (`/apply`, `/apply/speaker`, `/apply/teacher`, `/apply/intern`)
- **Legal pages:** Terms of Service, Privacy Policy

---

## 3. Authentication & Onboarding

- **Supabase Auth** with email/password authentication
- **Password reset** flow (`/reset-password`)
- **User invitation system** — admins can invite users via email with role assignment
  - Invitation acceptance flow (`/auth/accept-invitation`)
  - Invitation tokens with expiration
  - Pre-assigned roles and metadata (name, department, job title)
- **Bootstrap/Setup Wizard** for initial organization configuration
- **Session management** with automatic token refresh and auth state listeners

---

## 4. Dashboard

- **Personalized welcome message** with user greeting
- **Widget grid layout** including:
  - **Quick Links** — fast navigation to key areas
  - **Unified Tasks Widget** — aggregated tasks from all sources
  - **Recent Activity** — latest CRM activity stream
  - **Tailored Customers Widget** — key client overview
  - **Upcoming Events Widget** — next scheduled events
  - **Meetings This Week Widget** — weekly meeting summary

---

## 5. Contact Management (CRM)

- **Full contact CRUD** — create, read, update, delete contacts
- **Contact types** — candidates, clients, and other contact types
- **Detailed contact profiles:**
  - Multiple email addresses (categorized, primary flag, invalid flag)
  - Multiple phone numbers (categorized, primary flag, extensions)
  - Multiple addresses (categorized, primary flag, with full address fields)
  - Web/social URLs (LinkedIn, etc.)
  - Career history (employment and education entries)
  - Job title, salary information (current, desired min/max)
  - Avatar/icon attachment
  - Description/bio
- **Contact relationships** — link contacts to companies
- **Tag system** — categorized tags with bulk tagging
- **Contact notes** — with pinning support
- **Contact documents** — file uploads with metadata
- **Contact source tracking** — where contacts originated
- **Activity timeline** — full history of interactions per contact
- **Email activity view** — email correspondence history
- **Search & filtering:**
  - Full-text search across names, emails, titles
  - Tag-based filtering with multi-select
  - Filter chips with clear-all functionality
  - Result count display (showing X of Y)
- **List density toggle** — compact/comfortable view modes
- **Floating action buttons** — quick view, edit, delete per contact
- **Average rating** tracking per contact
- **Last activity/engagement/reach-out dates** — automatic tracking
- **Crelate ID mapping** — for migration/sync from Crelate ATS

---

## 6. Company Management

- **Company profiles** with:
  - Company name, type, status
  - Description and domain
  - Revenue tracking
  - Icon/logo attachment
  - Parent company relationships (hierarchical)
  - Contact source tracking
  - Primary owner assignment
- **Company detail pages** (`/sites/:siteId`)
- **Company editing** (`/sites/:siteId/edit`)
- **Associated contacts** — view all contacts linked to a company
- **Associated addresses and URLs** — company locations and web presence
- **Site media** management
- **Site metrics** tracking
- **Site programs** management
- **Site stories** — narrative content about companies
- **Organization type badges** with icons and color coding
- **Last activity/engagement dates**

---

## 7. Job Management

- **Job records** with comprehensive fields:
  - Job title, name, description, type
  - Location and remote type
  - Compensation details (salary min/max, hourly rate min/max)
  - Number of openings and placements
  - Priority level
  - Status tracking
  - Start date, estimated close date, closed-on date
- **Job detail pages** (`/jobs/:jobId`)
- **Company association** — link jobs to hiring companies
- **Team assignment:**
  - Recruiter (primary)
  - Secondary recruiter
  - Account manager
- **Board association** — link jobs to project boards
- **Tier-gated** — requires Professional subscription tier
- **Grant documents** — attached files per job
- **Crelate ID mapping** for migration

---

## 8. Pipeline Management

- **Pipeline dashboard** (`/pipeline`) — visual overview of all candidates in process
- **Pipeline items** — candidates linked to jobs with:
  - Stage tracking with last-stage-change timestamps
  - Status management
  - Executive summary
  - Average rating
  - Added-by tracking
- **Archived opportunities** view (admin-only)
- **Retention dashboard** — client retention analytics
- **Compliance dashboard** — regulatory compliance tracking

---

## 9. Placements

- **Placement records** with:
  - Contact and job association
  - Placement date and start date
  - Salary amount
  - Fee tracking (amount and percentage)
  - Notes
  - Pipeline item linkage
- **Placement listing page** (`/placements`)

---

## 10. Task Management

- **Unified task system** aggregating tasks from multiple sources:
  - CRM activities
  - Board cards
  - Email suggestions
  - Voice note next steps
  - Meeting transcript action items
- **Task features:**
  - Due date tracking with overdue/today/upcoming grouping
  - Priority levels with color coding
  - Assignee management with reassignment dialog
  - Completion toggling
  - Task archiving
- **Sorting modes:** by due date, ROI score, or priority
- **ROI estimation** — AI-powered task ROI scoring with:
  - Score and potential value
  - Confidence level
  - Suggested priority
  - Detailed calculation breakdown
- **Priority scoring** — algorithmic priority estimation with confidence dots
- **Time tracking** — log time spent on tasks
- **Outcome attribution** — link task completion to business outcomes
- **Email task suggestions** page (`/tasks/email-suggestions`)
- **My Tasks** view — personal task filtered view

---

## 11. Calendar

- **Calendar page** (`/calendar`) with event visualization
- **Google Calendar sync** integration
- **Calendar sync hooks** for real-time updates

---

## 12. Project Boards (Kanban)

- **Board hub** (`/projects`) — overview of all project boards
- **Kanban board view** with drag-and-drop (powered by @hello-pangea/dnd):
  - Columns with customizable names
  - Cards with headlines, descriptions, priority, due dates
  - Subtask tracking with progress indicators
  - Comment counts
  - Assignee avatars
  - Blocked status indicators
  - Spawned subtask indicators
- **Board features:**
  - Search and filtering within boards
  - Member invitations
  - AI suggestions for cards
  - Keyboard shortcuts (with help dialog)
  - Board settings
  - Board templates (`/projects/templates`)
- **Board dashboard** (`/projects/:boardId/dashboard`) — analytics per board
- **Board calendar view** (`/projects/:boardId/calendar`)
- **Board documents** — attach files to boards
- **Board permissions** — role-based access per board
- **Real-time card updates** via Supabase realtime
- **Subtask card spawning** — auto-create cards from subtasks
- **Collaboration features** with presence indicators

---

## 13. Voice Notes

- **Voice notes hub** (`/voice-notes`) — browse and manage voice notes
- **Voice recorder** (`/voice-recorder`) with speech-to-text
- **Voice note processing:**
  - Attendee identification (search contacts by name)
  - Meeting notes capture via speech
  - Next steps extraction
  - Task creation from voice notes
- **Text-to-speech playback** with ElevenLabs TTS (browser fallback)
- **Keyboard shortcuts** for recording control
- **Voice origin badges** — track where voice notes originated
- **Tier-gated** — requires Professional subscription
- **Supabase Edge Function** (`chip-voice-note`) for AI processing

---

## 14. Email Outreach

- **Email marketing dashboard** (`/email-marketing`) — overview and analytics
- **Email template system:**
  - Template library (`/email-marketing/templates`)
  - Template creation and management (`/email-templates`)
  - Settings-accessible templates (`/settings/email-templates`)
- **Email campaigns** (`/email-campaigns`) — bulk email management
- **Email campaign builder** — visual campaign composition
- **Email composer** — rich email authoring
- **Email log** (`/communications/email-log`) — sent email history
- **Email settings** (`/settings/email`) — SMTP/provider configuration
- **Email task suggestions** — AI-generated follow-up recommendations
- **N8N email configuration** support

---

## 15. Campaigns

- **Campaign dashboard** (`/campaigns`) — all campaigns overview
- **Campaign composer** (`/campaigns/new`, `/campaigns/:id`) — create/edit campaigns
- **Multi-channel campaign support**

---

## 16. Content Repository

- **Content repository** (`/content-repository`) — centralized content management
- **Content assets** with forms for creation
- **Link content assets to contacts/entities**
- **Search documents** functionality

---

## 17. Events & Volunteer Management

- **Events page** (`/events`) — event listing and management
- **Event detail pages** (`/events/:id`)
- **Event registration** — public registration forms
- **Event statistics** tracking
- **Volunteer management:**
  - Volunteer events admin page
  - Public volunteer event listing
  - Volunteer sign-up forms
  - Volunteer opportunity boards
  - Volunteer dashboard with:
    - Summary statistics
    - Date filtering
    - Signup status management (Confirm, Attended, No Show)
    - Constituent details per signup
- **Program offerings** and public registration

---

## 18. Talent Pool

- **Talent pool management** (`/talent-pool`)
- **Pool dashboard** (`/pool-dashboard`) — analytics and overview
- **Public application forms:**
  - General pool application (`/apply`)
  - Speaker application (`/apply/speaker`)
  - Teacher application (`/apply/teacher`)
  - Intern application (`/apply/intern`)
- **Pool members** management
- **Pool engagements** tracking
- **Pool references** management

---

## 19. Meeting Transcripts

- **Meeting transcripts page** (`/meetings`) — browse all transcripts
- **Individual transcript view** (`/meetings/:transcriptId`)
- **Meeting upload** functionality
- **Transcript-to-task extraction** — generate tasks from meeting content
- **Fireflies integration** for automatic transcription

---

## 20. Integrations

- **Integrations hub** (`/integrations`) — manage all third-party connections
- **Supported integrations:**
  | Integration | Description |
  |-------------|-------------|
  | **Crelate** | ATS sync — contact, company, job, pipeline migration |
  | **Salesforce** | CRM import wizard with field mapping |
  | **QuickBooks** | Financial/accounting integration with OAuth callback |
  | **Stripe** | Payment processing |
  | **Givebutter** | Donation platform |
  | **Notion** | Knowledge base sync |
  | **Gmail** | Email integration |
  | **Google Calendar** | Calendar sync |
  | **Fireflies** | Meeting transcription |
  | **LMS** | Learning management system |
  | **N8N** | Workflow automation (email) |
- **Crelate Sync** — Supabase Edge Function for data migration with:
  - Migration log tracking
  - Sync log with status, records synced/created/updated/failed
  - Entity-type-based sync

---

## 21. AI Assistant (Chip)

- **Floating bubble interface** — always-accessible from any authenticated page
- **Animated avatar** — video-based character (chip-avatar.mp4)
- **Chat capabilities:**
  - Natural language CRM queries
  - Context-aware responses (knows current page, user role, subscription tier)
  - Chat history within session
  - Quick action pills (Donors, Events, Data, Help, Report Issue)
- **Voice interaction:**
  - Speech-to-text input via Web Speech API
  - Text-to-speech responses via ElevenLabs
  - Voice note recording flow
- **Support ticket creation** — issues auto-logged from conversations
- **AI-powered issue resolution** — attempts to resolve reported issues before escalating
- **Super admin ticket panel** — view and manage all support tickets
- **Powered by Supabase Edge Functions** (`help-assistant`)

---

## 22. Help & Support System

- **Help bubble** — secondary help interface with:
  - "How do I…" mode for usage guidance
  - "Report issue" mode for bug reporting
  - Ticket management (super admin)
- **Help documentation:**
  - Help docs page (`/help`)
  - Training articles (`/help/training`, `/help/training/:articleSlug`)
  - Technical documentation (`/technical-docs`)
- **Support ticket system:**
  - Severity levels (low, medium, high, critical)
  - Status tracking (open, in_progress, resolved)
  - AI response logging
  - AI resolution flag
  - Admin notes
- **Admin help management** — content management for help articles

---

## 23. Admin Panel

- **Admin dashboard** (`/admin`) — system overview (requires admin role)
- **User management:**
  - User listing (`/admin/users`)
  - Create new users (`/admin/users/new`)
  - Edit users (`/admin/users/:userId/edit`)
  - User invitation with role pre-assignment
- **Role management** (`/admin/roles`) — assign and manage user roles
- **Activity log** (`/admin/activity-log`) — audit trail of system actions
- **Support access log** (`/admin/support-access-log`) — super admin access tracking
- **Help content administration** (`/admin/help`)
- **Admin action logging** — automatic audit trail

---

## 24. Super Admin (SaaS Management)

- **Multi-tenant customer management:**
  - Customer listing (`/admin/customers`)
  - New customer creation (`/admin/customers/new`)
  - Customer detail/editing (`/admin/customers/:id`)
- **Template management** (`/admin/templates`) — manage SaaS-wide templates
- **Schema export** (`/admin/schema-export`) — database schema documentation
- **Config sync** — synchronize customer configurations
- **Organization management** — feature flags, terminology, and settings per tenant
- **Super admin access logging** — tracks all super admin page visits
- **Support mode banner** — visual indicator when in support mode

---

## 25. Subscription & Tier Gating

- **Subscription tiers:** Free, Professional, Enterprise
- **Feature gating** via `TierGate` component:
  - Jobs/Grants — Professional+
  - Major Gifts — tier-gated
  - Voice Notes — Professional+
- **Feature access hooks** (`useFeatureAccess`) for programmatic checks
- **Upgrade page** (`/upgrade`) — plan comparison and upgrade flow
- **Tier-based sidebar visibility** — menu items hidden below required tier

---

## 26. Security & Access Control

- **Row-Level Security (RLS)** on all database tables
- **Role-based access control:**
  - Roles: `admin`, `moderator`, `user`
  - Stored in dedicated `user_roles` table (not on profile)
  - `has_role()` security definer function for safe RLS policy checks
- **Route guards:**
  - `RequireAdmin` — blocks non-admin users
  - `SuperAdminGuard` — blocks non-super-admin users
  - `TierGate` — blocks users below required subscription tier
  - `FeatureGate` — blocks users without specific feature access
- **User profiles** synced from `auth.users` via database trigger
- **Field locking** — prevent concurrent edits
- **Secure secret management** hooks

---

## 27. Technical Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** build tooling with lazy-loaded routes for code splitting
- **Tailwind CSS** with custom design system (HSL tokens, dark mode support)
- **shadcn/ui** component library (40+ components)
- **React Router v6** with centralized route configuration
- **TanStack React Query** for server state management
- **Sonner** for toast notifications

### Backend
- **Supabase** (PostgreSQL, Auth, Storage, Edge Functions, Realtime)
- **Edge Functions:**
  - `crelate-sync` — Crelate ATS data synchronization
  - `send-user-invitation` — email invitation delivery
  - `help-assistant` — AI chat/support (referenced, hosted externally)
  - `chip-voice-note` — voice note AI processing (referenced)

### Database Schema
- **16+ CRM tables:** contacts, companies, jobs, pipeline items, placements, activities, addresses, emails, phones, URLs, tags, career history, notes, documents, sources, migration/sync logs
- **User management tables:** user_profiles, user_roles, user_invitations
- **Support tables:** support_tickets
- **Board/project tables** (managed via hooks)
- **Enum types:** `app_role` (admin, moderator, user)

### Key Libraries
| Library | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Database, auth, realtime |
| `@tanstack/react-query` | Server state & caching |
| `@hello-pangea/dnd` | Drag-and-drop boards |
| `react-hook-form` + `zod` | Form management & validation |
| `recharts` | Data visualization |
| `date-fns` | Date formatting |
| `dompurify` | HTML sanitization |
| `react-dropzone` | File uploads |
| `embla-carousel-react` | Carousels |
| `react-resizable-panels` | Resizable layouts |
| `cmdk` | Command palette |
| `vaul` | Drawer component |

### Design System
- HSL-based color tokens with light/dark mode
- Semantic color variables (primary, secondary, accent, muted, destructive)
- CRM-specific tokens (header, sidebar, hover effects)
- Custom card hover animations
- Responsive breakpoints (mobile-first)
- UI density toggle support

---

*This document reflects the current state of the AvidEdge Search platform as of March 7, 2026.*
