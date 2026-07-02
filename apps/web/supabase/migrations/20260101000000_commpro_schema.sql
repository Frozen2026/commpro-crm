-- ============================================================
-- CommPro.ai — MakerKit Schema Mapping
-- File: apps/web/supabase/migrations/20260101000000_commpro_schema.sql
--
-- MakerKit's core convention:
--   public.accounts  → replaces our `organizations` table
--   account_id FK    → replaces our `organization_id` FK everywhere
--   public.accounts_memberships → replaces our `profiles` table for role/membership
--   kit.has_permission(account_id, 'resource.action') → replaces our current_profile() RLS helper
--
-- Our hierarchy maps like this:
--   MakerKit "Team Account"  = our Organization (the MGA/Carrier tenant)
--   MakerKit "Member"        = our profiles row
--   Our "Agency"             = a sub-entity UNDER a team account (no MakerKit concept for this — we keep it as our own table)
--   Our roles (mga_admin, agency_admin, agent, csr) = MakerKit custom permissions in app_permissions enum
-- ============================================================

-- ---------- Step 1: extend MakerKit's permissions enum ----------
-- MakerKit defines public.app_permissions — we add our custom permissions to it.
-- Convention: 'resource.action' pattern per MakerKit docs.
-- Note: Supabase diff does NOT support adding to enums — add manually here.

alter type public.app_permissions add value if not exists 'agencies.manage';
alter type public.app_permissions add value if not exists 'agencies.view';
alter type public.app_permissions add value if not exists 'leads.manage';
alter type public.app_permissions add value if not exists 'leads.view';
alter type public.app_permissions add value if not exists 'clients.manage';
alter type public.app_permissions add value if not exists 'clients.view';
alter type public.app_permissions add value if not exists 'policies.manage';
alter type public.app_permissions add value if not exists 'policies.view';
alter type public.app_permissions add value if not exists 'commissions.manage';
alter type public.app_permissions add value if not exists 'commissions.view';
alter type public.app_permissions add value if not exists 'renewals.manage';
alter type public.app_permissions add value if not exists 'renewals.view';
alter type public.app_permissions add value if not exists 'claims.manage';
alter type public.app_permissions add value if not exists 'claims.view';
alter type public.app_permissions add value if not exists 'reports.view';
alter type public.app_permissions add value if not exists 'settings.manage';
alter type public.app_permissions add value if not exists 'coi.issue';
alter type public.app_permissions add value if not exists 'ai.use';

-- ---------- Step 2: enums (kept from our original schema) ----------
create type lead_stage as enum ('new','contacted','quoted','application','bound','lost');
create type policy_status as enum ('active','pending','cancelled','expired','non_renewed');
create type renewal_status as enum ('upcoming','contacted','quoted','renewed','lost');
create type activity_type as enum ('call','email','sms','note','meeting','ai_action');
create type task_status as enum ('open','in_progress','done');
create type task_priority as enum ('low','medium','high','urgent');
create type commission_paid_status as enum ('pending','paid','disputed');
create type claim_status as enum ('reported','open','in_review','negotiating','closed','denied');

-- ---------- Step 3: Agencies ----------
-- Our `organizations` table is GONE — replaced by MakerKit's `public.accounts`
-- (team accounts). The MGA creates a MakerKit team account; that IS the org.
--
-- Agencies are sub-entities under an account. They stay as our own table,
-- with account_id (not organization_id) as the FK to MakerKit's accounts.

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  name text not null,
  status text default 'active',
  default_commission_split numeric(5,2) default 70.00,
  mga_override_pct numeric(5,2) default 5.00,
  address text,
  phone text,
  producer_name text,
  producer_title text default 'Authorized Representative',
  signature_image_url text,
  producer_phone text,
  producer_email text,
  created_at timestamptz default now()
);

-- ---------- Step 4: Extended profile data ----------
-- MakerKit handles auth.users + accounts_memberships (name, avatar, role).
-- We only store CommPro-specific fields that MakerKit doesn't have.
-- agency_id here says which agency under the team account this member belongs to.

create table public.agent_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete set null,
  phone text,
  created_at timestamptz default now()
);

-- ---------- Step 5: Leads ----------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  owner_id uuid references auth.users(id),
  first_name text not null,
  last_name text,
  business_name text,
  email text,
  phone text,
  source text,
  stage lead_stage default 'new',
  line_of_business text,
  estimated_premium numeric(12,2),
  ai_score int,
  ai_notes text,
  last_contacted_at timestamptz,
  external_source text,
  external_id text,
  raw_data jsonb,
  created_at timestamptz default now()
);

