"use client";

import { useState } from "react";

import { WORKSPACE_SETUP_SQL } from "@/lib/workspace-setup-sql";

export function WorkspaceSetupSqlCopy() {
  const [copied, setCopied] = useState(false);

  async function copySql() {
    try {
      await navigator.clipboard.writeText(WORKSPACE_SETUP_SQL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select textarea contents
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
          {copied ? "Copied" : "Copy setup SQL"}
        </button>
        <span className="text-xs text-slate-600">
          Then open a <strong>new blank</strong> SQL Editor tab (do not reuse an old query).
        </span>
      </div>
      <textarea
        id="workspace-setup-sql"
        readOnly
        value={WORKSPACE_SETUP_SQL}
        rows={12}
        className="w-full rounded border border-slate-200 bg-white p-2 font-mono text-[11px] leading-snug text-slate-800"
        onFocus={(e) => e.currentTarget.select()}
      />
    </div>
  );
}
