import { getUserContext } from "@/lib/account-context";
import { createClient } from "@/lib/supabase/server";

export default async function ReportsPage() {
  const context = await getUserContext();
  const supabase = await createClient();

  const [policiesResult, renewalsResult, claimsResult, commissionsResult] = await Promise.all([
    supabase
      .from("policies")
      .select("status, premium, created_at")
      .eq("account_id", context.accountId),
    supabase
      .from("renewals")
      .select("status")
      .order("created_at", { ascending: false }),
    supabase
      .from("claims")
      .select("status, reserve_amount, paid_amount")
      .eq("account_id", context.accountId),
    supabase
      .from("commissions")
      .select("gross_commission, agency_share, paid_status")
      .eq("account_id", context.accountId),
  ]);

  const policies = policiesResult.data ?? [];
  const renewals = renewalsResult.data ?? [];
  const claims = claimsResult.data ?? [];
  const commissions = commissionsResult.data ?? [];

  const totalPremium = policies.reduce((sum, row) => sum + Number((row as { premium: number | null }).premium ?? 0), 0);
  const activePolicies = policies.filter((row) => (row as { status: string }).status === "active").length;
  const renewalWon = renewals.filter((row) => (row as { status: string }).status === "renewed").length;
  const renewalLost = renewals.filter((row) => (row as { status: string }).status === "lost").length;

  const totalReserve = claims.reduce((sum, row) => sum + Number((row as { reserve_amount: number | null }).reserve_amount ?? 0), 0);
  const totalPaid = claims.reduce((sum, row) => sum + Number((row as { paid_amount: number | null }).paid_amount ?? 0), 0);

  const grossCommissions = commissions.reduce(
    (sum, row) => sum + Number((row as { gross_commission: number | null }).gross_commission ?? 0),
    0
  );
  const agencyRevenue = commissions.reduce(
    (sum, row) => sum + Number((row as { agency_share: number | null }).agency_share ?? 0),
    0
  );
  const paidCommissionCount = commissions.filter((row) => (row as { paid_status: string }).paid_status === "paid").length;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reports</h2>
        <p className="mt-1 text-sm text-slate-600">Production, retention, claims, and commission analytics for your account.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-[var(--border)] bg-white p-5">
          <p className="text-sm text-slate-600">Total Premium</p>
          <p className="mt-2 text-2xl font-bold text-[var(--primary)]">${totalPremium.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p className="mt-1 text-xs text-slate-500">{activePolicies} active policies</p>
        </article>

        <article className="rounded-xl border border-[var(--border)] bg-white p-5">
          <p className="text-sm text-slate-600">Renewal Outcomes</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{renewalWon} won / {renewalLost} lost</p>
          <p className="mt-1 text-xs text-slate-500">Based on tracked renewal statuses</p>
        </article>

        <article className="rounded-xl border border-[var(--border)] bg-white p-5">
          <p className="text-sm text-slate-600">Claims Financials</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">${totalPaid.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p className="mt-1 text-xs text-slate-500">Paid against ${totalReserve.toLocaleString(undefined, { maximumFractionDigits: 2 })} reserved</p>
        </article>

        <article className="rounded-xl border border-[var(--border)] bg-white p-5">
          <p className="text-sm text-slate-600">Commission Snapshot</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">${agencyRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          <p className="mt-1 text-xs text-slate-500">Agency share from ${grossCommissions.toLocaleString(undefined, { maximumFractionDigits: 2 })} gross ({paidCommissionCount} paid)</p>
        </article>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Operational Notes</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>Use Renewals and Claims modules to improve data quality for richer reporting.</li>
          <li>Paid commissions are based on entries where paid status is set to paid.</li>
          <li>Totals reflect current account data and update in real time.</li>
        </ul>
      </div>
    </section>
  );
}
