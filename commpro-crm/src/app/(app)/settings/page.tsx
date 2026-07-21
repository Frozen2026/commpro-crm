import { getUserContext } from "@/lib/account-context";
import { createClient } from "@/lib/supabase/server";

function statusClass(value: boolean) {
  return value ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700";
}

export default async function SettingsPage() {
  const context = await getUserContext();
  const supabase = await createClient();

  const [{ data: agency }, { data: profile }] = await Promise.all([
    context.agencyId
      ? supabase
          .from("agencies")
          .select("name, phone, producer_name, producer_email")
          .eq("id", context.agencyId)
          .maybeSingle()
      : supabase
          .from("agencies")
          .select("name, phone, producer_name, producer_email")
          .eq("account_id", context.accountId)
          .limit(1)
          .maybeSingle(),
    supabase
      .from("agent_profiles")
      .select("phone")
      .eq("id", context.userId)
      .maybeSingle(),
  ]);

  const twilioConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const opsCronConfigured = Boolean(
    process.env.OPS_CRON_SECRET?.trim() || process.env.CRON_SECRET?.trim()
  );

  const { data: lastOpsRun } = await supabase
    .from("ops_runs")
    .select("status, started_at, findings_count, repairs_count, summary")
    .eq("account_id", context.accountId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="mt-1 text-sm text-slate-600">Workspace profile, agency contact details, and integration readiness.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-[var(--border)] bg-white p-5 xl:col-span-2">
          <h3 className="text-sm font-semibold text-slate-900">Agency Profile</h3>
          <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="text-slate-500">Agency Name</dt>
              <dd className="font-medium text-slate-900">{agency?.name ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Agency Phone</dt>
              <dd className="font-medium text-slate-900">{agency?.phone ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Producer Name</dt>
              <dd className="font-medium text-slate-900">{agency?.producer_name ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Producer Email</dt>
              <dd className="font-medium text-slate-900">{agency?.producer_email ?? "Not set"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Your Agent Phone</dt>
              <dd className="font-medium text-slate-900">{profile?.phone ?? "Not set"}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-xl border border-[var(--border)] bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Environment Health</h3>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600">Supabase Keys</span>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(supabaseConfigured)}`}>
                {supabaseConfigured ? "Configured" : "Missing"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600">Twilio Credentials</span>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(twilioConfigured)}`}>
                {twilioConfigured ? "Configured" : "Missing"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600">Ops Brain Cron</span>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(opsCronConfigured)}`}>
                {opsCronConfigured ? "Configured" : "Missing"}
              </span>
            </div>
            <div className="border-t border-[var(--border)] pt-3">
              <p className="text-slate-600">Last Ops Brain run</p>
              {lastOpsRun ? (
                <p className="mt-1 text-xs text-slate-700">
                  {lastOpsRun.status} · {lastOpsRun.findings_count ?? 0} findings ·{" "}
                  {lastOpsRun.repairs_count ?? 0} repairs
                  {lastOpsRun.started_at
                    ? ` · ${new Date(lastOpsRun.started_at).toLocaleString()}`
                    : ""}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">No runs yet — open Ops Brain to scan.</p>
              )}
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Next Configuration Steps</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>Set Twilio environment values in your deployment target for outbound SMS and voice.</li>
          <li>Use the Twilio module to place test calls and verify delivery statuses.</li>
          <li>
            Apply <code className="text-xs">20260722000000_ops_brain.sql</code>, set{" "}
            <code className="text-xs">OPS_CRON_SECRET</code>, and schedule{" "}
            <code className="text-xs">POST /api/ops/tick</code> (Vercel Cron is wired in vercel.json).
          </li>
          <li>Add role-specific settings controls after permission screens are finalized.</li>
        </ul>
      </article>
    </section>
  );
}
