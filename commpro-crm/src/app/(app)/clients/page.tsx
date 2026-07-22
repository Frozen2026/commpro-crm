import Link from "next/link";

import { deleteClient } from "@/app/(app)/clients/actions";
import { ErrorConsoleLogger } from "@/app/(app)/clients/new/error-console-logger";
import { getUserContext } from "@/lib/account-context";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type ClientRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  created_at: string | null;
};

const CLIENT_LIST_COLUMNS =
  "id, first_name, last_name, business_name, email, phone, city, state, created_at";

function isMissingColumnError(message?: string | null) {
  if (!message) return false;
  const m = message.toLowerCase();
  return m.includes("does not exist") || m.includes("could not find the");
}

/**
 * Load clients visible to this user.
 * Production often lacks clients.account_id — fall back to agency_id / owner_id.
 * Uses service role so drifted RLS does not hide rows the user just created.
 */
async function loadClients(context: {
  userId: string;
  accountId: string;
  agencyId: string | null;
}) {
  const admin = getSupabaseAdmin();

  // 1) Preferred: account-scoped (MakerKit / full schema)
  {
    const { data, error } = await admin
      .from("clients")
      .select(CLIENT_LIST_COLUMNS)
      .eq("account_id", context.accountId)
      .order("created_at", { ascending: false });

    if (!error) {
      return { data: (data ?? []) as ClientRow[], error: null };
    }

    if (!isMissingColumnError(error.message)) {
      console.error("[clients.page] account-scoped select failed", error.message);
      return { data: [] as ClientRow[], error };
    }
  }

  // 2) Agency-scoped (production drift: no account_id column)
  if (context.agencyId) {
    const { data, error } = await admin
      .from("clients")
      .select(CLIENT_LIST_COLUMNS)
      .eq("agency_id", context.agencyId)
      .order("created_at", { ascending: false });

    if (!error) {
      return { data: (data ?? []) as ClientRow[], error: null };
    }
    console.error("[clients.page] agency-scoped select failed", error.message);
  }

  // 3) Owner-scoped
  {
    const { data, error } = await admin
      .from("clients")
      .select(CLIENT_LIST_COLUMNS)
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });

    if (!error) {
      return { data: (data ?? []) as ClientRow[], error: null };
    }

    console.error("[clients.page] owner-scoped select failed", error.message);
    return { data: [] as ClientRow[], error };
  }
}

function displayName(client: ClientRow) {
  if (client.business_name?.trim()) return client.business_name;
  const person = [client.first_name, client.last_name].filter(Boolean).join(" ").trim();
  return person || "-";
}

export default async function ClientsPage() {
  const context = await getUserContext();
  const { data: clients, error } = await loadClients(context);

  const supabaseError = error
    ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }
    : null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Clients</h2>
          <p className="mt-1 text-sm text-slate-600">Maintain insured accounts and contact information.</p>
        </div>
        <Link
          href="/clients/new"
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          Add Client
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
        <ErrorConsoleLogger error={error?.message ?? null} supabaseError={supabaseError} />
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">City</th>
              <th className="px-4 py-3 font-semibold">State</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 text-slate-900">{displayName(client)}</td>
                <td className="px-4 py-3 text-slate-700">{client.email ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{client.phone ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{client.city ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{client.state ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">
                  {client.created_at ? new Date(client.created_at).toLocaleDateString() : "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/clients/${client.id}/edit`}
                      className="font-medium text-[var(--primary)]"
                    >
                      Edit
                    </Link>
                    <form action={deleteClient}>
                      <input type="hidden" name="id" value={client.id} />
                      <button type="submit" className="text-sm font-medium text-rose-600">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No clients found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
