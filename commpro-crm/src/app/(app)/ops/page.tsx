import Link from "next/link";

import { getRecentOpsRuns } from "@/app/(app)/ops/actions";
import { OpsControlPanel } from "@/app/(app)/ops/ops-control-panel";

export default async function OpsBrainPage() {
  const { runs, error } = await getRecentOpsRuns(12);
  const cronConfigured = Boolean(
    process.env.OPS_CRON_SECRET?.trim() || process.env.CRON_SECRET?.trim()
  );
  const llmConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Ops Brain</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Autonomous backend agent that scans tenant data for integrity issues and applies safe
          repairs — expired policies still marked active, missing renewal rows, overdue renewals
          without tasks, stale website COI leads, and clients missing contact info.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-sm">
          <p className="text-slate-500">Cron wake</p>
          <p className="mt-1 font-semibold text-slate-900">
            {cronConfigured ? "Secret configured" : "Set OPS_CRON_SECRET"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            <code className="text-[11px]">POST /api/ops/tick</code>
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-sm">
          <p className="text-slate-500">LLM narrative</p>
          <p className="mt-1 font-semibold text-slate-900">
            {llmConfigured ? "OpenAI enabled" : "Rule-based only"}
          </p>
          <p className="mt-1 text-xs text-slate-500">Optional OPENAI_API_KEY for summaries</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 text-sm">
          <p className="text-slate-500">Safety</p>
          <p className="mt-1 font-semibold text-slate-900">Allow-listed repairs only</p>
          <p className="mt-1 text-xs text-slate-500">No arbitrary SQL or destructive deletes</p>
        </div>
      </div>

      <article className="space-y-3 rounded-xl border border-[var(--border)] bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Run now</h3>
        <OpsControlPanel />
      </article>

      <article className="space-y-3 rounded-xl border border-[var(--border)] bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Recent runs</h3>
          <Link href="/settings" className="text-xs font-medium text-[#2563eb]">
            Settings health
          </Link>
        </div>

        {error ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Could not load run history ({error}). Apply migration{" "}
            <code className="text-xs">20260722000000_ops_brain.sql</code> in Supabase, then retry.
          </p>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2 font-semibold">When</th>
                <th className="px-3 py-2 font-semibold">Trigger</th>
                <th className="px-3 py-2 font-semibold">Mode</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Findings</th>
                <th className="px-3 py-2 font-semibold">Repairs</th>
                <th className="px-3 py-2 font-semibold">Summary</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-t border-[var(--border)] align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-slate-700">
                    {run.started_at
                      ? new Date(run.started_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{run.trigger}</td>
                  <td className="px-3 py-2 text-slate-700">{run.mode}</td>
                  <td className="px-3 py-2 text-slate-700">{run.status}</td>
                  <td className="px-3 py-2 text-slate-700">{run.findings_count}</td>
                  <td className="px-3 py-2 text-slate-700">{run.repairs_count}</td>
                  <td className="max-w-md px-3 py-2 text-slate-600">
                    <p className="line-clamp-3 whitespace-pre-wrap">
                      {run.error_message || run.summary || "—"}
                    </p>
                  </td>
                </tr>
              ))}
              {!runs.length && !error ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                    No ops runs yet. Start with a dry-run scan.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
