-- Ensure workspace (account + agency) for a user without requiring
-- public.accounts to be exposed in the PostgREST schema cache.
-- Paste into Supabase SQL Editor if not applied via migration.

-- Minimal MakerKit-compatible accounts tables when missing
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

create table if not exists public.accounts_memberships (
  user_id uuid references auth.users(id) on delete cascade not null,
  account_id uuid references public.accounts(id) on delete cascade not null,
  account_role text not null default 'owner',
  created_at timestamptz default now(),
  primary key (user_id, account_id)
);

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  name text not null,
  status text default 'active',
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
      select ap.account_id into v_account_id
      from public.agent_profiles ap
      where ap.id = p_user_id;
    exception
      when undefined_table then
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

  insert into public.accounts_memberships (user_id, account_id, account_role)
  values (p_user_id, v_account_id, 'owner')
  on conflict (user_id, account_id) do nothing;

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
    insert into public.agent_profiles (id, account_id, agency_id)
    values (p_user_id, v_account_id, v_agency_id)
    on conflict (id) do update
      set account_id = excluded.account_id,
          agency_id = excluded.agency_id;
  exception
    when undefined_table then
      null;
  end;

  return jsonb_build_object(
    'account_id', v_account_id,
    'agency_id', v_agency_id
  );
end;
$$;

revoke all on function public.ensure_workspace_for_user(uuid) from public;
grant execute on function public.ensure_workspace_for_user(uuid) to authenticated;
grant execute on function public.ensure_workspace_for_user(uuid) to service_role;

-- Help PostgREST see accounts if the table existed but wasn't reloaded
notify pgrst, 'reload schema';
