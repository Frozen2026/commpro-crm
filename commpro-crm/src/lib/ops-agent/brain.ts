import { collectOpsFindings } from "@/lib/ops-agent/checks";
import { applyOpsRepairs } from "@/lib/ops-agent/repairs";
import type {
  OpsMode,
  OpsRunResult,
  OpsTrigger,
} from "@/lib/ops-agent/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = { from: (table: string) => any };

function buildSummary(result: Pick<OpsRunResult, "findings" | "repairs" | "mode">) {
  const errors = result.findings.filter((f) => f.severity === "error").length;
  const warnings = result.findings.filter((f) => f.severity === "warning").length;
  const infos = result.findings.filter((f) => f.severity === "info").length;
  const applied = result.repairs.filter((r) => r.ok).length;
  const failed = result.repairs.filter((r) => !r.ok).length;

  if (!result.findings.length) {
    return "Ops Brain scan clean — no data-quality issues detected.";
  }

  const parts = [
    `Found ${result.findings.length} issue(s) (${errors} error, ${warnings} warning, ${infos} info).`,
  ];
  if (result.mode === "dry_run") {
    parts.push(
      `${result.findings.filter((f) => f.autoFixable).length} auto-fixable (dry run — no writes).`
    );
  } else {
    parts.push(`Applied ${applied} repair(s)${failed ? `, ${failed} failed` : ""}.`);
  }
  return parts.join(" ");
}

/**
 * Optional LLM narrative when OPENAI_API_KEY is set.
 * Never executes tools — summary/prioritization only.
 */
async function maybeLlmNarrative(
  findings: OpsRunResult["findings"],
  repairs: OpsRunResult["repairs"]
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey || !findings.length) return null;

  try {
    const payload = {
      model: process.env.OPS_BRAIN_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 220,
      messages: [
        {
          role: "system",
          content:
            "You are CommPro Ops Brain. In 2-4 short sentences, prioritize the findings for an insurance agency CRM operator. Do not invent issues. No markdown.",
        },
        {
          role: "user",
          content: JSON.stringify({
            findings: findings.slice(0, 20).map((f) => ({
              severity: f.severity,
              title: f.title,
              detail: f.detail,
              autoFixable: f.autoFixable,
            })),
            repairs: repairs.slice(0, 20).map((r) => ({
              action: r.action,
              ok: r.ok,
              detail: r.detail,
            })),
          }),
        },
      ],
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return json.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export async function runOpsBrain(params: {
  db: Db;
  accountId: string;
  agencyId: string | null;
  trigger?: OpsTrigger;
  mode?: OpsMode;
  persist?: boolean;
}): Promise<OpsRunResult> {
  const startedAt = new Date().toISOString();
  const trigger = params.trigger || "manual";
  const mode = params.mode || "apply";
  const persist = params.persist !== false;

  let runId: string | undefined;

  if (persist) {
    try {
      const { data: inserted, error } = await params.db
        .from("ops_runs")
        .insert({
          account_id: params.accountId,
          agency_id: params.agencyId,
          trigger,
          mode,
          status: "running",
          started_at: startedAt,
        })
        .select("id")
        .maybeSingle();
      if (!error) runId = inserted?.id;
    } catch {
      // Table may not exist until migration is applied — continue without persistence.
    }
  }

  try {
    if (!params.agencyId && mode === "apply") {
      // Still allow dry_run diagnostics without agency
    }

    const findings = await collectOpsFindings(params.db, params.accountId);
    let repairs: OpsRunResult["repairs"] = [];

    if (mode === "apply" && params.agencyId) {
      repairs = await applyOpsRepairs({
        db: params.db,
        accountId: params.accountId,
        agencyId: params.agencyId,
        findings,
      });
    } else if (mode === "apply" && !params.agencyId) {
      repairs = findings
        .filter((f) => f.autoFixable)
        .map((f) => ({
          findingId: f.id,
          checkId: f.checkId,
          action: "skipped_no_agency",
          ok: false,
          detail: "Cannot apply repairs without an agency_id on this account.",
          resourceType: f.resourceType,
          resourceId: f.resourceId,
        }));
    }

    let summary = buildSummary({ findings, repairs, mode });
    const narrative = await maybeLlmNarrative(findings, repairs);
    if (narrative) {
      summary = `${summary}\n\n${narrative}`;
    }

    const finishedAt = new Date().toISOString();
    const result: OpsRunResult = {
      accountId: params.accountId,
      agencyId: params.agencyId,
      trigger,
      mode,
      status: "completed",
      findings,
      repairs,
      summary,
      startedAt,
      finishedAt,
      runId,
    };

    if (runId) {
      await params.db
        .from("ops_runs")
        .update({
          status: "completed",
          findings_count: findings.length,
          repairs_count: repairs.filter((r) => r.ok).length,
          summary,
          findings,
          repairs,
          finished_at: finishedAt,
        })
        .eq("id", runId);
    }

    return result;
  } catch (err) {
    const finishedAt = new Date().toISOString();
    const errorMessage = err instanceof Error ? err.message : "Ops Brain failed";
    if (runId) {
      await params.db
        .from("ops_runs")
        .update({
          status: "failed",
          error_message: errorMessage,
          finished_at: finishedAt,
        })
        .eq("id", runId);
    }
    return {
      accountId: params.accountId,
      agencyId: params.agencyId,
      trigger,
      mode,
      status: "failed",
      findings: [],
      repairs: [],
      summary: "Ops Brain run failed.",
      errorMessage,
      startedAt,
      finishedAt,
      runId,
    };
  }
}

/** List tenant scopes for cron (agencies table is the stable multi-tenant unit). */
export async function listOpsAccountScopes(db: Db): Promise<
  { accountId: string; agencyId: string }[]
> {
  const single = process.env.OPS_ACCOUNT_ID?.trim();
  let singleAgency = process.env.OPS_AGENCY_ID?.trim();

  if (single) {
    if (!singleAgency) {
      const { data } = await db
        .from("agencies")
        .select("id")
        .eq("account_id", single)
        .limit(1)
        .maybeSingle();
      singleAgency = data?.id ? String(data.id) : "";
    }
    if (!singleAgency) return [];
    return [{ accountId: single, agencyId: singleAgency }];
  }

  const { data } = await db
    .from("agencies")
    .select("id, account_id, status")
    .limit(200);

  return (data ?? [])
    .filter((a: { id?: string; account_id?: string; status?: string | null }) => {
      if (!a.id || !a.account_id) return false;
      if (a.status && a.status !== "active") return false;
      return true;
    })
    .map((a: { id: string; account_id: string }) => ({
      accountId: a.account_id,
      agencyId: a.id,
    }));
}