create unique index idx_leads_external_dedupe
  on public.leads(account_id, external_source, external_id)
  where external_id is not null;

-- ---------- Step 6: Clients ----------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  owner_id uuid references auth.users(id),
  lead_id uuid references public.leads(id),
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

create index idx_clients_business_name_trgm on public.clients
  using gin (business_name gin_trgm_ops);
create index idx_clients_email on public.clients (lower(email));
create index idx_clients_phone on public.clients
  (regexp_replace(phone, '[^0-9]', '', 'g'));

-- ---------- Step 7: Policies ----------
create table public.policies (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  carrier_name text not null,
  policy_number text,
  line_of_business text not null,
  premium numeric(12,2) not null,
  commission_rate numeric(5,2) default 10.00,
  status policy_status default 'pending',
  effective_date date,
  expiration_date date,
  created_at timestamptz default now()
);

-- ---------- Step 8: Policy Endorsements ----------
create table public.policy_endorsements (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid references public.policies(id) on delete cascade not null,
  endorsement_type text not null,
  description text,
  additional_insured_name text,
  additional_insured_address text,
  effective_date date,
  document_id uuid,
  created_at timestamptz default now()
);

-- ---------- Step 9: Commissions ----------
create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  policy_id uuid references public.policies(id) on delete cascade not null,
  gross_commission numeric(12,2) not null,
  agency_share numeric(12,2),
  mga_override numeric(12,2),
  statement_period text,
  paid_status commission_paid_status default 'pending',
  paid_date date,
  created_at timestamptz default now()
);

-- ---------- Step 10: Renewals ----------
create table public.renewals (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid references public.policies(id) on delete cascade not null,
  renewal_date date not null,
  status renewal_status default 'upcoming',
  ai_risk_score int,
  ai_notes text,
  created_at timestamptz default now()
);

-- ---------- Step 11: Claims ----------
create table public.claims (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  policy_id uuid references public.policies(id) on delete cascade not null,
  claim_number text,
  carrier_claim_number text,
  date_of_loss date not null,
  date_reported date default current_date,
  description text,
  status claim_status default 'reported',
  reserve_amount numeric(12,2),
  paid_amount numeric(12,2) default 0,
  adjuster_name text,
  adjuster_phone text,
  adjuster_email text,
  created_at timestamptz default now()
);

create table public.claim_notes (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid references public.claims(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  note text not null,
  created_at timestamptz default now()
);

-- ---------- Step 12: Activities ----------
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  related_type text not null,
  related_id uuid not null,
  user_id uuid references auth.users(id),
  type activity_type not null,
  content text,
  created_at timestamptz default now()
);

-- ---------- Step 13: Tasks ----------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  assigned_to uuid references auth.users(id),
  related_type text,
  related_id uuid,
  title text not null,
  due_date date,
  status task_status default 'open',
  priority task_priority default 'medium',
  created_at timestamptz default now()
);

-- ---------- Step 14: Documents ----------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  related_type text,
  related_id uuid,
  file_name text not null,
  file_url text not null,
  document_type text default 'general',
  policy_version int default 1,
  supersedes_document_id uuid references public.documents(id),
  is_current boolean default true,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ---------- Step 15: Audit Log ----------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  action text not null,
  resource_type text not null,
  resource_id uuid not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- ---------- Step 16: COI Certificates + Memory ----------
create table public.coi_certificates (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  client_id uuid references public.clients(id),
  policy_ids uuid[] not null,
  certificate_holder_name text not null,
  certificate_holder_address text,
  pdf_storage_path text not null,
  pdf_url text,
  delivery_method text not null,
  sent_to_email text,
  generated_by text default 'public_request',
  created_at timestamptz default now()
);

create table public.coi_certificate_memory (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  certificate_holder_name text not null,
  certificate_holder_name_normalized text not null,
  certificate_holder_address text,
  policy_ids uuid[] not null,
  usage_count int default 1,
  last_used_at timestamptz default now(),
  created_at timestamptz default now()
);

create unique index idx_coi_memory_client_holder
  on public.coi_certificate_memory (client_id, certificate_holder_name_normalized);

