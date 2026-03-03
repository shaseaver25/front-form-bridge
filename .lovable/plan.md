

## Plan: Copy Recruit CRM Frontend to New Project with External Supabase

### What We're Building
Clone the entire frontend of your [Recruit CRM](/projects/e101be08-e2c7-4342-a67b-f75bdb477698) project into this blank project and connect it to your existing Supabase instance.

### Implementation Steps

**1. Copy All Source Code**
- Copy all pages (~100+ files), components (~60+ directories), hooks, services, utils, contexts, types, constants, config, data, and routes from the Recruit CRM project into this project
- Copy the Supabase integration files (`client.ts` and `types.ts`) which already use environment variables for the Supabase connection

**2. Copy Styling & Configuration**  
- Bring over the CRM-specific design system (professional blue color scheme, dark mode, custom utility classes)
- Update `tailwind.config.ts` if there are CRM-specific customizations

**3. Install Missing Dependencies**
- Add packages from the source project that aren't in this one: `@supabase/supabase-js`, `@hello-pangea/dnd`, `@faker-js/faker`, `react-dropzone`, `dompurify`, `msw`

**4. Update App Entry Point**
- Replace `App.tsx` with the Recruit CRM version using the centralized route configuration
- Apply the CRM's `index.css` design system

**5. Connect Your Supabase**
- After copying, you'll connect your external Supabase project through Lovable's Supabase connector (Settings → Connectors → Supabase)
- This will automatically set the `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` environment variables that the copied client code already references

### Important Notes
- The source Supabase `types.ts` file will be copied as-is. If your new Supabase schema differs, Lovable will regenerate types once you connect your Supabase project
- No backend/edge functions will be copied — only the frontend code
- All Supabase queries will point to your connected Supabase instance automatically

