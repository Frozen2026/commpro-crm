# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is
CommPro.ai — a multi-tenant insurance CRM. The only runnable app is the Next.js 16 / React 19 project in `commpro-crm/` (App Router, Turbopack, server actions). It is backed by **Supabase** (Postgres + Auth + PostgREST). `apps/web/` is a partial MakerKit-style scaffold (Supabase SQL migrations + a few libs); it has no `package.json` and is not independently runnable.

Standard scripts live in `commpro-crm/package.json` (`dev`, `build`, `start`, `lint`). Run everything from `commpro-crm/`.

### Local backend: Supabase runs via Docker (non-obvious setup)
The app throws on startup without `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `src/lib/supabase/config.ts`). There is **no committed Supabase config, Dockerfile, or `.env.example`**. Local dev uses the Supabase CLI stack (Docker), configured (and already bootstrapped in the VM snapshot) at `/home/ubuntu/supabase-local/`.

Key non-obvious gotcha: the migrations in `apps/web/supabase/migrations/` assume a **MakerKit base schema that is NOT in this repo** (`public.accounts`, `public.accounts_memberships`, `public.accounts_roles`, the `public.app_permissions` enum, and `kit.has_permission()`). That base is reconstructed for local dev by `/home/ubuntu/supabase-local/00_makerkit_base.sql`, which also handles three quirks the repo migrations depend on:
- `pg_trgm` is enabled up front (migration 1 builds a `gin_trgm_ops` index before it enables the extension).
- `accounts_roles.permissions` is `text[]` (migration 2 inserts uncast text array literals).
- `authenticated`/`anon` get table privileges + default privileges (repo migrations set RLS policies but never `GRANT`).

### Starting the full stack (services are NOT auto-started on boot)
The update script only runs `npm install`. Docker, the Supabase containers, and the Next.js dev server must be started manually each session:

1. Start Docker daemon (if not running) and make the socket usable:
   `sudo dockerd > /tmp/dockerd.log 2>&1 &` then `sudo chmod 666 /var/run/docker.sock`
   (Docker 29 in this VM requires `/etc/docker/daemon.json` with `storage-driver: fuse-overlayfs` and `features.containerd-snapshotter: false` — already configured.)
2. Start Supabase: `cd /home/ubuntu/supabase-local && supabase start`. API is `http://127.0.0.1:54321`, DB is `postgresql://postgres:postgres@127.0.0.1:54322/postgres`, Studio `http://127.0.0.1:54323`.
3. If the DB is empty (fresh `supabase start` with no prior volume), re-apply schema in order via `docker exec -i supabase_db_supabase-local psql -U postgres -d postgres`: `00_makerkit_base.sql`, then the three files in `apps/web/supabase/migrations/` (timestamp order), then reseed the test account (see below). `supabase db reset` wipes everything (migrations folder there is empty), so prefer leaving the stack running.
4. `commpro-crm/.env.local` already holds the local Supabase URL + standard demo anon/service-role keys. Run the app: `cd commpro-crm && npm run dev` (port 3000).

### Test login
A confirmed user is seeded: **`agent@commpro.ai` / `Password123!`** (owner of account "Acme MGA" with agency "Acme Insurance Agency"). Owner role has all permissions, so RLS lets it read/write every module. Create new users via the Auth admin API (`POST http://127.0.0.1:54321/auth/v1/admin/users` with the service-role key + `email_confirm:true`), then insert matching `accounts` + `accounts_memberships` (role `owner`) + `agencies` rows so `getUserContext` (`src/lib/account-context.ts`) resolves an `accountId` and `agencyId`.

### Known pre-existing issue (not an env problem)
`src/app/page.tsx` and `src/components/public-chatbot-widget.tsx` import `lucide-react`, which is **not declared in `package.json`**. This breaks the `/` marketing route (500 in dev) and `npm run build`. The core authenticated CRM (login, dashboard, leads, etc.) works fine in `npm run dev`. Add `lucide-react` to fix the homepage / production build.
