-- Public website COI intake: one security-definer function so the app
-- does not need broad service_role table grants on accounts/agencies.

create or replace function public.submit_website_coi_request(
  p_insured_name text,
  p_email text,
  p_holder_name text,
  p_contact_name text default null,
  p_phone text default null,
  p_holder_email text default null,
  p_holder_address text default null,
  p_policy_type text default null,
  p_needed_by text default null,
  p_notes text default null,
  p_account_id uuid default null,
  p_agency_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
  v_agency_id uuid;
  v_lead_id uuid;
  v_summary text;
  v_first_name text;
  v_last_name text;
begin
  if coalesce(trim(p_insured_name), '') = ''
     or coalesce(trim(p_email), '') = ''
     or coalesce(trim(p_holder_name), '') = '' then
    raise exception 'insured_name, email, and holder_name are required';
  end if;

  v_account_id := p_account_id;
  v_agency_id := p_agency_id;

  if v_account_id is null then
    select id into v_account_id
    from public.accounts
    order by created_at asc nulls last
    limit 1;
  end if;

  if v_account_id is null then
    raise exception 'no account available for COI intake';
  end if;

  if v_agency_id is null then
    select id into v_agency_id
    from public.agencies
    where account_id = v_account_id
    order by created_at asc nulls last
    limit 1;
  end if;

  if v_agency_id is null then
    raise exception 'no agency available for COI intake';
  end if;

  v_summary := format(
    E'PUBLIC COI REQUEST\nInsured / Business: %s\nRequestor Name: %s\nRequestor Email: %s\nRequestor Phone: %s\nCertificate Holder: %s\nHolder Email: %s\nHolder Address: %s\nCoverage / Policy Type: %s\nNeeded By: %s\nAdditional Instructions: %s',
    trim(p_insured_name),
    coalesce(nullif(trim(p_contact_name), ''), 'N/A'),
    trim(p_email),
    coalesce(nullif(trim(p_phone), ''), 'N/A'),
    trim(p_holder_name),
    coalesce(nullif(trim(p_holder_email), ''), 'N/A'),
    coalesce(nullif(trim(p_holder_address), ''), 'N/A'),
    coalesce(nullif(trim(p_policy_type), ''), 'N/A'),
    coalesce(nullif(trim(p_needed_by), ''), 'ASAP'),
    coalesce(nullif(trim(p_notes), ''), 'N/A')
  );

  if coalesce(trim(p_contact_name), '') = '' then
    v_first_name := 'COI';
    v_last_name := 'Request';
  else
    v_first_name := trim(p_contact_name);
    v_last_name := null;
  end if;

  insert into public.leads (
    account_id,
    agency_id,
    first_name,
    last_name,
    business_name,
    email,
    phone,
    source,
    stage,
    line_of_business,
    ai_notes,
    external_source,
    external_id,
    raw_data
  ) values (
    v_account_id,
    v_agency_id,
    v_first_name,
    v_last_name,
    trim(p_insured_name),
    trim(p_email),
    nullif(trim(p_phone), ''),
    'website-coi',
    'new',
    coalesce(nullif(trim(p_policy_type), ''), 'COI Request'),
    v_summary,
    'website-coi',
    lower(trim(p_email)) || '-' || extract(epoch from now())::bigint::text,
    jsonb_build_object(
      'insuredName', trim(p_insured_name),
      'contactName', nullif(trim(p_contact_name), ''),
      'email', trim(p_email),
      'phone', nullif(trim(p_phone), ''),
      'holderName', trim(p_holder_name),
      'holderEmail', nullif(trim(p_holder_email), ''),
      'holderAddress', nullif(trim(p_holder_address), ''),
      'policyType', nullif(trim(p_policy_type), ''),
      'neededBy', nullif(trim(p_needed_by), ''),
      'notes', nullif(trim(p_notes), ''),
      'submittedAt', now()
    )
  )
  returning id into v_lead_id;

  return v_lead_id;
end;
$$;

revoke all on function public.submit_website_coi_request(
  text, text, text, text, text, text, text, text, text, text, uuid, uuid
) from public;

grant execute on function public.submit_website_coi_request(
  text, text, text, text, text, text, text, text, text, text, uuid, uuid
) to service_role, authenticated, anon;
