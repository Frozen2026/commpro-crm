import { placeCallAction, sendSmsAction } from "@/app/(app)/twilio/actions";
import { getUserContext } from "@/lib/account-context";
import { createClient } from "@/lib/supabase/server";

export default async function TwilioPage() {
  const context = await getUserContext();
  const supabase = await createClient();

  const [{ data: smsRows }, { data: callRows }] = await Promise.all([
    supabase
      .from("sms_messages")
      .select("id, to_number, body, status, created_at")
      .eq("account_id", context.accountId)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("calls")
      .select("id, to_number, status, duration_seconds, created_at")
      .eq("account_id", context.accountId)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Twilio SMS/Calling</h2>
        <p className="mt-1 text-sm text-slate-600">Send outbound messages and place calls from CommPro workflows.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-[var(--border)] bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Send SMS</h3>
          <form action={sendSmsAction} className="mt-3 space-y-3">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">To Number</span>
              <input name="to_number" required placeholder="+15555551234" className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Message</span>
              <textarea name="body" rows={4} required placeholder="Hi, this is CommPro.ai following up on your policy review." className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
            </label>
            <button type="submit" className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
              Send SMS
            </button>
          </form>
        </article>

        <article className="rounded-xl border border-[var(--border)] bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Place Call</h3>
          <form action={placeCallAction} className="mt-3 space-y-3">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">To Number</span>
              <input name="to_number" required placeholder="+15555551234" className="w-full rounded-md border border-[var(--border)] px-3 py-2" />
            </label>
            <button type="submit" className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
              Place Call
            </button>
          </form>
          <p className="mt-3 text-xs text-slate-500">Call script URL defaults to Twilio demo voice unless TWILIO_VOICE_URL is set.</p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
          <h3 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold text-slate-900">Recent SMS</h3>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(smsRows ?? []).map((row) => (
                <tr key={row.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">{row.to_number}</td>
                  <td className="px-4 py-3">{row.body}</td>
                  <td className="px-4 py-3">{row.status}</td>
                </tr>
              ))}
              {(smsRows ?? []).length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={3}>
                    No SMS activity yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </article>

        <article className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
          <h3 className="border-b border-[var(--border)] px-4 py-3 text-sm font-semibold text-slate-900">Recent Calls</h3>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {(callRows ?? []).map((row) => (
                <tr key={row.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">{row.to_number}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">{row.duration_seconds ?? 0}s</td>
                </tr>
              ))}
              {(callRows ?? []).length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={3}>
                    No call activity yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </article>
      </div>
    </section>
  );
}
