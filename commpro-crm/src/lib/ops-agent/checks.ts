import type { OpsFinding } from "@/lib/ops-agent/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = { from: (table: string) => any };

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function daysFromNowIso(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function finding(
  partial: Omit<OpsFinding, "id"> & { id?: string }
): OpsFinding {
  return {
    id:
      partial.id ||
      `${partial.checkId}:${partial.resourceId || partial.title}`
        .toLowerCase()
        .replace(/[^a-z0-9:_-]+/g, "-")
        .slice(0, 120),
    ...partial,
  };
}

/**
 * Read-only diagnostics for one tenant. Pure data → findings; no writes.
 */
export async function collectOpsFindings(
  db: Db,
  accountId: string
): Promise<OpsFinding[]> {
  const findings: OpsFinding[] = [];
  const today = todayIsoDate();
  const in60 = daysFromNowIso(60);

  const { data: stalePolicies } = await db
    .from("policies")
    .select("id, policy_number, carrier_name, status, expiration_date")
    .eq("account_id", accountId)
    .eq("status", "active")
    .lt("expiration_date", today)
    .limit(100);

  for (const row of stalePolicies ?? []) {
    findings.push(
      finding({
        checkId: "stale_active_policy",
        severity: "error",
        title: "Active policy past expiration",
        detail: `Policy ${row.policy_number || row.id} (${row.carrier_name || "carrier?"}) expired ${row.expiration_date} but status is still active.`,
        resourceType: "policy",
        resourceId: row.id,
        autoFixable: true,
        suggestedAction: "Set status to expired",
      })
    );
  }

  const { data: activeNearExpiry } = await db
    .from("policies")
    .select("id, policy_number, expiration_date, status")
    .eq("account_id", accountId)
    .eq("status", "active")
    .gte("expiration_date", today)
    .lte("expiration_date", in60)
    .limit(100);

  const policyIds = (activeNearExpiry ?? []).map((p: { id: string }) => p.id);
  let renewalPolicyIds = new Set<string>();
  if (policyIds.length) {
    const { data: renewals } = await db
      .from("renewals")
      .select("policy_id")
      .in("policy_id", policyIds);
    renewalPolicyIds = new Set(
      (renewals ?? []).map((r: { policy_id: string }) => r.policy_id)
    );
  }

  for (const row of activeNearExpiry ?? []) {
    if (renewalPolicyIds.has(row.id)) continue;
    findings.push(
      finding({
        checkId: "missing_renewal",
        severity: "warning",
        title: "Renewal window without renewal record",
        detail: `Policy ${row.policy_number || row.id} expires ${row.expiration_date} but has no renewals row.`,
        resourceType: "policy",
        resourceId: row.id,
        autoFixable: true,
        suggestedAction: "Create upcoming renewal",
      })
    );
  }

  const { data: renewalRows } = await db
    .from("renewals")
    .select("id, policy_id, renewal_date, status")
    .in("status", ["upcoming", "contacted"])
    .lt("renewal_date", today)
    .limit(200);

  const renewalPolicyIdList = [
    ...new Set(
      (renewalRows ?? [])
        .map((r: { policy_id?: string }) => r.policy_id)
        .filter(Boolean) as string[]
    ),
  ];

  let accountRenewalPolicyIds = new Set<string>();
  const policyNumberById = new Map<string, string>();
  if (renewalPolicyIdList.length) {
    const { data: ownedPolicies } = await db
      .from("policies")
      .select("id, policy_number")
      .eq("account_id", accountId)
      .in("id", renewalPolicyIdList);
    accountRenewalPolicyIds = new Set(
      (ownedPolicies ?? []).map((p: { id: string }) => p.id)
    );
    for (const p of ownedPolicies ?? []) {
      if (p.policy_number) policyNumberById.set(p.id, p.policy_number);
    }
  }

  const overdueRenewals = (renewalRows ?? []).filter(
    (r: { policy_id: string }) => accountRenewalPolicyIds.has(r.policy_id)
  );

  const renewalIds = overdueRenewals.map((r: { id: string }) => r.id);
  let taskedRenewals = new Set<string>();
  if (renewalIds.length) {
    const { data: tasks } = await db
      .from("tasks")
      .select("related_id")
      .eq("account_id", accountId)
      .eq("related_type", "renewal")
      .in("status", ["open", "in_progress"])
      .in("related_id", renewalIds);
    taskedRenewals = new Set(
      (tasks ?? []).map((t: { related_id: string }) => t.related_id)
    );
  }

  for (const row of overdueRenewals) {
    if (taskedRenewals.has(row.id)) continue;
    const policyNumber = policyNumberById.get(row.policy_id) || row.policy_id;
    findings.push(
      finding({
        checkId: "overdue_renewal_no_task",
        severity: "warning",
        title: "Overdue renewal without open task",
        detail: `Renewal for ${policyNumber} was due ${row.renewal_date} (status ${row.status}).`,
        resourceType: "renewal",
        resourceId: row.id,
        autoFixable: true,
        suggestedAction: "Create high-priority follow-up task",
      })
    );
  }

  const { data: coiLeads } = await db
    .from("leads")
    .select("id, business_name, contact_name, email, stage, created_at, source")
    .eq("account_id", accountId)
    .eq("stage", "new")
    .or("source.ilike.%website-coi%,source.ilike.%coi%")
    .limit(100);

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const coiIds = (coiLeads ?? [])
    .filter((l: { created_at?: string }) =>
      l.created_at ? new Date(l.created_at).getTime() < dayAgo : false
    )
    .map((l: { id: string }) => l.id);

  let taskedLeads = new Set<string>();
  if (coiIds.length) {
    const { data: tasks } = await db
      .from("tasks")
      .select("related_id")
      .eq("account_id", accountId)
      .eq("related_type", "lead")
      .in("status", ["open", "in_progress"])
      .in("related_id", coiIds);
    taskedLeads = new Set(
      (tasks ?? []).map((t: { related_id: string }) => t.related_id)
    );
  }

  for (const lead of coiLeads ?? []) {
    if (!coiIds.includes(lead.id) || taskedLeads.has(lead.id)) continue;
    findings.push(
      finding({
        checkId: "stale_coi_lead",
        severity: "warning",
        title: "Website COI lead waiting >24h",
        detail: `${lead.business_name || lead.contact_name || lead.email || lead.id} is still stage=new with no open task.`,
        resourceType: "lead",
        resourceId: lead.id,
        autoFixable: true,
        suggestedAction: "Create urgent COI follow-up task",
      })
    );
  }

  const { data: noContactClients } = await db
    .from("clients")
    .select("id, business_name, first_name, last_name, email, phone")
    .eq("account_id", accountId)
    .is("email", null)
    .limit(50);

  for (const client of noContactClients ?? []) {
    if (client.phone) continue;
    const name =
      client.business_name ||
      [client.first_name, client.last_name].filter(Boolean).join(" ") ||
      client.id;
    findings.push(
      finding({
        checkId: "client_missing_contact",
        severity: "info",
        title: "Client missing email and phone",
        detail: `${name} has no contact channels — COI and renewals will stall.`,
        resourceType: "client",
        resourceId: client.id,
        autoFixable: true,
        suggestedAction: "Create medium task to collect contact info",
      })
    );
  }

  // Duplicate policy numbers within account
  const { data: allPolicies } = await db
    .from("policies")
    .select("id, policy_number")
    .eq("account_id", accountId)
    .not("policy_number", "is", null)
    .limit(500);

  const byNumber = new Map<string, string[]>();
  for (const p of allPolicies ?? []) {
    const key = String(p.policy_number).trim().toLowerCase();
    if (!key) continue;
    const list = byNumber.get(key) || [];
    list.push(p.id);
    byNumber.set(key, list);
  }
  for (const [num, ids] of byNumber) {
    if (ids.length < 2) continue;
    findings.push(
      finding({
        checkId: "duplicate_policy_number",
        severity: "error",
        title: "Duplicate policy number",
        detail: `Policy number "${num}" appears on ${ids.length} records.`,
        resourceType: "policy",
        resourceId: ids[0],
        autoFixable: false,
        suggestedAction: "Manual review — merge or correct numbers",
      })
    );
  }

  return findings;
}