-- ---------- Step 17: SMS / Calls ----------
create table public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  related_type text not null,
  related_id uuid not null,
  user_id uuid references auth.users(id),
  direction text not null,
  from_number text not null,
  to_number text not null,
  body text not null,
  twilio_sid text,
  status text default 'queued',
  created_at timestamptz default now()
);

create table public.calls (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  related_type text,
  related_id uuid,
  user_id uuid references auth.users(id),
  direction text not null,
  from_number text not null,
  to_number text not null,
  twilio_call_sid text,
  status text default 'initiated',
  duration_seconds int,
  recording_url text,
  created_at timestamptz default now()
);

-- ---------- Step 18: Carrier Connections + Quoting ----------
create table public.carrier_connections (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  carrier_name text not null,
  auth_type text not null default 'api_key',
  credential_vault_id uuid,
  base_url text not null,
  status text default 'active',
  last_tested_at timestamptz,
  last_test_status text,
  created_at timestamptz default now()
);

create table public.carrier_quotes (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  lead_id uuid references public.leads(id) not null,
  carrier_name text not null,
  status text default 'pending',
  premium numeric(12,2),
  deductible numeric(12,2),
  coverage_limits jsonb,
  exclusions text[],
  raw_response jsonb,
  ai_summary text,
  error_message text,
  created_at timestamptz default now()
);

-- ---------- Step 19: AI Conversations + Chatbot ----------
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  account_id uuid references public.accounts(id),
  agency_id uuid references public.agencies(id),
  title text,
  messages jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.chatbot_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  line_of_business text,
  content text not null,
  is_active boolean default true,
  updated_at timestamptz default now()
);

create table public.chatbot_conversations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id),
  agency_id uuid references public.agencies(id),
  session_id text not null,
  messages jsonb default '[]'::jsonb,
  lead_id uuid references public.leads(id),
  visitor_verified_human boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- Step 20: Scrape runs ----------
create table public.scrape_runs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  agency_id uuid references public.agencies(id) on delete cascade not null,
  run_by uuid references auth.users(id),
  source text not null,
  filters jsonb,
  results_found int default 0,
  results_inserted int default 0,
  results_deduped int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- Using MakerKit's kit.has_permission() helper instead of
-- our old current_profile() helper — this plugs into MakerKit's
-- RBAC system properly.
-- ============================================================

alter table public.agencies enable row level security;
alter table public.agent_profiles enable row level security;
alter table public.leads enable row level security;
alter table public.clients enable row level security;
alter table public.policies enable row level security;
alter table public.policy_endorsements enable row level security;
alter table public.commissions enable row level security;
alter table public.renewals enable row level security;
alter table public.claims enable row level security;
alter table public.claim_notes enable row level security;
alter table public.activities enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.audit_log enable row level security;
alter table public.coi_certificates enable row level security;
alter table public.coi_certificate_memory enable row level security;
alter table public.sms_messages enable row level security;
alter table public.calls enable row level security;
alter table public.carrier_connections enable row level security;
alter table public.carrier_quotes enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.chatbot_knowledge_base enable row level security;
alter table public.chatbot_conversations enable row level security;
alter table public.scrape_runs enable row level security;

-- Agencies: members with agencies.view permission can see agencies
-- in their account; agencies.manage required to insert/update/delete
create policy "agencies_select" on public.agencies for select
  using (kit.has_permission(auth.uid(), account_id, 'agencies.view'));
create policy "agencies_manage" on public.agencies for all
  using (kit.has_permission(auth.uid(), account_id, 'agencies.manage'));

-- Generic pattern for all account-scoped tables:
-- members with the relevant view/manage permission can access rows
-- belonging to their account_id.

create policy "leads_select" on public.leads for select
  using (kit.has_permission(auth.uid(), account_id, 'leads.view'));
create policy "leads_manage" on public.leads for all
  using (kit.has_permission(auth.uid(), account_id, 'leads.manage'));

create policy "clients_select" on public.clients for select
  using (kit.has_permission(auth.uid(), account_id, 'clients.view'));
create policy "clients_manage" on public.clients for all
  using (kit.has_permission(auth.uid(), account_id, 'clients.manage'));

create policy "policies_select" on public.policies for select
  using (kit.has_permission(auth.uid(), account_id, 'policies.view'));
create policy "policies_manage" on public.policies for all
  using (kit.has_permission(auth.uid(), account_id, 'policies.manage'));

