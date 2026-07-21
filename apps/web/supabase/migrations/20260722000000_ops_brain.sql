-- Ops Brain: autonomous backend health runs + findings
-- Apply via Supabase SQL editor or local psql after makerkit base + prior migrations.

create table if not exists public.ops_runs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade,
  agency_id uuid references public.agencies(id) on delete cascade,
  trigger text not null default 'manual', -- manual | cron | api
  mode text not null default 'apply', -- dry_run | apply
  status text not null default 'running', -- running | completed | failed
  findings_count int not null default 0,
  repairs_count int not null default 0,
  summary text,
  findings jsonb not null default '[]'::jsonb,
  repairs jsonb not null default '[]'::jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_ops_runs_account_created
  on public.ops_runs (account_id, created_at desc);

create index if not exists idx_ops_runs_status
  on public.ops_runs (status, created_at desc);

alter table public.ops_runs enable row level security;

drop policy if exists "ops_runs_select" on public.ops_runs;
create policy "ops_runs_select" on public.ops_runs for select
  using (
    account_id is not null
    and (
      kit.has_permission(auth.uid(), account_id, 'agencies.manage'::public.app_permissions)
      or kit.has_permission(auth.uid(), account_id, 'leads.manage'::public.app_permissions)
      or kit.has_permission(auth.uid(), account_id, 'policies.manage'::public.app_permissions)
    )
  );

grant select on public.ops_runs to authenticated;
grant all on public.ops_runs to service_role;

-- Also allow owners with settings.manage (enum value exists in role setup)
drop policy if exists "ops_runs_select_settings" on public.ops_runs;
create policy "ops_runs_select_settings" on public.ops_runs for select
  using (
    account_id is not null
    and kit.has_permission(auth.uid(), account_id, 'settings.manage'::public.app_permissions)
  );
