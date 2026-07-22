import Link from "next/link";

import { getUserContext } from "@/lib/account-context";
import { createClient } from "@/lib/supabase/server";

type LeadRow = {
  id: string;
  business_name: string | null;
  stage: string | null;
  line_of_business: string | null;
  ai_score: number | null;
  created_at: string | null;
};

export default async function LeadsPage() {
  const context = await getUserContext();
  const supabase = await createClient();

  const { data } = await supabase
    .from("leads")
    .select("id, business_name, stage, line_of_business, ai_score, created_at")
    .eq("account_id", context.accountId)
    .order("created_at", { ascending: false });

  const leads = (data ?? []) as LeadRow[];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Leads</h2>
          <p className="mt-1 text-sm text-slate-600">Manage inbound pipeline and progression stages.</p>
        </div>
        <Link href="/leads/new" className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
          Add Lead
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Business Name</th>
              <th className="px-4 py-3 font-semibold">Stage</th>
              <th className="px-4 py-3 font-semibold">Line of Business</th>
              <th className="px-4 py-3 font-semibold">AI Score</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 text-slate-900">{lead.business_name ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{lead.stage ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{lead.line_of_business ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">{lead.ai_score ?? "-"}</td>
                <td className="px-4 py-3 text-slate-700">
                  {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "-"}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}/edit`} className="font-medium text-[var(--primary)]">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No leads found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
