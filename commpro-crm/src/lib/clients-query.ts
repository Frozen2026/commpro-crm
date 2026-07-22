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

/**
 * Load clients for the current user.
 * Production often lacks clients.account_id — fall back to agency_id / owner_id / all.
 * Empty results also fall through (wrong account/agency must not hide real clients).
 */
export async function loadClientsForContext(
  context: UserContext,
  columns =
    "id, first_name, last_name, business_name, email, phone, city, state, created_at",
): Promise<{
  data: ClientListRow[];
  error: { message: string; code?: string; details?: string; hint?: string } | null;
}> {
  const admin = getSupabaseAdmin();
  let lastError: { message: string; code?: string; details?: string; hint?: string } | null =
    null;

  // 1) Account-scoped
  {
    const { data, error } = await admin
      .from("clients")
      .select(columns)
      .eq("account_id", context.accountId)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return { data: data as unknown as ClientListRow[], error: null };
    }
    if (error && !isMissingColumnError(error.message)) {
      lastError = error;
      console.error("[loadClientsForContext] account-scoped select failed", error.message);
    }
  }

  // 2) Agency-scoped
  if (context.agencyId) {
    const { data, error } = await admin
      .from("clients")
      .select(columns)
      .eq("agency_id", context.agencyId)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return { data: data as unknown as ClientListRow[], error: null };
    }
    if (error) {
      lastError = error;
      console.error("[loadClientsForContext] agency-scoped select failed", error.message);
    }
  }

  // 3) Owner-scoped
  {
    const { data, error } = await admin
      .from("clients")
      .select(columns)
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return { data: data as unknown as ClientListRow[], error: null };
    }
    if (error) {
      lastError = error;
      console.error("[loadClientsForContext] owner-scoped select failed", error.message);
    }
  }

  // 4) Unscoped (service role) — last resort so COI/policy pickers are never blank
  {
    const { data, error } = await admin
      .from("clients")
      .select(columns)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error) {
      return { data: (data as unknown as ClientListRow[]) ?? [], error: null };
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

export function clientMatchesQuery(
  client: ClientListRow,
  query: string,
  phone = "",
  email = "",
) {
  const q = query.trim().toLowerCase();
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

  if (q && !haystack.includes(q)) {
    return false;
  }

  if (phone.trim()) {
    const digits = phone.replace(/\D/g, "");
    const clientPhone = (client.phone ?? "").replace(/\D/g, "");
    if (digits && clientPhone && !clientPhone.includes(digits)) {
      return false;
    }
  }

  if (email.trim()) {
    const clientEmail = (client.email ?? "").toLowerCase();
    if (clientEmail && !clientEmail.includes(email.trim().toLowerCase())) {
      return false;
    }
  }

  return true;
}

export { isMissingColumnError };
