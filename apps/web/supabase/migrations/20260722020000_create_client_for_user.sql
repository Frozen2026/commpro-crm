-- One-shot: workspace bootstrap + create client via RPC
-- Run entire file in Supabase SQL Editor (production), then retry Add Client.
-- This bypasses PostgREST "schema cache" issues for public.accounts.

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

-- agencies may already exist with a richer CommPro schema; only create if missing
create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  name text not null,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  agency_id uuid not null,
  owner_id uuid references auth.users(id),
  lead_id uuid,
  first_name text,
  last_name text,
  business_name text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  created_at timestamptz default now()
);

create or replace function public.ensure_workspace_for_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
  v_agency_id uuid;
begin
  if p_user_id is null then
    raise exception 'user id is required';
  end if;

  select m.account_id into v_account_id
  from public.accounts_memberships m
  where m.user_id = p_user_id
  limit 1;

  if v_account_id is null then
    begin
      execute 'select account_id from public.agent_profiles where id = $1'
        into v_account_id
        using p_user_id;
    exception
      when undefined_table then null;
      when others then null;
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
  exception
    when others then
      -- role FK / duplicate edge cases should not block workspace
      null;
  end;

  select g.id into v_agency_id
  from public.agencies g
  where g.account_id = v_account_id
  order by g.created_at asc nulls last
  limit 1;

  if v_agency_id is null then
    insert into public.agencies (account_id, name, status)
    values (v_account_id, 'Default Agency', 'active')
    returning id into v_agency_id;
  end if;

  begin
    execute $q$
      insert into public.agent_profiles (id, account_id, agency_id)
      values ($1, $2, $3)
      on conflict (id) do update
        set account_id = excluded.account_id,
            agency_id = excluded.agency_id
    $q$ using p_user_id, v_account_id, v_agency_id;
  exception
    when undefined_table then null;
    when others then null;
  end;

  return jsonb_build_object(
    'account_id', v_account_id,
    'agency_id', v_agency_id
  );
end;
$$;

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
as $$
declare
  v_workspace jsonb;
  v_account_id uuid;
  v_agency_id uuid;
  v_client_id uuid;
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

  insert into public.clients (
    account_id,
    agency_id,
    owner_id,
    first_name,
    last_name,
    business_name,
    email,
    phone,
    address,
    city,
    state,
    zip
  ) values (
    v_account_id,
    v_agency_id,
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
  )
  returning id into v_client_id;

  return jsonb_build_object(
    'client_id', v_client_id,
    'account_id', v_account_id,
    'agency_id', v_agency_id
  );
end;
$$;

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

-- Verify (shows IDs after bootstrap for the first auth user, if any)
do $$
declare
  u uuid;
  w jsonb;
begin
  select id into u from auth.users order by created_at asc limit 1;
  if u is not null then
    w := public.ensure_workspace_for_user(u);
    raise notice 'Workspace ready: %', w;
  else
    raise notice 'No auth users yet — workspace will be created on first client insert.';
  end if;
end $$;
