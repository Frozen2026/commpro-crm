import "server-only";

import type { UserContext } from "@/lib/account-context";
import { isMissingColumnError } from "@/lib/clients-query";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type CoiPolicyRow = {
  id: string;
  policy_number: string | null;
  line_of_business: string | null;
  carrier_name: string | null;
  effective_date?: string | null;
  expiration_date?: string | null;
  status?: string | null;
  client_id?: string | null;
};

export type CoiCertificateRow = {
  id: string;
  client_id: string | null;
  policy_ids: string[] | null;
  certificate_holder_name: string;
  certificate_holder_address: string | null;
  created_at: string | null;
  generated_by: string | null;
};

/** Load policies for a client, tolerant of missing account_id / status filters. */
export async function loadPoliciesForClient(
  context: UserContext,
  clientId: string,
  opts?: { activeOnly?: boolean },
): Promise<CoiPolicyRow[]> {
  const admin = getSupabaseAdmin();
  const activeOnly = opts?.activeOnly ?? false;
  const columns =
    "id, policy_number, line_of_business, carrier_name, effective_date, expiration_date, status, client_id";

  async function run(extra?: { accountScoped?: boolean }) {
    let q = admin.from("policies").select(columns).eq("client_id", clientId);
    if (extra?.accountScoped) {
      q = q.eq("account_id", context.accountId);
    } else if (context.agencyId) {
      q = q.eq("agency_id", context.agencyId);
    }
    if (activeOnly) {
      q = q.eq("status", "active");
    }
    return q.order("expiration_date", { ascending: true });
  }

  {
    const { data, error } = await run({ accountScoped: true });
    if (!error) {
      return (data ?? []) as CoiPolicyRow[];
    }
    if (!isMissingColumnError(error.message)) {
      console.error("[coi] account-scoped policies failed", error.message);
    }
  }

  {
    const { data, error } = await run();
    if (!error) {
      return (data ?? []) as CoiPolicyRow[];
    }
    // Retry without status filter if status column issues, or without agency
    console.error("[coi] agency-scoped policies failed", error.message);
  }

  const { data, error } = await admin
    .from("policies")
    .select(columns)
    .eq("client_id", clientId)
    .order("expiration_date", { ascending: true });

  if (error) {
    console.error("[coi] client-scoped policies failed", error.message);
    return [];
  }

  const rows = (data ?? []) as CoiPolicyRow[];
  if (activeOnly) {
    return rows.filter((row) => !row.status || row.status === "active");
  }
  return rows;
}

export async function loadRecentCoiCertificates(clientId: string, limit = 10) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("coi_certificates")
    .select(
      "id, client_id, policy_ids, certificate_holder_name, certificate_holder_address, created_at, generated_by",
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[coi] recent certificates failed", error.message);
    return [] as CoiCertificateRow[];
  }

  return (data ?? []) as CoiCertificateRow[];
}

export async function persistCoiCertificate(input: {
  context: UserContext;
  clientId: string;
  policyIds: string[];
  certificateHolderName: string;
  certificateHolderAddress: string | null;
  generatedBy?: string;
}) {
  const admin = getSupabaseAdmin();
  const path = `download/coi-${input.clientId}-${Date.now()}.pdf`;

  let agencyId = input.context.agencyId;
  if (!agencyId) {
    const { data: agency } = await admin.from("agencies").select("id").limit(1).maybeSingle();
    agencyId = agency?.id ? String(agency.id) : null;
  }

  const attempts: Record<string, unknown>[] = [
    {
      account_id: input.context.accountId,
      agency_id: agencyId,
      client_id: input.clientId,
      policy_ids: input.policyIds,
      certificate_holder_name: input.certificateHolderName,
      certificate_holder_address: input.certificateHolderAddress,
      pdf_storage_path: path,
      delivery_method: "download",
      generated_by: input.generatedBy ?? "agent",
    },
    {
      agency_id: agencyId,
      client_id: input.clientId,
      policy_ids: input.policyIds,
      certificate_holder_name: input.certificateHolderName,
      certificate_holder_address: input.certificateHolderAddress,
      pdf_storage_path: path,
      delivery_method: "download",
      generated_by: input.generatedBy ?? "agent",
    },
    {
      client_id: input.clientId,
      policy_ids: input.policyIds,
      certificate_holder_name: input.certificateHolderName,
      certificate_holder_address: input.certificateHolderAddress,
      pdf_storage_path: path,
      delivery_method: "download",
      generated_by: input.generatedBy ?? "agent",
    },
  ];

  let savedId: string | null = null;
  let lastError: string | null = null;

  for (const payload of attempts) {
    // Skip payloads that still have null agency_id when the key is present
    if ("agency_id" in payload && !payload.agency_id) {
      continue;
    }
    const { data, error } = await admin
      .from("coi_certificates")
      .insert(payload)
      .select("id")
      .maybeSingle();
    if (!error && data?.id) {
      savedId = String(data.id);
      break;
    }
    lastError = error?.message ?? "unknown error";
    if (error && !isMissingColumnError(error.message) && !error.message.includes("null value")) {
      break;
    }
  }

  if (!savedId) {
    console.error("[coi] persist certificate failed", lastError);
    return null;
  }

  const normalized = input.certificateHolderName.trim().toLowerCase();
  if (normalized) {
    const memoryAttempts: Record<string, unknown>[] = [
      {
        account_id: input.context.accountId,
        agency_id: agencyId,
        client_id: input.clientId,
        certificate_holder_name: input.certificateHolderName,
        certificate_holder_name_normalized: normalized,
        certificate_holder_address: input.certificateHolderAddress,
        policy_ids: input.policyIds,
        last_used_at: new Date().toISOString(),
      },
      {
        agency_id: agencyId,
        client_id: input.clientId,
        certificate_holder_name: input.certificateHolderName,
        certificate_holder_name_normalized: normalized,
        certificate_holder_address: input.certificateHolderAddress,
        policy_ids: input.policyIds,
        last_used_at: new Date().toISOString(),
      },
    ];

    for (const memoryPayload of memoryAttempts) {
      if ("agency_id" in memoryPayload && !memoryPayload.agency_id) continue;
      const mem = await admin.from("coi_certificate_memory").upsert(memoryPayload, {
        onConflict: "client_id,certificate_holder_name_normalized",
      });
      if (!mem.error) break;
      console.warn("[coi] memory upsert skipped", mem.error.message);
    }
  }

  return savedId;
}
