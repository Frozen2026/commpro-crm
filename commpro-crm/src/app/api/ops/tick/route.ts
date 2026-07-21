import { NextResponse } from "next/server";

import { listOpsAccountScopes, runOpsBrain } from "@/lib/ops-agent/brain";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request) {
  const secret =
    process.env.OPS_CRON_SECRET?.trim() || process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const header = request.headers.get("authorization") || "";
  if (header === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  if (url.searchParams.get("secret") === secret) return true;

  // Vercel Cron sends Authorization: Bearer <CRON_SECRET> when configured
  return false;
}

/**
 * Autonomous Ops Brain wake endpoint.
 * POST /api/ops/tick  Authorization: Bearer $OPS_CRON_SECRET
 * Optional body: { mode?: "dry_run"|"apply", accountId?: string }
 */
export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { mode?: string; accountId?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const modeEnv = process.env.OPS_AUTO_APPLY?.trim();
  const mode =
    body.mode === "dry_run" || body.mode === "apply"
      ? body.mode
      : modeEnv === "false" || modeEnv === "0"
        ? "dry_run"
        : "apply";

  const scopes = await listOpsAccountScopes(supabaseAdmin);
  const filtered = body.accountId
    ? scopes.filter((s) => s.accountId === body.accountId)
    : scopes;

  if (!filtered.length) {
    return NextResponse.json({
      ok: false,
      error:
        "No agency scopes found. Set OPS_ACCOUNT_ID + OPS_AGENCY_ID or ensure agencies exist.",
    });
  }

  const results = [];
  for (const scope of filtered) {
    const result = await runOpsBrain({
      db: supabaseAdmin,
      accountId: scope.accountId,
      agencyId: scope.agencyId || null,
      trigger: "cron",
      mode,
      persist: true,
    });
    results.push({
      accountId: result.accountId,
      agencyId: result.agencyId,
      status: result.status,
      findings: result.findings.length,
      repairs: result.repairs.filter((r) => r.ok).length,
      summary: result.summary,
      runId: result.runId,
      errorMessage: result.errorMessage,
    });
  }

  return NextResponse.json({
    ok: true,
    mode,
    ran: results.length,
    results,
  });
}

export async function GET(request: Request) {
  // Allow Vercel cron GET pings with the same secret.
  return POST(request);
}
