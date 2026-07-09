import { getUserContext } from "@/lib/account-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const context = await getUserContext();
  const supabase = await createServerSupabaseClient();

  const [leadsCount, clientsCount, activePoliciesCount, premiumRows] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("account_id", context.accountId),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("account_id", context.accountId),
    supabase
      .from("policies")
      .select("id", { count: "exact", head: true })
      .eq("account_id", context.accountId)
      .eq("status", "active"),
    supabase
      .from("policies")
      .select("premium")
      .eq("account_id", context.accountId),
  ]);

  const totalPremium = (premiumRows.data ?? []).reduce((sum, row) => {
    const value = Number((row as { premium: number | null }).premium ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const cards = [
    {
      title: "Total Leads",
      value: leadsCount.count ?? 0,
    },
    {
      title: "Total Clients",
      value: clientsCount.count ?? 0,
    },
    {
      title: "Total Active Policies",
      value: activePoliciesCount.count ?? 0,
    },
    {
      title: "Total Premium",
      value: `$${totalPremium.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">Real-time account KPIs from your Supabase tenant.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.title} className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-600">{card.title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-[#2563eb]">{card.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
