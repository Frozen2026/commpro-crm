-- ============================================================
-- CommPro.ai — MakerKit Role & Permission Setup
-- File: apps/web/supabase/migrations/20260102000000_setup_role_permissions.sql
--
-- Sets up the default role → permission mappings:
--   - owner: all permissions
--   - mga_admin: same as owner
--   - agency_admin: limited to agency/lead/client/policy/commission/renewal/claims/COI/reports/ai
--   - agent: limited to leads/clients/policies/renewals/claims/COI/ai
--   - csr: limited to leads/clients/policies/COI
-- ============================================================

-- Insert or update role permission mappings
-- MakerKit uses the accounts_roles table to map roles to permissions

-- Owner role (has all permissions)
insert into public.accounts_roles (role, permissions)
values (
  'owner',
  array[
    'agencies.manage',
    'agencies.view',
    'leads.manage',
    'leads.view',
    'clients.manage',
    'clients.view',
    'policies.manage',
    'policies.view',
    'commissions.manage',
    'commissions.view',
    'renewals.manage',
    'renewals.view',
    'claims.manage',
    'claims.view',
    'reports.view',
    'settings.manage',
    'coi.issue',
    'ai.use'
  ]
)
on conflict (role) do update set permissions = excluded.permissions;

-- MGA Admin role (same as owner)
insert into public.accounts_roles (role, permissions)
values (
  'mga_admin',
  array[
    'agencies.manage',
    'agencies.view',
    'leads.manage',
    'leads.view',
    'clients.manage',
    'clients.view',
    'policies.manage',
    'policies.view',
    'commissions.manage',
    'commissions.view',
    'renewals.manage',
    'renewals.view',
    'claims.manage',
    'claims.view',
    'reports.view',
    'settings.manage',
    'coi.issue',
    'ai.use'
  ]
)
on conflict (role) do update set permissions = excluded.permissions;

-- Agency Admin role
insert into public.accounts_roles (role, permissions)
values (
  'agency_admin',
  array[
    'agencies.view',
    'leads.manage',
    'leads.view',
    'clients.manage',
    'clients.view',
    'policies.manage',
    'policies.view',
    'commissions.view',
    'renewals.manage',
    'renewals.view',
    'claims.manage',
    'claims.view',
    'reports.view',
    'coi.issue',
    'ai.use'
  ]
)
on conflict (role) do update set permissions = excluded.permissions;

-- Agent role
insert into public.accounts_roles (role, permissions)
values (
  'agent',
  array[
    'leads.manage',
    'leads.view',
    'clients.manage',
    'clients.view',
    'policies.view',
    'renewals.view',
    'claims.view',
    'coi.issue',
    'ai.use'
  ]
)
on conflict (role) do update set permissions = excluded.permissions;

-- CSR role
insert into public.accounts_roles (role, permissions)
values (
  'csr',
  array[
    'leads.view',
    'clients.view',
    'policies.view',
    'coi.issue'
  ]
)
on conflict (role) do update set permissions = excluded.permissions;
