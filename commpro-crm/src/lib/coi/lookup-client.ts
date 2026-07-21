import type { SupabaseClient } from "@supabase/supabase-js";

export type MatchedClient = {
  id: string;
  business_name: string | null;
  phone: string | null;
  email: string | null;
  score: number;
};

export type ActivePolicy = {
  id: string;
  policy_number: string | null;
  carrier_name: string | null;
  line_of_business: string | null;
  effective_date: string | null;
  expiration_date: string | null;
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

/**
 * Find CRM clients for an account using business name, with email/phone boosts.
 * Returns candidates sorted by score (highest first).
 */
export async function findClientsForCoi(
  supabase: SupabaseClient,
  accountId: string,
  input: { insuredName: string; email?: string; phone?: string },
): Promise<MatchedClient[]> {
  const insuredName = input.insuredName.trim();
  if (!insuredName) return [];

  const { data, error } = await supabase
    .from("clients")
    .select("id, business_name, phone, email")
    .eq("account_id", accountId)
    .ilike("business_name", `%${insuredName}%`)
    .order("business_name", { ascending: true })
    .limit(25);

  if (error) {
    throw new Error(error.message);
  }

  const emailNorm = input.email ? normalizeEmail(input.email) : "";
  const phoneDigits = input.phone ? digitsOnly(input.phone) : "";

  const scored = (data ?? []).map((row) => {
    let score = 1;
    const name = (row.business_name ?? "").trim().toLowerCase();
    const needle = insuredName.toLowerCase();

    if (name === needle) score += 5;
    else if (name.startsWith(needle) || needle.startsWith(name)) score += 3;
    else score += 1;

    if (emailNorm && row.email && normalizeEmail(row.email) === emailNorm) {
      score += 4;
    }

    if (phoneDigits.length >= 7 && row.phone) {
      const rowDigits = digitsOnly(row.phone);
      if (rowDigits && (rowDigits.endsWith(phoneDigits) || phoneDigits.endsWith(rowDigits))) {
        score += 3;
      }
    }

    return {
      id: row.id as string,
      business_name: (row.business_name as string | null) ?? null,
      phone: (row.phone as string | null) ?? null,
      email: (row.email as string | null) ?? null,
      score,
    };
  });

  // Also try exact email match within account if name search returned nothing useful.
  if (!scored.length && emailNorm) {
    const { data: byEmail } = await supabase
      .from("clients")
      .select("id, business_name, phone, email")
      .eq("account_id", accountId)
      .ilike("email", emailNorm)
      .limit(5);

    for (const row of byEmail ?? []) {
      scored.push({
        id: row.id as string,
        business_name: (row.business_name as string | null) ?? null,
        phone: (row.phone as string | null) ?? null,
        email: (row.email as string | null) ?? null,
        score: 4,
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score);
}

/** Pick a single confident client, or null if ambiguous / missing. */
export function pickConfidentClient(candidates: MatchedClient[]): MatchedClient | null {
  if (!candidates.length) return null;
  const top = candidates[0]!;
  const second = candidates[1];

  // Unique match
  if (!second) return top;

  // Clear winner
  if (top.score >= second.score + 2 && top.score >= 4) return top;

  return null;
}

export async function loadActivePoliciesForClient(
  supabase: SupabaseClient,
  accountId: string,
  clientId: string,
  policyType?: string,
): Promise<ActivePolicy[]> {
  const { data, error } = await supabase
    .from("policies")
    .select("id, policy_number, carrier_name, line_of_business, effective_date, expiration_date")
    .eq("account_id", accountId)
    .eq("client_id", clientId)
    .eq("status", "active")
    .order("expiration_date", { ascending: true });
  if (error) throw new Error(error.message);

  let policies = (data ?? []) as ActivePolicy[];

  if (policyType?.trim()) {
    const needle = policyType.trim().toLowerCase();
    const filtered = policies.filter((p) => (p.line_of_business ?? "").toLowerCase().includes(needle));
    // If filter removes everything, keep all active policies rather than failing issuance.
    if (filtered.length) policies = filtered;
  }

  return policies;
}

export async function resolveIntakeAccountId(
  supabase: SupabaseClient,
  preferredAccountId?: string | null,
): Promise<string | null> {
  if (preferredAccountId) return preferredAccountId;

  const { data } = await supabase.from("accounts").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
  return data?.id ?? null;
}

export async function resolveIntakeAgencyId(
  supabase: SupabaseClient,
  accountId: string,
  preferredAgencyId?: string | null,
): Promise<string | null> {
  if (preferredAgencyId) return preferredAgencyId;

  const { data } = await supabase
    .from("agencies")
    .select("id")
    .eq("account_id", accountId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}
