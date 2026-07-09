import { getUserContext } from "@/lib/account-context";
import { createClient } from "@/lib/supabase/server";

type CommissionRow = {
  id: string;
  gross_commission: number;
  agency_share: number | null;
  mga_override: number | null;
  statement_period: string | null;
  paid_status: string | null;
  policies:
    | {
        policy_number: string | null;
        carrier_name: string | null;
      }[]
    | null;
};

const paidStatusClasses: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  disputed: "bg-rose-100 text-rose-700",
};

export default async function CommissionsPage() {
  const context = await getUserContext();
  const supabase = await createClient();

  const { data } = await supabase
    .from("commissions")
    .select("id, gross_commission, agency_share, mga_override, statement_period, paid_status, policies ( policy_number, carrier_name )")
    .eq("account_id", context.accountId)
    .order("created_at", { ascending: false });

  const commissions = (data ?? []) as CommissionRow[];

  const totals = commissions.reduce(
    (acc, row) => {
      acc.gross += Number(row.gross_commission ?? 0);
      acc.agency += Number(row.agency_share ?? 0);
      acc.override += Number(row.mga_override ?? 0);
      return acc;
    },
    { gross: 0, agency: 0, override: 0 }
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Commissions</h2>
        <p className="mt-1 text-sm text-slate-600">Statement-level commission tracking across policies and carriers.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Policy Number</th>
              <th className="px-4 py-3 font-semibold">Carrier Name</th>
              <th className="px-4 py-3 font-semibold">Gross Commission</th>
              <th className="px-4 py-3 font-semibold">Agency Share</th>
              <th className="px-4 py-3 font-semibold">MGA Override</th>
              <th className="px-4 py-3 font-semibold">Statement Period</th>
              <th className="px-4 py-3 font-semibold">Paid Status</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((commission) => {
              const policy = commission.policies?.[0] ?? null;
              const statusClass = paidStatusClasses[commission.paid_status ?? ""] ?? "bg-slate-100 text-slate-700";

              return (
                <tr key={commission.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 text-slate-900">{policy?.policy_number ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{policy?.carrier_name ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-700">${Number(commission.gross_commission ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">${Number(commission.agency_share ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">${Number(commission.mga_override ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-700">{commission.statement_period ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass}`}>
                      {commission.paid_status ?? "pending"}
                    </span>
                  </td>
                </tr>
              );
            })}

            <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-800">
              <td className="px-4 py-3" colSpan={2}>
                Totals
              </td>
              <td className="px-4 py-3">${totals.gross.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
              <td className="px-4 py-3">${totals.agency.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
              <td className="px-4 py-3">${totals.override.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
              <td className="px-4 py-3" colSpan={2} />
            </tr>

            {commissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No commissions found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
