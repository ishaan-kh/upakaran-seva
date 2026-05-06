# Upakaran Seva

Media equipment management system for **Gurutattva Foundation**.

Production stack: **Vite + React 19 + TypeScript** on the frontend, **Supabase** (PostgreSQL + Auth + Storage) for the backend, **Vercel** for hosting.

---

## Table of Contents

1. [Architecture overview](#architecture-overview)
2. [What's included in v1](#whats-included-in-v1)
3. [One-time setup — Supabase project](#one-time-setup--supabase-project)
4. [Run database migrations](#run-database-migrations)
5. [Create the first admin user](#create-the-first-admin-user)
6. [Local development](#local-development)
7. [Deploy to Vercel](#deploy-to-vercel)
8. [Custom domain](#custom-domain)
9. [Inviting team members](#inviting-team-members)
10. [Troubleshooting](#troubleshooting)
11. [Project structure](#project-structure)

---

## Architecture overview

```
┌──────────────────────┐         ┌─────────────────────────────┐
│  Vercel (Frontend)   │ ───────▶│  Supabase (Backend)         │
│  Vite + React 19     │   HTTPS │  • PostgreSQL 17 (DB)       │
│  Tailwind + RHF      │         │  • Auth (email/password)    │
│  React Query v5      │         │  • Storage (photos, 1GB)    │
│  React Router v7     │         │  • RLS (permission engine)  │
└──────────────────────┘         └─────────────────────────────┘
        ▲                                     ▲
        │ user.gurutattva.org                 │ same-origin from Vercel
        │                                     │
   Hardik / Kenil / Ravi                Database enforces all permissions
```

Both Vercel and Supabase free tiers are sufficient for foundation scale (estimated ~100 users, ~500 equipment items, ~50 events/month). **₹0/month at this scale.**

---

## What's included in v1

**Fully ported and production-ready:**
- Email/password authentication via Supabase Auth
- Role-based UI gating with 5 built-in roles + custom role support
- Equipment module — list, search, add, edit, retire, view detail
- Photo upload with client-side resizing (800px max, JPEG quality 0.85)
- Permission-aware sidebar navigation
- Toast notifications, modal dialogs, status chips, grade badges
- Database row-level security (RLS) mirroring all UI permissions

**Schema and infrastructure ready, UI to be ported next:**
- Checkouts (table + RLS done — UI placeholder)
- Events + Event Checklist (table + RLS done — UI placeholder)
- Maintenance Tickets (table + RLS done — UI placeholder)
- Billing (computed views — UI placeholder)
- All 6 Masters pages (Users, Roles, Categories, Event Types, Locations, Vendors — placeholders)

---

## One-time setup — Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (use the Gurutattva Google Workspace account if possible — easier for handover).
2. Click **New Project**.
3. Settings:
   - **Name:** `upakaran-seva`
   - **Database password:** Generate a strong password and save it in 1Password / Bitwarden vault
   - **Region:** `Mumbai (ap-south-1)` — closest to Gujarat for low latency
   - **Plan:** `Free` (sufficient for now)
4. Wait ~2 minutes for the project to provision.

Once the project is ready, copy these values from **Project Settings → API**:
- `Project URL` → set as `VITE_SUPABASE_URL`
- `anon / public key` → set as `VITE_SUPABASE_ANON_KEY`
- The project ref (e.g. `abcdefghijklmnop`) → set as `VITE_SUPABASE_PROJECT_REF`

---

## Run database migrations

The `supabase/migrations/` folder contains four SQL files that must run in order:

| File | Purpose |
|------|---------|
| `00001_initial_schema.sql` | Creates all 12 tables with PascalCase columns |
| `00002_seed_data.sql` | Seeds 5 built-in roles, 11 categories, 6 event types |
| `00003_rls_policies.sql` | Enables RLS and creates helper functions + policies |
| `00004_storage_buckets.sql` | Creates `equipment-photos` and `condition-photos` buckets |

### Option A — Supabase Dashboard (easiest)

1. Open your project → **SQL Editor**.
2. For each migration file in order, paste the contents and click **Run**.
3. Verify in **Table Editor** that all tables are created with correct columns.

### Option B — Supabase CLI (recommended for ongoing work)

```bash
# Install once
npm install -g supabase

# Login and link the project
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>

# Apply migrations
supabase db push
```

After all migrations succeed, verify in the Dashboard:
- **Table Editor** shows 12 tables, all PascalCase
- **Storage** shows `equipment-photos` and `condition-photos` buckets, both Public
- **Database → Functions** shows `has_action`, `is_admin`, `current_user_profile`, etc.

---

## Create the first admin user

> ⚠️ This is a one-time bootstrap step. Once the first admin exists, all other users are created from within the app.

### Step 1 — Create the auth user

In the Supabase Dashboard → **Authentication → Users → Add user → Create new user**:
- **Email:** `your-admin-email@gurutattva.org`
- **Password:** strong password
- **Auto Confirm User:** ✅ check this so they don't need email verification

After creation, **copy the new user's UUID** (visible in the Users list).

### Step 2 — Link to the Users table

Open **SQL Editor** and run (replace the placeholders):

```sql
INSERT INTO Users (AuthUserId, Name, Email, Phone, Roles, IsActive)
VALUES (
    '<PASTE_AUTH_USER_UUID_HERE>'::uuid,
    'Your Full Name',
    'your-admin-email@gurutattva.org',
    '+91XXXXXXXXXX',
    '["UpakaranAdmin"]'::jsonb,
    TRUE
);
```

### Step 3 — Verify

Sign in to the app with these credentials. You should see the full sidebar (all modules + masters), and your name + "Upakaran Admin" badge in the top-right.

---

## Local development

```bash
# Install deps
pnpm install

# Copy env template and fill in
cp .env.example .env.local
# Edit .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start dev server
pnpm dev
```

Open `http://localhost:5173`.

### Useful scripts

```bash
pnpm dev          # Vite dev server with HMR
pnpm build        # Production build → dist/
pnpm preview      # Preview production build locally
pnpm typecheck    # Run tsc without emit
pnpm lint         # ESLint
```

### Generating typed Supabase types (optional but recommended)

The current `src/types/domain.ts` is hand-crafted. For better type safety, generate types from the live schema:

```bash
pnpm supabase:types
```

This creates `src/types/database.generated.ts`. Imports can then be updated to use generated types where helpful.

---

## Deploy to Vercel

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial: Upakaran Seva v1 (Equipment module + scaffold)"
git branch -M main
git remote add origin git@github.com:gurutattva/upakaran-seva.git
git push -u origin main
```

> Replace `gurutattva` with the org's actual GitHub username.

### Step 2 — Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (use the foundation's Google Workspace).
2. Click **Add New → Project**.
3. Import the `upakaran-seva` repo.
4. Framework preset: **Vite** (auto-detected).
5. **Environment Variables** — add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click **Deploy**.

After ~2 minutes, you'll get a URL like `upakaran-seva.vercel.app`.

### Step 3 — Verify deployment

- Visit the Vercel URL and sign in with the admin credentials.
- Add a test equipment item.
- Confirm it appears in Supabase **Table Editor** under `equipment`.

---

## Custom domain

Recommended: `upakaran.gurutattva.org`

In Vercel → **Project → Settings → Domains**:
1. Add domain `upakaran.gurutattva.org`.
2. Vercel will show DNS instructions — typically a `CNAME` record pointing to `cname.vercel-dns.com`.
3. Add this CNAME record in your DNS provider (Cloudflare, Route 53, etc.) for `gurutattva.org`.
4. Wait for DNS propagation (usually 5–30 min).
5. Vercel auto-issues an SSL cert.

---

## Inviting team members

Once the first admin is set up:

### For each new team member:

1. **Admin creates the auth user** in Supabase Dashboard → Authentication → **Invite User**:
   - Enter their email
   - Supabase sends them a magic link to set their password
2. After they accept and set a password, **admin runs SQL** to add them to the `Users` table:
   ```sql
   INSERT INTO Users (AuthUserId, Name, Email, Phone, Roles, IsActive)
   VALUES (
       (SELECT Id FROM auth.users WHERE Email = 'newuser@gurutattva.org'),
       'Their Name',
       'newuser@gurutattva.org',
       '+91XXXXXXXXXX',
       '["MediaTeamMember"]'::jsonb,   -- pick role: UpakaranAdmin, UpakaranCustodian, EventCoordinator, MediaTeamMember, UpakaranViewer
       TRUE
   );
   ```

> When the **Masters → Users** page is ported (next release), this manual step goes away — admins will add users from inside the app.

### Built-in roles

| Role | What they can do |
|------|------------------|
| `UpakaranAdmin` | Full system access, manages users/roles, retires equipment |
| `UpakaranCustodian` | Add/edit equipment, process checkouts and returns, manage maintenance |
| `EventCoordinator` | Plan events, build checklists, run bulk start/close |
| `MediaTeamMember` | Check out equipment, report condition, view assigned events |
| `UpakaranViewer` | Read-only access to everything |

---

## Troubleshooting

### "Missing Supabase env vars" error on startup
Check that `.env.local` exists locally and that Vercel has both env vars set. Restart `pnpm dev` after adding them.

### Sign-in works but app shows "Account not provisioned"
The auth user exists but no row in the `Users` table is linked to it. Run the linking SQL from [Create the first admin user](#create-the-first-admin-user) Step 2.

### "permission denied for table equipment" when inserting
RLS is rejecting the write. Check:
- The signed-in user is in the `Users` table with `IsActive = TRUE`
- Their `Roles` JSONB array includes a role that has the action permission
- Run `SELECT current_user_effective_roles();` in SQL Editor (with the user's session cookies) to debug

### Photo upload fails
Check **Storage → equipment-photos** bucket exists and is **Public**. Upload size limit is 5 MB; the app auto-resizes to 800px so this should not be hit normally.

### Deployment succeeds but app is blank
Open browser console. Most common cause: env vars not set in Vercel. Go to **Project Settings → Environment Variables**, ensure both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist for the Production environment, then redeploy.

---

## Project structure

```
upakaran-seva/
├── supabase/
│   └── migrations/                 # SQL migrations — run in order
│       ├── 00001_initial_schema.sql
│       ├── 00002_seed_data.sql
│       ├── 00003_rls_policies.sql
│       └── 00004_storage_buckets.sql
├── src/
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client + photo URL helper
│   │   ├── queryClient.ts          # React Query config + key registry
│   │   ├── permissions.ts          # Frontend mirror of RLS rules
│   │   └── result.ts               # Result<T,E> pattern helper
│   ├── types/
│   │   └── domain.ts               # TypeScript types matching DB
│   ├── components/
│   │   ├── AppLayout.tsx           # Shell: Sidebar + TopBar + <Outlet/>
│   │   ├── Sidebar.tsx             # Permission-aware nav
│   │   ├── TopBar.tsx              # User menu + sign out
│   │   ├── AccessDenied.tsx        # Per-page permission fallback
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── Input.tsx           # Input, Textarea, Select with FieldWrap
│   │       ├── Toast.tsx           # Provider + useToast hook
│   │       └── Badges.tsx          # StatusChip + GradeBadge
│   ├── features/
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx     # Session + currentUser + roles
│   │   │   ├── LoginPage.tsx
│   │   │   └── useCan.ts           # { can(action), canSee(page) }
│   │   └── equipment/              # ★ First fully-ported module
│   │       ├── equipment.schema.ts # Zod schema
│   │       ├── equipment.api.ts    # React Query hooks + photo upload
│   │       ├── EquipmentListPage.tsx
│   │       ├── EquipmentDetailPage.tsx
│   │       └── EquipmentForm.tsx   # Add + Edit modal
│   ├── pages/
│   │   ├── DashboardPage.tsx       # Quick stats + welcome
│   │   └── PlaceholderPage.tsx     # For not-yet-ported modules
│   ├── App.tsx                     # useRoutes routing + auth gate
│   ├── main.tsx                    # Providers + entry
│   ├── index.css                   # Design tokens (CSS vars)
│   └── vite-env.d.ts               # Vite env types
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── .env.example
└── README.md
```

---

## Roadmap (post v1)

In rough priority order:

1. **Checkouts module** — same pattern as Equipment (list + form + return flow)
2. **Events + Event Checklist** — bulk checkout/return flows
3. **Maintenance Tickets** — open, assign, resolve workflow
4. **Billing** — vendor cost summaries (computed views in Postgres)
5. **Masters pages** — Users, Roles (with custom role builder), Categories, Locations, Vendors, Event Types
6. **Real-time updates** — Supabase realtime channels so Hardik's checkout instantly appears on Kenil's screen
7. **Auto-overdue job** — pg_cron daily at midnight to flip Active → Overdue
8. **Dashboard charts** — equipment status breakdown, event timeline, maintenance trends
9. **Mobile PWA** — installable on phones for field use
10. **Switch to auto-generated DB types** via `pnpm supabase:types`

Each module follows the same structure as `features/equipment/`:
- `*.schema.ts` — Zod validation
- `*.api.ts` — React Query hooks
- `*ListPage.tsx`, `*DetailPage.tsx`, `*Form.tsx` — UI

---

## License

Proprietary — Gurutattva Foundation. Not for external distribution.

---

🙏 **Jai Gurudev**
