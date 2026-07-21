-- Allow service_role to intake public website COI requests into leads.
-- Safe on Supabase hosted projects (service_role already often has these).

grant usage on schema public to service_role;
grant select on table public.accounts to service_role;
grant select on table public.agencies to service_role;
grant insert, select on table public.leads to service_role;
