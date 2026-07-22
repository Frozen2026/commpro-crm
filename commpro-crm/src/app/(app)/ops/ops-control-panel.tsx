"use client";

import { useState, useTransition } from "react";

import { triggerOpsBrain } from "@/app/(app)/ops/actions";
import type { OpsRunResult } from "@/lib/ops-agent/types";

export function OpsControlPanel() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<OpsRunResult | null>(null);

  function run(mode: "dry_run" | "apply") {
    const fd = new FormData();
    fd.set("mode", mode);
    startTransition(async () => {
      const next = await triggerOpsBrain(fd);
      setResult(next);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run("dry_run")}
          className="rounded-md border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
        >
          {pending ? "Scanning…" : "Scan only (dry run)"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run("apply")}
          className="rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
        >
          {pending ? "Running…" : "Scan & auto-repair"}
        </button>
      </div>

      {result ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            result.status === "completed"
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-rose-200 bg-rose-50 text-rose-950"
          }`}
        >
          <p className="font-semibold">
            {result.status === "completed" ? "Run completed" : "Run failed"}
            {result.runId ? (
              <span className="ml-2 font-normal opacity-70">#{result.runId.slice(0, 8)}</span>
            ) : null}
          </p>
          <p className="mt-1 whitespace-pre-wrap">{result.summary}</p>
          {result.errorMessage ? (
            <p className="mt-2 text-xs">{result.errorMessage}</p>
          ) : null}

          {result.findings.length ? (
            <div className="mt-3 overflow-x-auto rounded-lg border border-black/10 bg-white/70">
              <table className="min-w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Severity</th>
                    <th className="px-3 py-2 font-semibold">Issue</th>
                    <th className="px-3 py-2 font-semibold">Auto-fix</th>
                  </tr>
                </thead>
                <tbody>
                  {result.findings.map((f) => (
                    <tr key={f.id} className="border-t border-slate-100 align-top">
                      <td className="px-3 py-2 capitalize">{f.severity}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium">{f.title}</p>
                        <p className="mt-0.5 text-slate-600">{f.detail}</p>
                      </td>
                      <td className="px-3 py-2">
                        {f.autoFixable ? f.suggestedAction || "Yes" : "Manual"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {result.repairs.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs">
              {result.repairs.map((r, idx) => (
                <li key={`${r.findingId}-${idx}`}>
                  <span className={r.ok ? "text-emerald-800" : "text-rose-800"}>
                    [{r.ok ? "ok" : "fail"}] {r.action}: {r.detail}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
