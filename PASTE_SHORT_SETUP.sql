-- SHORT setup only (no functions, no DECLARE). Paste into a NEW blank SQL Editor tab.
alter table public.agencies add column if not exists account_id uuid;
alter table public.clients add column if not exists account_id uuid;
alter table public.clients add column if not exists agency_id uuid;
alter table public.clients add column if not exists owner_id uuid;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz default now()
);

insert into public.accounts (name)
select 'CommPro Account'
where not exists (select 1 from public.accounts);

update public.agencies
set account_id = (select id from public.accounts order by created_at nulls last limit 1)
where account_id is null;

insert into public.agencies (name, status, account_id)
select 'Default Agency', 'active', a.id
from public.accounts a
where not exists (select 1 from public.agencies)
limit 1;

select id as account_id from public.accounts order by created_at nulls last limit 1;
select id as agency_id from public.agencies order by created_at nulls last limit 1;
