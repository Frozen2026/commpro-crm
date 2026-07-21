import type { SupabaseClient } from "@supabase/supabase-js";

import type { IvansImportSummary, IvansNormalizedPolicy } from "@/lib/ivans/types";

type ClientRow = {
  id: string;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
};

type PolicyRow = {
  id: string;
  client_id: string;
  policy_number: string | null;
  carrier_name: string | null;
};

function digits(value?: string | null) {
  return (value || "").replace(/\D/g, "");
}

function normName(value?: string | null) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function findMatchingClient(
  clients: ClientRow[],
  policy: IvansNormalizedPolicy
): ClientRow | undefined {
  const email = policy.email?.trim().toLowerCase();
  if (email) {
    const byEmail = clients.find((c) => c.email?.trim().toLowerCase() === email);
    if (byEmail) return byEmail;
  }

  const phone = digits(policy.phone);
  if (phone.length >= 7) {
    const byPhone = clients.find((c) => digits(c.phone) === phone);
    if (byPhone) return byPhone;
  }

  const business = normName(policy.businessName);
  if (business) {
    const byBusiness = clients.find((c) => normName(c.business_name) === business);
    if (byBusiness) return byBusiness;
  }

  const fullName = normName(
    [policy.insuredFirstName, policy.insuredLastName].filter(Boolean).join(" ")
  );
  if (fullName) {
    return clients.find(
      (c) =>
        normName([c.first_name, c.last_name].filter(Boolean).join(" ")) === fullName
    );
  }

  return undefined;
}

export async function importIvansPolicies(params: {
  supabase: SupabaseClient;
  accountId: string;
  agencyId: string;
  ownerId?: string;
  policies: IvansNormalizedPolicy[];
  source?: string;
}): Promise<IvansImportSummary> {
  const { supabase, accountId, agencyId, ownerId, policies } = params;
  const summary: IvansImportSummary = {
    createdClients: 0,
    updatedClients: 0,
    createdPolicies: 0,
    updatedPolicies: 0,
    skipped: 0,
    errors: [],
    policies,
  };

  if (!policies.length) {
    return summary;
  }

  const { data: existingClients, error: clientsError } = await supabase
    .from("clients")
    .select("id, business_name, email, phone, first_name, last_name")
    .eq("account_id", accountId);

  if (clientsError) {
    summary.errors.push(`Failed to load clients: ${clientsError.message}`);
    return summary;
  }

  const clients = (existingClients ?? []) as ClientRow[];

  const { data: existingPolicies, error: policiesError } = await supabase
    .from("policies")
    .select("id, client_id, policy_number, carrier_name")
    .eq("account_id", accountId);

  if (policiesError) {
    summary.errors.push(`Failed to load policies: ${policiesError.message}`);
    return summary;
  }

  const policyIndex = new Map<string, PolicyRow>();
  for (const row of (existingPolicies ?? []) as PolicyRow[]) {
    const key = `${(row.policy_number || "").trim().toLowerCase()}|${(row.carrier_name || "").trim().toLowerCase()}`;
    if (row.policy_number) policyIndex.set(key, row);
    const numOnly = (row.policy_number || "").trim().toLowerCase();
    if (numOnly && !policyIndex.has(numOnly)) policyIndex.set(numOnly, row);
  }

  for (const policy of policies) {
    try {
      if (!policy.businessName?.trim() || !policy.policyNumber?.trim()) {
        summary.skipped += 1;
        continue;
      }

      let client = findMatchingClient(clients, policy);

      if (!client) {
        const insertPayload = {
          account_id: accountId,
          agency_id: agencyId,
          owner_id: ownerId ?? null,
          business_name: policy.businessName,
          first_name: policy.insuredFirstName || policy.businessName.split(/\s+/)[0] || "Insured",
          last_name: policy.insuredLastName || null,
          email: policy.email || null,
          phone: policy.phone || null,
          address: policy.address || null,
          city: policy.city || null,
          state: policy.state || null,
          zip: policy.zip || null,
        };

        const { data: created, error } = await supabase
          .from("clients")
          .insert(insertPayload)
          .select("id, business_name, email, phone, first_name, last_name")
          .single();

        if (error || !created) {
          summary.errors.push(
            `Client create failed for ${policy.businessName}: ${error?.message || "unknown"}`
          );
          summary.skipped += 1;
          continue;
        }

        client = created as ClientRow;
        clients.push(client);
        summary.createdClients += 1;
      } else {
        const updatePayload: Record<string, string | null> = {};
        if (!client.email && policy.email) updatePayload.email = policy.email;
        if (!client.phone && policy.phone) updatePayload.phone = policy.phone;
        if (!client.business_name && policy.businessName) {
          updatePayload.business_name = policy.businessName;
        }

        if (Object.keys(updatePayload).length > 0) {
          const { error } = await supabase
            .from("clients")
            .update(updatePayload)
            .eq("id", client.id)
            .eq("account_id", accountId);
          if (!error) {
            summary.updatedClients += 1;
            Object.assign(client, updatePayload);
          }
        }
      }

      const policyKey = `${policy.policyNumber.trim().toLowerCase()}|${policy.carrierName.trim().toLowerCase()}`;
      const numKey = policy.policyNumber.trim().toLowerCase();
      const existing = policyIndex.get(policyKey) || policyIndex.get(numKey);

      const policyPayload = {
        client_id: client.id,
        carrier_name: policy.carrierName || "Unknown Carrier",
        policy_number: policy.policyNumber,
        line_of_business: policy.lineOfBusiness || "Commercial",
        premium: policy.premium ?? 0,
        status: policy.status || "active",
        effective_date: policy.effectiveDate || null,
        expiration_date: policy.expirationDate || null,
      };

      if (existing) {
        const { error } = await supabase
          .from("policies")
          .update(policyPayload)
          .eq("id", existing.id)
          .eq("account_id", accountId);
        if (error) {
          summary.errors.push(
            `Policy update failed for ${policy.policyNumber}: ${error.message}`
          );
          summary.skipped += 1;
        } else {
          summary.updatedPolicies += 1;
          existing.client_id = client.id;
          existing.carrier_name = policyPayload.carrier_name;
        }
      } else {
        const { data: createdPolicy, error } = await supabase
          .from("policies")
          .insert({
            account_id: accountId,
            agency_id: agencyId,
            ...policyPayload,
          })
          .select("id, client_id, policy_number, carrier_name")
          .single();

        if (error || !createdPolicy) {
          summary.errors.push(
            `Policy create failed for ${policy.policyNumber}: ${error?.message || "unknown"}`
          );
          summary.skipped += 1;
        } else {
          const row = createdPolicy as PolicyRow;
          policyIndex.set(policyKey, row);
          policyIndex.set(numKey, row);
          summary.createdPolicies += 1;
        }
      }
    } catch (err) {
      summary.errors.push(
        `Unexpected error for ${policy.policyNumber}: ${
          err instanceof Error ? err.message : "unknown"
        }`
      );
      summary.skipped += 1;
    }
  }

  // Best-effort audit log
  const { error: auditError } = await supabase.from("scrape_runs").insert({
    account_id: accountId,
    agency_id: agencyId,
    run_by: ownerId || null,
    source: params.source || "ivans",
    filters: { count: policies.length },
    results_found: policies.length,
    results_inserted: summary.createdPolicies,
    results_deduped: summary.updatedPolicies,
  });
  if (auditError) {
    // non-fatal
  }

  return summary;
}
