type RenewalRow = {
  id: string;
  renewal_date: string;
  status: string;
  ai_risk_score: number | null;
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
  upcoming: "bg-sky-100 text-sky-700",
  contacted: "bg-amber-100 text-amber-700",
  quoted: "bg-indigo-100 text-indigo-700",
  renewed: "bg-emerald-100 text-emerald-700",
  lost: "bg-rose-100 text-rose-700",
};

function aiRiskBadge(score: number | null) {
  if (score == null) {
    return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">N/A</span>;
  }

  if (score > 70) {
    return <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">{score}</span>;
  }

  if (score >= 40) {
    return <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">{score}</span>;
  }

  return <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">{score}</span>;
}

export default async function RenewalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = (params.status ?? "").trim();

  const { createClient } = await import("@/lib/supabase/server");
  const { getUserContext } = await import("@/lib/account-context");

  await getUserContext();
  const supabase = await createClient();

  let query = supabase
    .from("renewals")
    .select("id, renewal_date, status, ai_risk_score, policies ( policy_number, clients ( business_name, first_name, last_name ) )")
    .order("renewal_date", { ascending: true });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data } = await query;

  const renewals = ((data ?? []) as RenewalRow[]).filter((renewal) => {
    const policy = renewal.policies?.[0];
    const hasClient = policy?.clients?.[0];
    return Boolean(hasClient);
  });

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Renewals</h2>
        <p className="mt-1 text-sm text-slate-600">Renewal pipeline with AI risk prioritization.</p>
      </div>

      <form className="rounded-xl border border-[var(--border)] bg-white p-4">
        <label className="block text-sm font-medium text-slate-700">Status Filter</label>
        <div className="mt-2 flex gap-3">
          <select name="status" defaultValue={statusFilter} className="rounded-md border border-[var(--border)] px-3 py-2 text-sm">
            <option value="">All statuses</option>
            <option value="upcoming">upcoming</option>
            <option value="contacted">contacted</option>
            <option value="quoted">quoted</option>
            <option value="renewed">renewed</option>
            <option value="lost">lost</option>
          </select>
          <button type="submit" className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
            Apply
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Client Name</th>
              <th className="px-4 py-3 font-semibold">Policy Number</th>
              <th className="px-4 py-3 font-semibold">Renewal Date</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">AI Risk Score</th>
            </tr>
          </thead>
          <tbody>
            {renewals.map((renewal) => {
              const policy = renewal.policies?.[0] ?? null;
              const client = policy?.clients?.[0] ?? null;
              const clientName =
                client?.business_name ||
                [client?.first_name, client?.last_name].filter(Boolean).join(" ") ||
                "-";

              const statusClass = statusClasses[renewal.status] ?? "bg-slate-100 text-slate-700";

              return (
                <tr key={renewal.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3 text-slate-900">{clientName}</td>
                  <td className="px-4 py-3 text-slate-700">{policy?.policy_number ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{renewal.renewal_date}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass}`}>{renewal.status}</span>
                  </td>
                  <td className="px-4 py-3">{aiRiskBadge(renewal.ai_risk_score)}</td>
                </tr>
              );
            })}
            {renewals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No renewals found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
