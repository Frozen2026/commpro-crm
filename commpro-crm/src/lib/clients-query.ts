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
 * Production often lacks clients.account_id — fall back to agency_id / owner_id.
 */
export async function loadClientsForContext(
  context: UserContext,
  columns =
    "id, first_name, last_name, business_name, email, phone, city, state, created_at",
): Promise<{ data: ClientListRow[]; error: { message: string; code?: string; details?: string; hint?: string } | null }> {
  const admin = getSupabaseAdmin();

  {
    const { data, error } = await admin
      .from("clients")
      .select(columns)
      .eq("account_id", context.accountId)
      .order("created_at", { ascending: false });

    if (!error) {
      return { data: (data as unknown as ClientListRow[]) ?? [], error: null };
    }

    if (!isMissingColumnError(error.message)) {
      console.error("[loadClientsForContext] account-scoped select failed", error.message);
      return { data: [], error };
    }
  }

  if (context.agencyId) {
    const { data, error } = await admin
      .from("clients")
      .select(columns)
      .eq("agency_id", context.agencyId)
      .order("created_at", { ascending: false });

    if (!error) {
      return { data: (data as unknown as ClientListRow[]) ?? [], error: null };
    }
    console.error("[loadClientsForContext] agency-scoped select failed", error.message);
  }

  {
    const { data, error } = await admin
      .from("clients")
      .select(columns)
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });

    if (!error) {
      return { data: (data as unknown as ClientListRow[]) ?? [], error: null };
    }

    console.error("[loadClientsForContext] owner-scoped select failed", error.message);
    return { data: [], error };
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

export { isMissingColumnError };
