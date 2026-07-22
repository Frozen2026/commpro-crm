import "server-only";

import type { UserContext } from "@/lib/account-context";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export type ClientListRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  created_at?: string | null;
};

export type ClientPickerOption = {
  id: string;
  label: string;
};

function isMissingColumnError(message?: string | null) {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes("does not exist") || m.includes("could not find the");
}

type FilterKey = "account_id" | "agency_id" | "owner_id" | null;

/**
 * Load clients for the current user.
 * Production often lacks clients.account_id — fall back to agency_id / owner_id / all.
 * Empty results also fall through (wrong account/agency must not hide real clients).
 */
async function queryClients(
  columns: string,
  filter: FilterKey,
  filterValue: string | null | undefined,
  limit?: number,
): Promise<{
  data: ClientListRow[] | null;
  error: { message: string; code?: string; details?: string; hint?: string } | null;
}> {
  const admin = getSupabaseAdmin();

  const run = async (cols: string, orderByCreatedAt: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = admin.from("clients").select(cols);
    if (filter && filterValue) {
      q = q.eq(filter, filterValue);
    }
    if (orderByCreatedAt) {
      q = q.order("created_at", { ascending: false });
    }
    if (limit != null) {
      q = q.limit(limit);
    }
    return q;
  };

  let result = await run(columns, true);
  if (result.error && isMissingColumnError(result.error.message)) {
    result = await run(columns, false);
  }
  if (result.error && isMissingColumnError(result.error.message)) {
    const lean = "id, business_name, first_name, last_name, phone, email";
    result = await run(lean, false);
  }

  return {
    data: (result.data as ClientListRow[] | null) ?? null,
    error: result.error ?? null,
  };
}

export async function loadClientsForContext(
  context: UserContext,
  columns =
    "id, first_name, last_name, business_name, email, phone, city, state, created_at",
): Promise<{
  data: ClientListRow[];
  error: { message: string; code?: string; details?: string; hint?: string } | null;
}> {
  let lastError: { message: string; code?: string; details?: string; hint?: string } | null =
    null;

  // 1) Account-scoped
  {
    const { data, error } = await queryClients(columns, "account_id", context.accountId);
    if (!error && data && data.length > 0) {
      return { data, error: null };
    }
    if (error && !isMissingColumnError(error.message)) {
      lastError = error;
      console.error("[loadClientsForContext] account-scoped select failed", error.message);
    }
  }

  // 2) Agency-scoped
  if (context.agencyId) {
    const { data, error } = await queryClients(columns, "agency_id", context.agencyId);
    if (!error && data && data.length > 0) {
      return { data, error: null };
    }
    if (error) {
      lastError = error;
      console.error("[loadClientsForContext] agency-scoped select failed", error.message);
    }
  }

  // 3) Owner-scoped
  {
    const { data, error } = await queryClients(columns, "owner_id", context.userId);
    if (!error && data && data.length > 0) {
      return { data, error: null };
    }
    if (error) {
      lastError = error;
      console.error("[loadClientsForContext] owner-scoped select failed", error.message);
    }
  }

  // 4) Unscoped (service role) — last resort so COI/policy pickers are never blank
  {
    const { data, error } = await queryClients(columns, null, null, 200);
    if (!error) {
      return { data: data ?? [], error: null };
    }

    console.error("[loadClientsForContext] unscoped select failed", error.message);
    return { data: [], error: error ?? lastError };
  }
}

export function toClientPickerOptions(clients: ClientListRow[]): ClientPickerOption[] {
  return clients
    .map((client) => {
      const fullName = [client.first_name, client.last_name].filter(Boolean).join(" ");
      return {
        id: String(client.id),
        label: client.business_name || fullName || String(client.id),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Soft match: true if any provided criterion matches (name OR phone OR email). */
export function clientMatchesQuery(
  client: ClientListRow,
  query: string,
  phone = "",
  email = "",
) {
  const q = query.trim().toLowerCase();
  const phoneDigits = phone.replace(/\D/g, "");
  const emailQ = email.trim().toLowerCase();
  const hasAnyCriterion = Boolean(q || phoneDigits || emailQ);
  if (!hasAnyCriterion) return true;

  const haystack = [
    client.business_name,
    client.first_name,
    client.last_name,
    client.email,
    client.phone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (q && haystack.includes(q)) return true;

  if (phoneDigits) {
    const clientPhone = (client.phone ?? "").replace(/\D/g, "");
    if (clientPhone && clientPhone.includes(phoneDigits)) return true;
  }

  if (emailQ) {
    const clientEmail = (client.email ?? "").toLowerCase();
    if (clientEmail && clientEmail.includes(emailQ)) return true;
  }

  return false;
}

export { isMissingColumnError };
