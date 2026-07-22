"use client";

import { useState } from "react";

import { SHORT_WORKSPACE_SETUP_SQL } from "@/lib/short-workspace-setup-sql";

export function WorkspaceSetupSqlCopy() {
  const [copied, setCopied] = useState(false);

  async function copySql() {
    try {
      await navigator.clipboard.writeText(SHORT_WORKSPACE_SETUP_SQL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById("workspace-setup-sql") as HTMLTextAreaElement | null;
      el?.focus();
      el?.select();
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copySql}
          className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white"
        >
          {copied ? "Copied" : "Copy short setup SQL"}
        </button>
        <span className="text-xs text-slate-600">
          Open a <strong>new blank</strong> SQL Editor tab — do not re-run an old query that mentions{" "}
          <code>declare</code>.
        </span>
      </div>
      <textarea
        id="workspace-setup-sql"
        readOnly
        value={SHORT_WORKSPACE_SETUP_SQL}
        rows={14}
        className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-[11px] leading-snug text-slate-800"
        onFocus={(e) => e.currentTarget.select()}
      />
    </div>
  );
}
