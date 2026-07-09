-- Add missing carrier directory and CSA alerts tables used by app modules.

create table if not exists public.insurance_carriers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  am_best_rating text,
  lines_of_business text[] default '{}',
  writes_uiia boolean default false,
  is_preferred boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.csa_alerts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade,
  dot_number text not null,
  severity text not null default 'medium',
  reason text not null,
  status text not null default 'open',
  created_at timestamptz default now()
);

alter table public.insurance_carriers enable row level security;
alter table public.csa_alerts enable row level security;

drop policy if exists insurance_carriers_select on public.insurance_carriers;
create policy insurance_carriers_select on public.insurance_carriers
for select using (auth.role() = 'authenticated');

drop policy if exists csa_alerts_select on public.csa_alerts;
create policy csa_alerts_select on public.csa_alerts
for select using (kit.has_permission(auth.uid(), account_id, 'leads.view'));

drop policy if exists csa_alerts_manage on public.csa_alerts;
create policy csa_alerts_manage on public.csa_alerts
for all using (kit.has_permission(auth.uid(), account_id, 'leads.manage'));

insert into public.insurance_carriers (name, am_best_rating, lines_of_business, writes_uiia, is_preferred)
values
  ('Travelers', 'A++', array['General Liability', 'Auto', 'Workers Compensation'], true, true),
  ('The Hartford', 'A+', array['General Liability', 'Property', 'Workers Compensation'], true, true),
  ('Progressive Commercial', 'A+', array['Auto', 'Trucking'], true, true),
  ('Liberty Mutual', 'A', array['General Liability', 'Property', 'Auto'], true, false),
  ('Chubb', 'A++', array['General Liability', 'Property', 'Cyber'], false, true),
  ('CNA', 'A', array['General Liability', 'Property', 'Umbrella'], true, false),
  ('Berkshire Hathaway Guard', 'A+', array['Workers Compensation', 'Property'], false, false),
  ('AmTrust', 'A-', array['Workers Compensation', 'General Liability'], true, false),
  ('Great West Casualty', 'A+', array['Trucking', 'Auto'], true, true),
  ('Canal Insurance', 'A', array['Trucking', 'Auto'], true, true),
  ('Old Republic', 'A+', array['General Liability', 'Auto', 'Umbrella'], true, false),
  ('RLI', 'A+', array['Umbrella', 'Surety'], false, false),
  ('Markel', 'A', array['Specialty', 'General Liability'], false, false),
  ('Nationwide', 'A+', array['General Liability', 'Property', 'Auto'], false, false),
  ('State Auto', 'A', array['General Liability', 'Property'], false, false),
  ('Zurich', 'A+', array['General Liability', 'Property', 'Auto'], true, true),
  ('AIG', 'A', array['General Liability', 'Cyber', 'Property'], false, false),
  ('Hanover', 'A', array['General Liability', 'Property', 'Auto'], false, false),
  ('Auto-Owners', 'A++', array['General Liability', 'Property', 'Auto'], false, false),
  ('Sentry', 'A+', array['Auto', 'Workers Compensation'], true, false),
  ('USLI', 'A++', array['General Liability', 'Specialty'], false, false),
  ('Tokio Marine HCC', 'A++', array['Specialty', 'General Liability'], false, false)
on conflict (name) do update set
  am_best_rating = excluded.am_best_rating,
  lines_of_business = excluded.lines_of_business,
  writes_uiia = excluded.writes_uiia,
  is_preferred = excluded.is_preferred;
