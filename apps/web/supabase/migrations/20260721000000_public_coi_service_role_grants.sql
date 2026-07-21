-- Allow service_role to intake public website COI requests into leads
-- and look up clients/active policies for auto COI generation.

grant usage on schema public to service_role;
grant select on table public.accounts to service_role;
grant select on table public.agencies to service_role;
grant insert, select on table public.leads to service_role;
grant select on table public.clients to service_role;
grant select on table public.policies to service_role;
grant insert, select on table public.coi_certificates to service_role;
