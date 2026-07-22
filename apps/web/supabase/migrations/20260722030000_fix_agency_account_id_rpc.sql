-- Fix production agencies/clients schema drift, then install workspace RPCs.
-- Safe to re-run. Paste entire script into Supabase SQL Editor.
-- Uses unique dollar-quote tags (no nested $$) so the editor does not mis-parse DECLARE.

-- ---------- 1) Ensure accounts tables ----------
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

-- ---------- 2) Ensure agencies exists + has account_id ----------
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

-- ---------- 3) Ensure clients exists + has required columns ----------
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

-- ---------- 4) Bootstrap a default account and backfill null account_ids ----------
do $boot$
declare
  v_account_id uuid;
  v_user_id uuid;
begin
  select id into v_user_id from auth.users order by created_at asc nulls last limit 1;

  select id into v_account_id from public.accounts order by created_at asc nulls last limit 1;

  if v_account_id is null then
    insert into public.accounts (name, primary_owner_user_id, is_personal_account)
    values ('CommPro Account', v_user_id, false)
    returning id into v_account_id;
  end if;

  if v_user_id is not null then
    insert into public.accounts_memberships (user_id, account_id, account_role)
    values (v_user_id, v_account_id, 'owner')
    on conflict (user_id, account_id) do nothing;
  end if;

  update public.agencies
  set account_id = v_account_id
  where account_id is null;

  update public.clients
  set account_id = v_account_id
  where account_id is null;

  if not exists (select 1 from public.agencies) then
    insert into public.agencies (account_id, name, status)
    values (v_account_id, 'Default Agency', 'active');
  end if;

  update public.clients c
  set agency_id = a.id
  from (
    select id from public.agencies order by created_at asc nulls last limit 1
  ) a
  where c.agency_id is null;
end;
$boot$;

-- ---------- 5) RPCs (column-safe) ----------
create or replace function public.ensure_workspace_for_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $ensure$
declare
  v_account_id uuid;
  v_agency_id uuid;
  v_has_account_col boolean;
begin
  if p_user_id is null then
    raise exception 'user id is required';
  end if;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'agencies' and column_name = 'account_id'
  ) into v_has_account_col;

  select m.account_id into v_account_id
  from public.accounts_memberships m
  where m.user_id = p_user_id
  limit 1;

  if v_account_id is null then
    begin
      execute 'select account_id from public.agent_profiles where id = $1'
        into v_account_id
        using p_user_id;
    exception when others then
      null;
    end;
  end if;

  if v_account_id is null then
    select a.id into v_account_id
    from public.accounts a
    order by a.created_at asc nulls last
    limit 1;
  end if;

  if v_account_id is null then
    insert into public.accounts (name, primary_owner_user_id, is_personal_account)
    values ('CommPro Account', p_user_id, false)
    returning id into v_account_id;
  end if;

  begin
    insert into public.accounts_memberships (user_id, account_id, account_role)
    values (p_user_id, v_account_id, 'owner')
    on conflict (user_id, account_id) do nothing;
  exception when others then
    null;
  end;

  if v_has_account_col then
    execute
      'select g.id from public.agencies g where g.account_id = $1 order by g.created_at asc nulls last limit 1'
      into v_agency_id
      using v_account_id;

    if v_agency_id is null then
      execute
        'insert into public.agencies (account_id, name, status) values ($1, $2, $3) returning id'
        into v_agency_id
        using v_account_id, 'Default Agency', 'active';
    end if;
  else
    select g.id into v_agency_id
    from public.agencies g
    order by g.created_at asc nulls last
    limit 1;

    if v_agency_id is null then
      insert into public.agencies (name, status)
      values ('Default Agency', 'active')
      returning id into v_agency_id;
    end if;
  end if;

  -- Optional table; ignore if missing or columns differ
  begin
    insert into public.agent_profiles (id, account_id, agency_id)
    values (p_user_id, v_account_id, v_agency_id)
    on conflict (id) do update
      set account_id = excluded.account_id,
          agency_id = excluded.agency_id;
  exception when others then
    null;
  end;

  return jsonb_build_object(
    'account_id', v_account_id,
    'agency_id', v_agency_id
  );
end;
$ensure$;

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
language plpgsql
security definer
set search_path = public
as $create$
declare
  v_workspace jsonb;
  v_account_id uuid;
  v_agency_id uuid;
  v_client_id uuid;
  v_has_account_col boolean;
  v_has_agency_col boolean;
begin
  if p_user_id is null then
    raise exception 'user id is required';
  end if;
  if p_first_name is null or length(trim(p_first_name)) = 0 then
    raise exception 'first name is required';
  end if;

  v_workspace := public.ensure_workspace_for_user(p_user_id);
  v_account_id := (v_workspace->>'account_id')::uuid;
  v_agency_id := (v_workspace->>'agency_id')::uuid;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'account_id'
  ) into v_has_account_col;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'agency_id'
  ) into v_has_agency_col;

  if v_has_account_col and v_has_agency_col then
    insert into public.clients (
      account_id, agency_id, owner_id,
      first_name, last_name, business_name, email, phone, address, city, state, zip
    ) values (
      v_account_id, v_agency_id, p_user_id,
      trim(p_first_name),
      nullif(trim(coalesce(p_last_name, '')), ''),
      nullif(trim(coalesce(p_business_name, '')), ''),
      nullif(trim(coalesce(p_email, '')), ''),
      nullif(trim(coalesce(p_phone, '')), ''),
      nullif(trim(coalesce(p_address, '')), ''),
      nullif(trim(coalesce(p_city, '')), ''),
      nullif(trim(coalesce(p_state, '')), ''),
      nullif(trim(coalesce(p_zip, '')), '')
    )
    returning id into v_client_id;
  elsif v_has_agency_col then
    insert into public.clients (
      agency_id, owner_id,
      first_name, last_name, business_name, email, phone, address, city, state, zip
    ) values (
      v_agency_id, p_user_id,
      trim(p_first_name),
      nullif(trim(coalesce(p_last_name, '')), ''),
      nullif(trim(coalesce(p_business_name, '')), ''),
      nullif(trim(coalesce(p_email, '')), ''),
      nullif(trim(coalesce(p_phone, '')), ''),
      nullif(trim(coalesce(p_address, '')), ''),
      nullif(trim(coalesce(p_city, '')), ''),
      nullif(trim(coalesce(p_state, '')), ''),
      nullif(trim(coalesce(p_zip, '')), '')
    )
    returning id into v_client_id;
  else
    raise exception 'public.clients is missing agency_id/account_id columns';
  end if;

  return jsonb_build_object(
    'client_id', v_client_id,
    'account_id', v_account_id,
    'agency_id', v_agency_id
  );
end;
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
