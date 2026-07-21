import Link from "next/link";

import { deletePolicy } from "@/app/(app)/policies/actions";
import { getUserContext } from "@/lib/account-context";
import { createClient } from "@/lib/supabase/server";

type PolicyRow = {
  id: string;
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
      }[]
    | null;
};

export default async function PoliciesPage() {
  const context = await getUserContext();
  const supabase = await createClient();

  const { data } = await supabase
    .from("policies")
    .select("id, carrier_name, policy_number, line_of_business, premium, status, effective_date, expiration_date, clients ( business_name, first_name, last_name )")
    .eq("account_id", context.accountId)
    .order("created_at", { ascending: false });

  const policies = (data ?? []) as PolicyRow[];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Policies</h2>
          <p className="mt-1 text-sm text-slate-600">Track policy lifecycle, carriers, and premium values.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/policies/ivans"
            className="rounded-md border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Import from IVANS
          </Link>
          <Link href="/policies/new" className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
            Add Policy
          </Link>
        </div>
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
            {policies.map((policy) => {
              const primaryClient = policy.clients?.[0] ?? null;
              const clientName =
                primaryClient?.business_name ||
                [primaryClient?.first_name, primaryClient?.last_name].filter(Boolean).join(" ") ||
                "-";

              return (
                <tr key={policy.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 text-slate-900">{clientName}</td>
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
                    <div className="flex items-center gap-3">
                      <Link href={`/policies/${policy.id}/edit`} className="font-medium text-[#2563eb]">
                        Edit
                      </Link>
                      <form action={deletePolicy}>
                        <input type="hidden" name="id" value={policy.id} />
                        <button type="submit" className="text-sm font-medium text-rose-600">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
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
