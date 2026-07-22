import Link from "next/link";

import { deletePolicy } from "@/app/(app)/policies/actions";
import { getUserContext } from "@/lib/account-context";
import { isMissingColumnError } from "@/lib/clients-query";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type PolicyRow = {
  id: string;
  client_id: string | null;
  carrier_name: string | null;
  policy_number: string | null;
  line_of_business: string | null;
  premium: number | null;
  status: string | null;
  effective_date: string | null;
  expiration_date: string | null;
  clients:
    | {
        business_name: string | null;
        first_name: string | null;
        last_name: string | null;
      }
    | {
        business_name: string | null;
        first_name: string | null;
        last_name: string | null;
      }[]
    | null;
};

const POLICY_LIST_SELECT =
  "id, client_id, carrier_name, policy_number, line_of_business, premium, status, effective_date, expiration_date, clients ( business_name, first_name, last_name )";

async function loadPolicies(context: {
  accountId: string;
  agencyId: string | null;
}): Promise<PolicyRow[]> {
  const admin = getSupabaseAdmin();

  {
    const { data, error } = await admin
      .from("policies")
      .select(POLICY_LIST_SELECT)
      .eq("account_id", context.accountId)
      .order("created_at", { ascending: false });

    if (!error) {
      return (data ?? []) as PolicyRow[];
    }

    if (!isMissingColumnError(error.message)) {
      console.error("[policies.page] account-scoped select failed", error.message);
      return [];
    }
  }

  if (context.agencyId) {
    const { data, error } = await admin
      .from("policies")
      .select(POLICY_LIST_SELECT)
      .eq("agency_id", context.agencyId)
      .order("created_at", { ascending: false });

    if (!error) {
      return (data ?? []) as PolicyRow[];
    }
    console.error("[policies.page] agency-scoped select failed", error.message);
  }

  const { data, error } = await admin
    .from("policies")
    .select(POLICY_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[policies.page] unscoped select failed", error.message);
    return [];
  }

  return (data ?? []) as PolicyRow[];
}

function clientName(policy: PolicyRow) {
  const raw = policy.clients;
  const primary = Array.isArray(raw) ? raw[0] ?? null : raw;
  return (
    primary?.business_name ||
    [primary?.first_name, primary?.last_name].filter(Boolean).join(" ") ||
    "-"
  );
}

export default async function PoliciesPage() {
  const context = await getUserContext();
  const policies = await loadPolicies(context);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Policies</h2>
          <p className="mt-1 text-sm text-slate-600">Track policy lifecycle, carriers, and premium values.</p>
        </div>
        <Link
          href="/policies/new"
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          Add Policy
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Client Name</th>
              <th className="px-4 py-3 font-semibold">Carrier Name</th>
              <th className="px-4 py-3 font-semibold">Policy Number</th>
              <th className="px-4 py-3 font-semibold">Line of Business</th>
              <th className="px-4 py-3 font-semibold">Premium</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Effective Date</th>
              <th className="px-4 py-3 font-semibold">Expiration Date</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 text-slate-900">{clientName(policy)}</td>
                <td className="px-4 py-3 text-slate-700">{policy.carrier_name ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{policy.policy_number ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{policy.line_of_business ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">
                  {policy.premium != null ? `$${policy.premium.toLocaleString()}` : "-"}
                </td>
                <td className="px-4 py-3 text-slate-700">{policy.status ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{policy.effective_date ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{policy.expiration_date ?? "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/policies/${policy.id}/edit`}
                      className="font-medium text-[var(--primary)]"
                    >
                      Edit
                    </Link>
                    {policy.client_id ? (
                      <Link
                        href={`/coi?client_id=${policy.client_id}&policy_id=${policy.id}`}
                        className="font-medium text-[var(--primary)]"
                      >
                        Issue COI
                      </Link>
                    ) : null}
                    <form action={deletePolicy}>
                      <input type="hidden" name="id" value={policy.id} />
                      <button type="submit" className="text-sm font-medium text-rose-600">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {policies.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  No policies found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
