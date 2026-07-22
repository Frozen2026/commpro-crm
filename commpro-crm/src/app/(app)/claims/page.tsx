import Link from "next/link";

import { deleteClaim } from "@/app/(app)/claims/actions";
import { getUserContext } from "@/lib/account-context";
import { createClient } from "@/lib/supabase/server";

type ClaimRow = {
  id: string;
  claim_number: string | null;
  date_of_loss: string | null;
  status: string | null;
  reserve_amount: number | null;
  paid_amount: number | null;
  policies:
    | {
        policy_number: string | null;
        clients:
          | {
              business_name: string | null;
              first_name: string | null;
              last_name: string | null;
            }[]
          | null;
      }[]
    | null;
};

const statusClasses: Record<string, string> = {
  reported: "bg-sky-100 text-sky-700",
  open: "bg-amber-100 text-amber-700",
  in_review: "bg-indigo-100 text-indigo-700",
  negotiating: "bg-violet-100 text-violet-700",
  closed: "bg-emerald-100 text-emerald-700",
  denied: "bg-rose-100 text-rose-700",
};

export default async function ClaimsPage() {
  const context = await getUserContext();
  const supabase = await createClient();

  const { data } = await supabase
    .from("claims")
    .select("id, claim_number, date_of_loss, status, reserve_amount, paid_amount, policies ( policy_number, clients ( business_name, first_name, last_name ) )")
    .eq("account_id", context.accountId)
    .order("created_at", { ascending: false });

  const claims = (data ?? []) as ClaimRow[];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Claims</h2>
          <p className="mt-1 text-sm text-slate-600">Manage claim status, reserves, and adjuster tracking.</p>
        </div>
        <Link href="/claims/new" className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
          Add Claim
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Client Name</th>
              <th className="px-4 py-3 font-semibold">Claim Number</th>
              <th className="px-4 py-3 font-semibold">Date of Loss</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Reserve Amount</th>
              <th className="px-4 py-3 font-semibold">Paid Amount</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => {
              const policy = claim.policies?.[0] ?? null;
              const client = policy?.clients?.[0] ?? null;
              const clientName =
                client?.business_name ||
                [client?.first_name, client?.last_name].filter(Boolean).join(" ") ||
                "-";

              const statusClass = statusClasses[claim.status ?? ""] ?? "bg-slate-100 text-slate-700";

              return (
                <tr key={claim.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 text-slate-900">{clientName}</td>
                  <td className="px-4 py-3 text-slate-700">{claim.claim_number ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{claim.date_of_loss ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass}`}>
                      {claim.status ?? "unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {claim.reserve_amount != null ? `$${claim.reserve_amount.toLocaleString()}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {claim.paid_amount != null ? `$${claim.paid_amount.toLocaleString()}` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/claims/${claim.id}/edit`} className="font-medium text-[var(--primary)]">
                        Edit
                      </Link>
                      <form action={deleteClaim}>
                        <input type="hidden" name="id" value={claim.id} />
                        <button type="submit" className="text-sm font-medium text-rose-600">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {claims.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No claims found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
