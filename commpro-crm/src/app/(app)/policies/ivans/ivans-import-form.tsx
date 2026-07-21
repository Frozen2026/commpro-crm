"use client";

import { useState, useTransition } from "react";

import type { IvansMailboxFile } from "@/lib/ivans/types";
import {
  importIvansUpload,
  listIvansMailbox,
  syncAllIvansMailbox,
  syncIvansMailboxFile,
  type IvansActionResult,
} from "@/app/(app)/policies/ivans/actions";

function ResultBanner({ result }: { result: IvansActionResult | null }) {
  if (!result) return null;
  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm ${
        result.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900"
      }`}
    >
      <p className="font-medium">{result.message}</p>
      {result.summary ? (
        <p className="mt-1 text-xs opacity-90">
          Clients +{result.summary.createdClients} / ~{result.summary.updatedClients} · Policies +
          {result.summary.createdPolicies} / ~{result.summary.updatedPolicies}
          {result.summary.skipped ? ` · skipped ${result.summary.skipped}` : ""}
        </p>
      ) : null}
      {result.warnings?.length ? (
        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs opacity-90">
          {result.warnings.slice(0, 8).map((w) => (
            <li key={w}>{w}</li>
          ))}
          {result.warnings.length > 8 ? (
            <li>…and {result.warnings.length - 8} more</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

export function IvansImportForm({ apiConfigured }: { apiConfigured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<IvansActionResult | null>(null);
  const [files, setFiles] = useState<IvansMailboxFile[]>([]);

  return (
    <div className="space-y-6">
      <ResultBanner result={result} />

      <section className="space-y-3 rounded-xl border border-[var(--border)] bg-white p-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">1. Upload Policy Center export</h3>
          <p className="mt-1 text-sm text-slate-600">
            Drop a CSV/TSV from IVANS Policy Center, an AL3 download, or a JSON policy list. Excel
            workbooks: save as CSV first.
          </p>
        </div>
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            startTransition(async () => {
              const next = await importIvansUpload(fd);
              setResult(next);
            });
          }}
        >
          <label className="block flex-1 text-sm text-slate-700">
            <span className="mb-1 block font-medium">File</span>
            <input
              name="file"
              type="file"
              accept=".csv,.tsv,.txt,.al3,.afi,.json,text/csv,application/json"
              required
              className="block w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
          >
            {pending ? "Importing…" : "Import file"}
          </button>
        </form>
        <p className="text-xs text-slate-500">
          Sample headers:{" "}
          <a
            href="/samples/ivans-policy-center-sample.csv"
            className="font-medium text-[#2563eb] hover:underline"
          >
            download sample CSV
          </a>
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-[var(--border)] bg-white p-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">2. Sync IVANS Exchange mailbox</h3>
          <p className="mt-1 text-sm text-slate-600">
            Pull carrier downloads via the File Transfer API (
            <code className="text-xs">GET /files</code>), parse AL3/CSV when possible, and upsert
            clients + policies.
          </p>
        </div>

        {!apiConfigured ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            API sync is disabled until you set{" "}
            <code className="text-xs">IVANS_API_ROOT</code>,{" "}
            <code className="text-xs">IVANS_ACCOUNT</code>,{" "}
            <code className="text-xs">IVANS_USERID</code>, and{" "}
            <code className="text-xs">IVANS_ACCESS_TOKEN</code> (or OAuth client credentials) in the
            server environment.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const next = await listIvansMailbox();
                  setResult(next);
                  setFiles(next.files ?? []);
                });
              }}
              className="rounded-md border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              List mailbox
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const next = await syncAllIvansMailbox();
                  setResult(next);
                  setFiles(next.files ?? files);
                });
              }}
              className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {pending ? "Syncing…" : "Sync all files"}
            </button>
          </div>
        )}

        {files.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-semibold">File</th>
                  <th className="px-3 py-2 font-semibold">Received</th>
                  <th className="px-3 py-2 font-semibold">Class</th>
                  <th className="px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2 text-slate-900">
                      {f.filename || f.remoteName || f.id}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{f.receivedAt || "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{f.classCode || "—"}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        disabled={pending || !apiConfigured}
                        onClick={() => {
                          startTransition(async () => {
                            const next = await syncIvansMailboxFile(f.id);
                            setResult(next);
                          });
                        }}
                        className="font-medium text-[#2563eb] hover:underline disabled:opacity-50"
                      >
                        Import
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
