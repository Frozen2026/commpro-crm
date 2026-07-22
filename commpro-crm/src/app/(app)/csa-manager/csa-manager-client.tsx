"use client";

import { type FormEvent, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type ScoreRow = {
  id: string;
  business_name: string | null;
  source: string | null;
  ai_score: number | null;
  external_id: string | null;
};

type AlertRow = {
  id: string;
  dot_number: string;
  severity: string;
  reason: string;
  status: string;
  created_at: string;
};

export function CsaManagerClient({
  dotNumber,
  scoreRows,
  alerts,
}: {
  dotNumber: string;
  scoreRows: ScoreRow[];
  alerts: AlertRow[];
}) {
  const [tab, setTab] = useState<"score" | "alerts" | "lead-generator">("score");
  const [state, setState] = useState("TX");
  const [reason, setReason] = useState("Unsafe Driving");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>("");
  const supabase = useMemo(() => createClient(), []);

  const callLeadGenerator = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResponse("");

    const { data, error } = await supabase.functions.invoke("csa-lead-generator", {
      body: {
        state,
        reason,
      },
    });

    setLoading(false);

    if (error) {
      setResponse(`Error: ${error.message}`);
      return;
    }

    setResponse(JSON.stringify(data, null, 2));
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">CSA Manager</h2>
        <p className="mt-1 text-sm text-slate-600">Score monitoring, alerts, and lead generation workflows.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "score", label: "Score Monitor" },
          { key: "alerts", label: "Alerts" },
          { key: "lead-generator", label: "Lead Generator" },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key as "score" | "alerts" | "lead-generator")}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              tab === item.key ? "bg-[var(--primary)] text-white" : "bg-white text-slate-700 border border-[var(--border)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "score" ? (
        <div className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-5">
          <form className="flex flex-wrap items-end gap-3">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">DOT Number</span>
              <input name="dot" defaultValue={dotNumber} placeholder="Search by DOT" className="rounded-md border border-[var(--border)] px-3 py-2" />
            </label>
            <button type="submit" className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95">
              Search
            </button>
          </form>

          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2">Business Name</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">AI Score</th>
                  <th className="px-3 py-2">DOT</th>
                </tr>
              </thead>
              <tbody>
                {scoreRows.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2">{row.business_name ?? "-"}</td>
                    <td className="px-3 py-2">{row.source ?? "-"}</td>
                    <td className="px-3 py-2">{row.ai_score ?? "-"}</td>
                    <td className="px-3 py-2">{row.external_id ?? "-"}</td>
                  </tr>
                ))}
                {scoreRows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-500" colSpan={4}>
                      No score monitor records found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "alerts" ? (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">DOT Number</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">{alert.dot_number}</td>
                  <td className="px-4 py-3">{alert.severity}</td>
                  <td className="px-4 py-3">{alert.reason}</td>
                  <td className="px-4 py-3">{alert.status}</td>
                  <td className="px-4 py-3">{new Date(alert.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {alerts.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                    No CSA alerts found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "lead-generator" ? (
        <form onSubmit={callLeadGenerator} className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">State</span>
              <select value={state} onChange={(event) => setState(event.target.value)} className="w-full rounded-md border border-[var(--border)] px-3 py-2">
                {[
                  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
                ].map((abbr) => (
                  <option key={abbr} value={abbr}>
                    {abbr}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Reason</span>
              <select value={reason} onChange={(event) => setReason(event.target.value)} className="w-full rounded-md border border-[var(--border)] px-3 py-2">
                {["Unsafe Driving", "Vehicle Maintenance", "Crash Indicator", "Hours of Service", "Driver Fitness"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button type="submit" disabled={loading} className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-70">
            {loading ? "Generating..." : "Run Lead Generator"}
          </button>

          {response ? (
            <pre className="overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">{response}</pre>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
