# TODO List

## Pending

- [ ] **Check Resend domain verification status** — Verify that `tailoredu.org` is fully verified at [resend.com/domains](https://resend.com/domains) (DNS propagation can take up to 48h). Once verified, re-test the user invitation flow from Admin → Add New User.

## Site Testing Results (2026-03-07)

### ✅ Working Pages
- **Homepage (`/`)** — Renders correctly with hero, nav links (section anchors), animated circles
- **Landing (`/landing`)** — Same as homepage, renders fine
- **Auth (`/auth`)** — Login/signup form displays correctly
- **Terms of Service (`/legal/terms`)** — Renders full legal content
- **Auth redirect** — Unauthenticated access to `/constituents` correctly redirects to login

### ⚠️ Minor Issues (Non-blocking)
- **React ref warning** — `Function components cannot be given refs` on `App` component and `DialogContent` (cosmetic, dev-mode only)
- **PostMessage warnings** — Standard Lovable preview iframe warnings (not a bug)

### 🔒 Not Yet Tested (Requires Login)
- [ ] Dashboard / Index (authenticated)
- [ ] Constituents page
- [ ] Grants / Jobs pages
- [ ] Pipeline dashboard
- [ ] Projects / Boards
- [ ] Tasks / My Tasks
- [ ] Calendar
- [ ] Donations / Pledges
- [ ] Email Marketing / Campaigns
- [ ] Events
- [ ] Integrations pages
- [ ] Admin pages (users, roles, activity log)
- [ ] Settings pages
- [ ] Voice Notes
- [ ] Financial Runway / Payments

> **To test authenticated pages:** Log in via the preview first, then ask me to continue testing.
