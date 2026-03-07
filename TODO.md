# TODO List

## Pending

- [ ] **Check Resend domain verification status** — Verify that `tailoredu.org` is fully verified at [resend.com/domains](https://resend.com/domains) (DNS propagation can take up to 48h). Once verified, re-test the user invitation flow from Admin → Add New User.

## Site Testing Results (2026-03-07)

### ✅ All Pages Working
| Page | Route | Status |
|------|-------|--------|
| Homepage / Landing | `/`, `/landing` | ✅ |
| Auth (Login/Signup) | `/auth` | ✅ |
| Dashboard | `/` (authenticated) | ✅ |
| Contacts | `/constituents` | ✅ |
| Companies | `/sites` | ✅ (1000 companies, Kanban view) |
| Pipeline | `/pipeline` | ✅ (110 candidates, drag-drop board) |
| Placements | `/placements` | ✅ (6 placements with salary data) |
| Tasks | `/tasks` | ✅ |
| Calendar | `/calendar` | ✅ (Microsoft 365 integration prompt) |
| Projects | `/projects` | ✅ |
| Email Outreach | `/email-marketing` | ✅ (Coming Soon) |
| Campaigns | `/campaigns` | ✅ |
| Integrations | `/integrations` | ✅ (Mailchimp connected) |
| Settings | `/settings/account` | ✅ |
| Help & Docs | `/help` | ✅ |
| Terms of Service | `/legal/terms` | ✅ |
| Grants/Jobs | `/grants` | ✅ (Tier gate working correctly) |

### 🔧 Bugs Fixed
- **RequireAdmin redirect** — Was redirecting non-admin users to `/dashboard` (404). Fixed to redirect to `/` instead.

### ⚠️ Minor Issues (Non-blocking, dev-mode only)
- React `forwardRef` warning on `App` component and `DialogContent` — cosmetic, dev-mode only
- PostMessage warnings — standard Lovable preview iframe behavior

### 📝 Notes
- Admin pages (`/admin/*`) require admin role — tested user `shannon@the-ai-whisperers.com` is not an admin. The admin user is `shannon@tailoredu.org`.
- Tier gating works correctly — Grants requires Professional tier.
- Sidebar navigation correctly maps "Companies" → `/sites`, "Jobs" → `/grants`.
