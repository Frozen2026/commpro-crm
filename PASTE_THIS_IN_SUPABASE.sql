-- CommPro workspace setup (SQL Editor safe: no DO blocks, no nested dollar-quotes, no plpgsql variable sections).
-- Paste ENTIRE file into a blank Supabase SQL Editor tab, then Run.
-- Success = one row with a workspace JSON object.

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  primary_owner_user_id uuid references auth.users(id) on delete cascade,
  name text,
  slug text unique,
  email text,
  is_personal_account boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.accounts_roles (
  role text primary key,
  permissions text[] default '{}'
);

insert into public.accounts_roles (role, permissions)
values ('owner', array['*'])
on conflict (role) do nothing;

create table if not exists public.accounts_memberships (
  user_id uuid references auth.users(id) on delete cascade not null,
  account_id uuid references public.accounts(id) on delete cascade not null,
  account_role text not null default 'owner',
  created_at timestamptz default now(),
  primary key (user_id, account_id)
);

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text default 'active',
  created_at timestamptz default now()
);

alter table public.agencies add column if not exists account_id uuid;
alter table public.agencies add column if not exists name text;
alter table public.agencies add column if not exists status text default 'active';
alter table public.agencies add column if not exists created_at timestamptz default now();

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  created_at timestamptz default now()
);

alter table public.clients add column if not exists account_id uuid;
alter table public.clients add column if not exists agency_id uuid;
alter table public.clients add column if not exists owner_id uuid;
alter table public.clients add column if not exists first_name text;
alter table public.clients add column if not exists last_name text;
alter table public.clients add column if not exists business_name text;
alter table public.clients add column if not exists email text;
alter table public.clients add column if not exists phone text;
alter table public.clients add column if not exists address text;
alter table public.clients add column if not exists city text;
alter table public.clients add column if not exists state text;
alter table public.clients add column if not exists zip text;
alter table public.clients add column if not exists created_at timestamptz default now();

insert into public.accounts (name, primary_owner_user_id, is_personal_account)
select 'CommPro Account', u.id, false
from auth.users u
where not exists (select 1 from public.accounts)
order by u.created_at asc nulls last
limit 1;

insert into public.accounts (name, is_personal_account)
select 'CommPro Account', false
where not exists (select 1 from public.accounts);

insert into public.accounts_memberships (user_id, account_id, account_role)
select u.id, a.id, 'owner'
from auth.users u
cross join lateral (
  select id from public.accounts order by created_at asc nulls last limit 1
) a
where not exists (
  select 1 from public.accounts_memberships m where m.user_id = u.id
)
order by u.created_at asc nulls last
limit 1;

update public.agencies g
set account_id = a.id
from (select id from public.accounts order by created_at asc nulls last limit 1) a
where g.account_id is null;

update public.clients c
set account_id = a.id
from (select id from public.accounts order by created_at asc nulls last limit 1) a
where c.account_id is null;

insert into public.agencies (account_id, name, status)
select a.id, 'Default Agency', 'active'
from (select id from public.accounts order by created_at asc nulls last limit 1) a
where not exists (select 1 from public.agencies);

update public.clients c
set agency_id = g.id
from (select id from public.agencies order by created_at asc nulls last limit 1) g
where c.agency_id is null;

create or replace function public.ensure_workspace_for_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $ensure$
begin
  if p_user_id is null then
    raise exception 'user id is required';
  end if;

  insert into public.accounts (name, primary_owner_user_id, is_personal_account)
  select 'CommPro Account', p_user_id, false
  where not exists (select 1 from public.accounts);

  insert into public.accounts_memberships (user_id, account_id, account_role)
  select p_user_id, a.id, 'owner'
  from public.accounts a
  where not exists (
    select 1 from public.accounts_memberships m where m.user_id = p_user_id
  )
  order by a.created_at asc nulls last
  limit 1;

  insert into public.agencies (account_id, name, status)
  select m.account_id, 'Default Agency', 'active'
  from public.accounts_memberships m
  where m.user_id = p_user_id
    and not exists (
      select 1 from public.agencies g where g.account_id = m.account_id
    )
  limit 1;

  return (
    select jsonb_build_object(
      'account_id', m.account_id,
      'agency_id', g.id
    )
    from public.accounts_memberships m
    join public.agencies g on g.account_id = m.account_id
    where m.user_id = p_user_id
    order by g.created_at asc nulls last
    limit 1
  );
end;
$ensure$;

create or replace function public._commpro_raise(msg text)
returns boolean
language plpgsql
security definer
set search_path = public
as $raise$
begin
  raise exception '%', msg;
  return false;
end;
$raise$;

create or replace function public.create_client_for_user(
  p_user_id uuid,
  p_first_name text,
  p_last_name text default null,
  p_business_name text default null,
  p_email text default null,
  p_phone text default null,
  p_address text default null,
  p_city text default null,
  p_state text default null,
  p_zip text default null
)
returns jsonb
language sql
security definer
set search_path = public
as $create$
  with checked as (
    select case
      when p_user_id is null then
        public._commpro_raise('user id is required')
      when p_first_name is null or length(trim(p_first_name)) = 0 then
        public._commpro_raise('first name is required')
      else true
    end as ok
  ),
  raw as (
    select public.ensure_workspace_for_user(p_user_id) as w
    from checked
    where ok
  ),
  ws as (
    select
      (w->>'account_id')::uuid as account_id,
      (w->>'agency_id')::uuid as agency_id
    from raw
  ),
  ins as (
    insert into public.clients (
      account_id, agency_id, owner_id,
      first_name, last_name, business_name, email, phone, address, city, state, zip
    )
    select
      ws.account_id,
      ws.agency_id,
      p_user_id,
      trim(p_first_name),
      nullif(trim(coalesce(p_last_name, '')), ''),
      nullif(trim(coalesce(p_business_name, '')), ''),
      nullif(trim(coalesce(p_email, '')), ''),
      nullif(trim(coalesce(p_phone, '')), ''),
      nullif(trim(coalesce(p_address, '')), ''),
      nullif(trim(coalesce(p_city, '')), ''),
      nullif(trim(coalesce(p_state, '')), ''),
      nullif(trim(coalesce(p_zip, '')), '')
    from ws
    returning id, account_id, agency_id
  )
  select jsonb_build_object(
    'client_id', ins.id,
    'account_id', ins.account_id,
    'agency_id', ins.agency_id
  )
  from ins;
$create$;

revoke all on function public.ensure_workspace_for_user(uuid) from public;
revoke all on function public.create_client_for_user(uuid, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.ensure_workspace_for_user(uuid) to authenticated, service_role;
grant execute on function public.create_client_for_user(uuid, text, text, text, text, text, text, text, text, text)
  to authenticated, service_role;

grant select, insert, update, delete on public.accounts to service_role;
grant select, insert, update, delete on public.accounts_memberships to service_role;
grant select, insert, update, delete on public.agencies to service_role;
grant select, insert, update, delete on public.clients to service_role;

notify pgrst, 'reload schema';

select public.ensure_workspace_for_user(id) as workspace
from auth.users
order by created_at asc
limit 1;