create policy "policy_endorsements_all" on public.policy_endorsements for all
  using (policy_id in (select id from public.policies));

create policy "commissions_select" on public.commissions for select
  using (kit.has_permission(auth.uid(), account_id, 'commissions.view'));
create policy "commissions_manage" on public.commissions for all
  using (kit.has_permission(auth.uid(), account_id, 'commissions.manage'));

create policy "renewals_all" on public.renewals for all
  using (policy_id in (select id from public.policies));

create policy "claims_select" on public.claims for select
  using (kit.has_permission(auth.uid(), account_id, 'claims.view'));
create policy "claims_manage" on public.claims for all
  using (kit.has_permission(auth.uid(), account_id, 'claims.manage'));

create policy "claim_notes_all" on public.claim_notes for all
  using (claim_id in (select id from public.claims));

create policy "activities_select" on public.activities for select
  using (kit.has_permission(auth.uid(), account_id, 'leads.view'));
create policy "activities_manage" on public.activities for all
  using (kit.has_permission(auth.uid(), account_id, 'leads.manage'));

create policy "tasks_select" on public.tasks for select
  using (kit.has_permission(auth.uid(), account_id, 'leads.view'));
create policy "tasks_manage" on public.tasks for all
  using (kit.has_permission(auth.uid(), account_id, 'leads.manage'));

create policy "documents_select" on public.documents for select
  using (kit.has_permission(auth.uid(), account_id, 'policies.view'));
create policy "documents_manage" on public.documents for all
  using (kit.has_permission(auth.uid(), account_id, 'policies.manage'));

-- Audit log: read-only for members with reports.view; inserts from
-- service role only (Edge Functions)
create policy "audit_log_select" on public.audit_log for select
  using (kit.has_permission(auth.uid(), account_id, 'reports.view'));

create policy "coi_select" on public.coi_certificates for select
  using (kit.has_permission(auth.uid(), account_id, 'coi.issue'));
create policy "coi_memory_select" on public.coi_certificate_memory for select
  using (kit.has_permission(auth.uid(), account_id, 'coi.issue'));

create policy "sms_select" on public.sms_messages for select
  using (kit.has_permission(auth.uid(), account_id, 'leads.view'));
create policy "calls_select" on public.calls for select
  using (kit.has_permission(auth.uid(), account_id, 'leads.view'));

create policy "carrier_connections_select" on public.carrier_connections for select
  using (kit.has_permission(auth.uid(), account_id, 'settings.manage'));
create policy "carrier_connections_manage" on public.carrier_connections for all
  using (kit.has_permission(auth.uid(), account_id, 'settings.manage'));

create policy "carrier_quotes_select" on public.carrier_quotes for select
  using (kit.has_permission(auth.uid(), account_id, 'leads.view'));

create policy "ai_conversations_own" on public.ai_conversations for all
  using (user_id = auth.uid());

create policy "chatbot_kb_public_read" on public.chatbot_knowledge_base
  for select using (is_active = true);

create policy "scrape_runs_select" on public.scrape_runs for select
  using (kit.has_permission(auth.uid(), account_id, 'leads.manage'));

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_agencies_account on public.agencies(account_id);
create index idx_leads_account on public.leads(account_id);
create index idx_leads_agency on public.leads(agency_id);
create index idx_leads_stage on public.leads(stage);
create index idx_clients_account on public.clients(account_id);
create index idx_clients_agency on public.clients(agency_id);
create index idx_policies_account on public.policies(account_id);
create index idx_policies_client on public.policies(client_id);
create index idx_policies_expiration on public.policies(expiration_date);
create index idx_commissions_account on public.commissions(account_id);
create index idx_renewals_date on public.renewals(renewal_date);
create index idx_activities_related on public.activities(related_type, related_id);
create index idx_tasks_account on public.tasks(account_id);
create index idx_tasks_assigned on public.tasks(assigned_to);

-- ============================================================
-- Fuzzy match function (used by COI lookup)
-- ============================================================
create extension if not exists pg_trgm;

create or replace function match_clients_by_name(search_name text, similarity_threshold float)
returns table (
  id uuid, business_name text, address text, city text, state text, similarity float
) as $$
  select id, business_name, address, city, state,
         similarity(business_name, search_name) as similarity
  from public.clients
  where business_name is not null
    and similarity(business_name, search_name) > similarity_threshold
  order by similarity desc
  limit 5;
$$ language sql stable;
